package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Test controller for cart operations
 */
@RestController
@RequestMapping("/api/test/cart")
public class TestCartController {

    private static final Logger logger = LoggerFactory.getLogger(TestCartController.class);

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public TestCartController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Test endpoint to directly insert a cart item
     * @param productId the product ID
     * @param quantity the quantity
     * @return the response entity
     */
    @GetMapping("/add/{productId}/{quantity}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> testAddToCart(
            @PathVariable("productId") Integer productId,
            @PathVariable("quantity") Integer quantity) {

        logger.info("Test adding product {} to cart with quantity {}", productId, quantity);

        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            logger.info("User ID: {}", userId);

            // Step 1: Check if cart exists
            String findCartSql = "SELECT cart_id FROM carts WHERE user_id = ? AND status = 'ACTIVE'";
            Integer cartId = null;
            try {
                cartId = jdbcTemplate.queryForObject(findCartSql, Integer.class, userId);
                logger.info("Found existing cart: {}", cartId);
            } catch (Exception e) {
                logger.info("No cart found, creating new cart");

                // Create new cart
                String createCartSql = "INSERT INTO carts (user_id, total_price, total_quantity, status, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";
                jdbcTemplate.update(createCartSql, userId, BigDecimal.ZERO, 0, "ACTIVE",
                        Timestamp.valueOf(LocalDateTime.now()), Timestamp.valueOf(LocalDateTime.now()));

                // Get the new cart ID
                cartId = jdbcTemplate.queryForObject(findCartSql, Integer.class, userId);
                logger.info("Created new cart: {}", cartId);
            }

            // Step 2: Get product price
            String findPriceSql = "SELECT price FROM products WHERE product_id = ?";
            BigDecimal price = jdbcTemplate.queryForObject(findPriceSql, BigDecimal.class, productId);
            logger.info("Product price: {}", price);

            // Step 3: Check if product already in cart
            String checkItemSql = "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?";
            try {
                Map<String, Object> item = jdbcTemplate.queryForMap(checkItemSql, cartId, productId);
                Integer cartItemId = (Integer) item.get("cart_item_id");
                Integer currentQuantity = (Integer) item.get("quantity");
                logger.info("Product already in cart, item ID: {}, current quantity: {}", cartItemId, currentQuantity);

                // Update quantity
                String updateItemSql = "UPDATE cart_items SET quantity = ?, price = ?, updated_at = ? WHERE cart_item_id = ?";
                int updateResult = jdbcTemplate.update(updateItemSql, quantity, price,
                        Timestamp.valueOf(LocalDateTime.now()), cartItemId);
                logger.info("Updated cart item, result: {}", updateResult);
            } catch (Exception e) {
                logger.info("Product not in cart, adding new item");

                // Insert new item
                String insertItemSql = "INSERT INTO cart_items (cart_id, product_id, quantity, price, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?)";
                int insertResult = jdbcTemplate.update(insertItemSql, cartId, productId, quantity, price,
                        Timestamp.valueOf(LocalDateTime.now()), Timestamp.valueOf(LocalDateTime.now()));
                logger.info("Inserted new cart item, result: {}", insertResult);
            }

            // Step 4: Update cart totals
            String totalsSql = "SELECT SUM(quantity) as total_quantity, SUM(quantity * price) as total_price " +
                    "FROM cart_items WHERE cart_id = ?";
            Map<String, Object> totals = jdbcTemplate.queryForMap(totalsSql, cartId);
            BigDecimal totalPrice = (BigDecimal) totals.get("total_price");
            Long totalQuantityLong = (Long) totals.get("total_quantity");
            int totalQuantity = totalQuantityLong != null ? totalQuantityLong.intValue() : 0;

            String updateCartSql = "UPDATE carts SET total_price = ?, total_quantity = ?, updated_at = ? WHERE cart_id = ?";
            int updateCartResult = jdbcTemplate.update(updateCartSql, totalPrice, totalQuantity,
                    Timestamp.valueOf(LocalDateTime.now()), cartId);
            logger.info("Updated cart totals, result: {}", updateCartResult);

            // Step 5: Return success response with details
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cartId", cartId);
            response.put("userId", userId);
            response.put("productId", productId);
            response.put("quantity", quantity);
            response.put("price", price);
            response.put("totalPrice", totalPrice);
            response.put("totalQuantity", totalQuantity);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error in test add to cart: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error adding product to cart: " + e.getMessage()));
        }
    }

    /**
     * Test endpoint to check cart items
     * @return the response entity
     */
    @GetMapping("/check")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> testCheckCart() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Step 1: Check if cart exists
            String findCartSql = "SELECT cart_id, total_price, total_quantity FROM carts WHERE user_id = ? AND status = 'ACTIVE'";
            Map<String, Object> cart = jdbcTemplate.queryForMap(findCartSql, userId);
            Integer cartId = (Integer) cart.get("cart_id");

            // Step 2: Get cart items
            String findItemsSql = "SELECT ci.cart_item_id, ci.product_id, p.product_name, ci.quantity, ci.price, " +
                    "ci.created_at, ci.updated_at " +
                    "FROM cart_items ci " +
                    "JOIN products p ON ci.product_id = p.product_id " +
                    "WHERE ci.cart_id = ?";

            try {
                // Try to get cart items
                List<Map<String, Object>> items = jdbcTemplate.queryForList(findItemsSql, cartId);

                // Step 3: Return success response with details
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("cart", cart);
                response.put("items", items);

                return ResponseEntity.ok(response);
            } catch (Exception e) {
                logger.error("Error getting cart items: {}", e.getMessage(), e);

                // Return cart without items
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("cart", cart);
                response.put("items", "Error getting items: " + e.getMessage());

                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            logger.error("Error checking cart: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error checking cart: " + e.getMessage()));
        }
    }
}
