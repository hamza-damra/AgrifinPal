package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.dto.CartItemRequest;
import com.example.agrifinpalestine.dto.CartItemResponse;
import com.example.agrifinpalestine.exception.inventory.InsufficientInventoryException;
import com.example.agrifinpalestine.exception.cart.ProductAlreadyInCartException;
import com.example.agrifinpalestine.exception.user.UnauthorizedAccessException;
import com.example.agrifinpalestine.exception.user.UserNotFoundException;
import com.example.agrifinpalestine.security.CartSecurityUtils;
import com.example.agrifinpalestine.security.TokenManager;
import com.example.agrifinpalestine.service.CartCleanupService;
import com.example.agrifinpalestine.service.CartItemService;
import com.example.agrifinpalestine.service.CartService;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for cart operations
 */
@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    private final CartService cartService;
    private final CartItemService cartItemService;
    private final CartSecurityUtils cartSecurityUtils;
    private final TokenManager tokenManager;
    private final CartCleanupService cartCleanupService;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;

    @Autowired
    public CartController(CartService cartService, CartItemService cartItemService,
                         CartSecurityUtils cartSecurityUtils, TokenManager tokenManager,
                         CartCleanupService cartCleanupService, CartRepository cartRepository,
                         CartItemRepository cartItemRepository, JdbcTemplate jdbcTemplate,
                         UserRepository userRepository) {
        this.cartService = cartService;
        this.cartItemService = cartItemService;
        this.cartSecurityUtils = cartSecurityUtils;
        this.tokenManager = tokenManager;
        this.cartCleanupService = cartCleanupService;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
    }

    /**
     * Get the current user's cart items
     * @param request the HTTP request containing the token
     * @return the cart items
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCart(HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Getting cart for user {}", userId);

            // Get cart items using service
            List<CartItemResponse> cartItems = cartItemService.getCartItems(userId);

            return ResponseEntity.ok(cartItems);
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("Error getting cart: {}", e.getMessage(), e);

            String errorMessage = "Error getting cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    /**
     * Add a product to the cart
     * @param cartItemRequest the cart item request
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @PostMapping("/add")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> addToCart(@RequestBody CartItemRequest cartItemRequest, HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Adding product {} to cart for user {}", cartItemRequest.getProductId(), userId);

            // Add to cart using service
            CartItemResponse cartItemResponse = cartItemService.addToCart(userId, cartItemRequest);

            return ResponseEntity.ok(cartItemResponse);
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (ProductAlreadyInCartException e) {
            logger.warn("Product already in cart: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage(), e.getExistingItem()));
        } catch (InsufficientInventoryException e) {
            logger.warn("Insufficient inventory: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error adding product to cart: {}", e.getMessage(), e);

            String errorMessage = "Error adding product to cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    /**
     * Check if a product is in the cart
     * @param productId the product ID
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @GetMapping("/check/{productId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> isProductInCart(@PathVariable Integer productId, HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Checking if product {} is in cart for user {}", productId, userId);

            // Check if product is in cart
            boolean inCart = cartItemService.isProductInCart(userId, productId);

            return ResponseEntity.ok(new ApiResponse(true, inCart ? "Product is in cart" : "Product is not in cart", inCart));
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("Error checking if product is in cart: {}", e.getMessage(), e);

            String errorMessage = "Error checking if product is in cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    /**
     * Clear the cart
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @DeleteMapping("/clear")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> clearCart(HttpServletRequest request) {
        // Initialize userId outside try-catch so it's available in all blocks
        Integer userId = null;

        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Clearing cart for user {}", userId);

            // Clear cart
            boolean cleared = cartItemService.clearCart(userId);

            if (cleared) {
                // Create a response with cart status information
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("cartStatus", "CLEARED");
                responseData.put("timestamp", LocalDateTime.now());
                responseData.put("userId", userId);

                return ResponseEntity.ok(new ApiResponse(true, "Cart cleared successfully", responseData));
            } else {
                // Create a response with cart status information
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("cartStatus", "NO_ACTIVE_CART");
                responseData.put("timestamp", LocalDateTime.now());
                responseData.put("userId", userId);

                return ResponseEntity.ok(new ApiResponse(true, "No active cart found to clear", responseData));
            }
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("Error clearing cart: {}", e.getMessage(), e);

            String errorMessage = "Error clearing cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            // Create error response data
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("errorType", e.getClass().getSimpleName());
            errorData.put("timestamp", LocalDateTime.now());
            // Only include userId if it was successfully retrieved
            if (userId != null) {
                errorData.put("userId", userId);
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage, errorData));
        }
    }

    /**
     * Update a cart item
     * @param cartItemId the cart item ID
     * @param cartItemRequest the cart item request
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @PutMapping("/{cartItemId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> updateCartItem(
            @PathVariable Integer cartItemId,
            @RequestBody CartItemRequest cartItemRequest,
            HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Updating cart item {} for user {} with quantity {}",
                    cartItemId, userId, cartItemRequest.getQuantity());

            // Update cart item
            CartItemResponse response = cartItemService.updateCartItem(userId, cartItemId, cartItemRequest);

            return ResponseEntity.ok(response);
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (InsufficientInventoryException e) {
            logger.warn("Insufficient inventory: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating cart item: {}", e.getMessage(), e);

            String errorMessage = "Error updating cart item: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    /**
     * Remove a cart item
     * @param cartItemId the cart item ID
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @DeleteMapping("/{cartItemId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> removeFromCart(@PathVariable Integer cartItemId, HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("Removing cart item {} for user {}", cartItemId, userId);

            // Remove from cart
            boolean removed = cartItemService.removeFromCart(userId, cartItemId);

            if (removed) {
                return ResponseEntity.ok(new ApiResponse(true, "Item removed from cart successfully"));
            } else {
                return ResponseEntity.ok(new ApiResponse(false, "Item not found in cart"));
            }
        } catch (UnauthorizedAccessException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("Error removing item from cart: {}", e.getMessage(), e);

            String errorMessage = "Error removing item from cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage));
        }
    }

    /**
     * Clear the cart after a successful payment
     * This method uses multiple approaches to ensure the cart is properly cleared
     * @param request the HTTP request containing the token
     * @param orderId the ID of the order that was created from the cart (optional)
     * @return the response entity with details about the clearing process
     */
    @DeleteMapping("/clear-after-payment")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> clearCartAfterPayment(HttpServletRequest request,
            @RequestParam(required = false) Integer orderId) {
        // Initialize userId outside try-catch so it's available in all blocks
        Integer userId = null;
        Map<String, Object> responseData = new HashMap<>();
        boolean overallSuccess = false;

        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("[PAYMENT_CLEANUP] Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            userId = cartSecurityUtils.getCurrentUserId();
            logger.info("[PAYMENT_CLEANUP] Starting cart cleanup after payment for user {}", userId);
            responseData.put("userId", userId);
            responseData.put("timestamp", LocalDateTime.now());
            responseData.put("orderId", orderId);

            // Check if user has any cart items before processing
            List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            int initialItemCount = initialCartItems.size();
            logger.info("[PAYMENT_CLEANUP] User has {} cart items before cleanup", initialItemCount);
            responseData.put("initialItemCount", initialItemCount);

            if (initialItemCount == 0) {
                logger.info("[PAYMENT_CLEANUP] Cart is already empty, nothing to clean up");
                responseData.put("cartStatus", "ALREADY_EMPTY");
                responseData.put("message", "Cart is already empty");
                return ResponseEntity.ok(new ApiResponse(true, "Cart is already empty", responseData));
            }

            // APPROACH 1: Use CartItemService's clearCart method
            boolean approach1Success = false;
            try {
                logger.info("[PAYMENT_CLEANUP] APPROACH 1: Using CartItemService.clearCart");
                boolean cleared = cartItemService.clearCart(userId);
                logger.info("[PAYMENT_CLEANUP] APPROACH 1 result: {}", cleared);
                approach1Success = cleared;
                responseData.put("approach1", cleared ? "SUCCESS" : "FAILED");
            } catch (Exception e) {
                logger.warn("[PAYMENT_CLEANUP] APPROACH 1 error: {}", e.getMessage());
                responseData.put("approach1", "ERROR: " + e.getMessage());
            }

            // APPROACH 2: Use native SQL for maximum reliability
            int approach2DeletedCount = 0;
            try {
                logger.info("[PAYMENT_CLEANUP] APPROACH 2: Using native SQL");
                int deleted = cartItemRepository.deleteAllCartItemsByUserIdNative(userId);
                logger.info("[PAYMENT_CLEANUP] APPROACH 2 deleted {} cart items", deleted);
                approach2DeletedCount = deleted;
                responseData.put("approach2", deleted > 0 ? "SUCCESS: " + deleted + " items deleted" : "NO_ITEMS_DELETED");
            } catch (Exception e) {
                logger.warn("[PAYMENT_CLEANUP] APPROACH 2 error: {}", e.getMessage());
                responseData.put("approach2", "ERROR: " + e.getMessage());
            }

            // APPROACH 3: Use CartCleanupService for a comprehensive cleanup
            boolean approach3Success = false;
            try {
                logger.info("[PAYMENT_CLEANUP] APPROACH 3: Using CartCleanupService");
                boolean success = false;

                if (orderId != null) {
                    // If we have an order ID, use the completeCheckoutProcess method
                    success = cartCleanupService.completeCheckoutProcess(userId, orderId);
                    logger.info("[PAYMENT_CLEANUP] APPROACH 3 (with orderId) result: {}", success);
                } else {
                    // Otherwise, use the cleanupUserCart method
                    int deleted = cartCleanupService.cleanupUserCart(userId);
                    success = deleted > 0;
                    logger.info("[PAYMENT_CLEANUP] APPROACH 3 (without orderId) deleted {} items", deleted);
                }

                approach3Success = success;
                responseData.put("approach3", success ? "SUCCESS" : "FAILED");
            } catch (Exception e) {
                logger.warn("[PAYMENT_CLEANUP] APPROACH 3 error: {}", e.getMessage());
                responseData.put("approach3", "ERROR: " + e.getMessage());
            }

            // Final verification
            List<CartItem> finalCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            int finalItemCount = finalCartItems.size();
            logger.info("[PAYMENT_CLEANUP] Final verification: User has {} cart items after cleanup", finalItemCount);
            responseData.put("finalItemCount", finalItemCount);

            if (finalItemCount > 0) {
                logger.warn("[PAYMENT_CLEANUP] Cart items STILL exist after all cleanup attempts!");
                responseData.put("cartStatus", "CLEANUP_INCOMPLETE");
                responseData.put("message", "Cart cleanup incomplete, " + finalItemCount + " items remain");

                // Try one last direct approach if all else failed
                try {
                    logger.info("[PAYMENT_CLEANUP] Attempting final direct cleanup");
                    // Create a final copy of userId for use in lambda
                    final Integer finalUserId = userId;
                    Optional<Cart> activeCart = cartRepository.findActiveCartByUserId(finalUserId);
                    if (activeCart.isPresent()) {
                        Cart cart = activeCart.get();
                        cart.getCartItems().clear();
                        cartRepository.save(cart);
                        logger.info("[PAYMENT_CLEANUP] Final direct cleanup completed");
                        responseData.put("finalCleanup", "ATTEMPTED");
                    }
                } catch (Exception e) {
                    logger.error("[PAYMENT_CLEANUP] Error in final cleanup: {}", e.getMessage());
                    responseData.put("finalCleanup", "ERROR: " + e.getMessage());
                }

                // Check one more time
                List<CartItem> lastCheck = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                responseData.put("finalCheckItemCount", lastCheck.size());
                overallSuccess = lastCheck.isEmpty();
            } else {
                logger.info("[PAYMENT_CLEANUP] Cart is empty after cleanup");
                responseData.put("cartStatus", "CLEARED");
                responseData.put("message", "Cart cleared successfully");
                overallSuccess = true;
            }

            // Determine overall success based on the final state
            responseData.put("overallSuccess", overallSuccess);

            if (overallSuccess) {
                return ResponseEntity.ok(new ApiResponse(true, "Cart cleared successfully after payment", responseData));
            } else {
                return ResponseEntity.ok(new ApiResponse(false, "Cart cleanup incomplete after payment", responseData));
            }
        } catch (UnauthorizedAccessException e) {
            logger.warn("[PAYMENT_CLEANUP] Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("[PAYMENT_CLEANUP] Error clearing cart after payment: {}", e.getMessage(), e);

            String errorMessage = "Error clearing cart after payment: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            // Create error response data
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("errorType", e.getClass().getSimpleName());
            errorData.put("timestamp", LocalDateTime.now());
            // Only include userId if it was successfully retrieved
            if (userId != null) {
                errorData.put("userId", userId);
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage, errorData));
        }
    }

    /**
     * Force clear the cart using direct SQL
     * This is a last resort method to ensure the cart is cleared
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @DeleteMapping("/force-clear")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> forceClearCart(HttpServletRequest request) {
        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("[FORCE_CLEAR] Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            Integer userId = cartSecurityUtils.getCurrentUserId();
            logger.info("[FORCE_CLEAR] Starting force clear for user {}", userId);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", userId);
            responseData.put("timestamp", LocalDateTime.now());

            // Check if user has any cart items before processing
            List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            int initialItemCount = initialCartItems.size();
            logger.info("[FORCE_CLEAR] User has {} cart items before cleanup", initialItemCount);
            responseData.put("initialItemCount", initialItemCount);

            if (initialItemCount == 0) {
                logger.info("[FORCE_CLEAR] Cart is already empty, nothing to clean up");
                responseData.put("cartStatus", "ALREADY_EMPTY");
                responseData.put("message", "Cart is already empty");
                return ResponseEntity.ok(new ApiResponse(true, "Cart is already empty", responseData));
            }

            // Get all active cart IDs for the user
            List<Integer> cartIds = cartRepository.findAllActiveCartIdsByUserId(userId);
            logger.info("[FORCE_CLEAR] Found {} active carts for user {}", cartIds.size(), userId);
            responseData.put("cartIds", cartIds);

            int totalDeleted = 0;

            // APPROACH 1: Use direct SQL to delete cart items
            try {
                logger.info("[FORCE_CLEAR] APPROACH 1: Using direct SQL to delete cart items");
                String sql = "DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = ? AND status = 'ACTIVE')";
                int deleted = jdbcTemplate.update(sql, userId);
                logger.info("[FORCE_CLEAR] APPROACH 1 deleted {} cart items", deleted);
                totalDeleted += deleted;
                responseData.put("approach1Deleted", deleted);
            } catch (Exception e) {
                logger.error("[FORCE_CLEAR] Error in APPROACH 1: {}", e.getMessage(), e);
                responseData.put("approach1Error", e.getMessage());
            }

            // APPROACH 2: Delete cart items for each cart ID individually
            int approach2Deleted = 0;
            try {
                logger.info("[FORCE_CLEAR] APPROACH 2: Deleting cart items for each cart ID individually");
                for (Integer cartId : cartIds) {
                    try {
                        String sql = "DELETE FROM cart_items WHERE cart_id = ?";
                        int deleted = jdbcTemplate.update(sql, cartId);
                        logger.info("[FORCE_CLEAR] APPROACH 2 deleted {} cart items for cart ID {}", deleted, cartId);
                        approach2Deleted += deleted;
                    } catch (Exception e) {
                        logger.error("[FORCE_CLEAR] Error deleting cart items for cart ID {}: {}", cartId, e.getMessage());
                    }
                }
                logger.info("[FORCE_CLEAR] APPROACH 2 deleted {} cart items total", approach2Deleted);
                totalDeleted += approach2Deleted;
                responseData.put("approach2Deleted", approach2Deleted);
            } catch (Exception e) {
                logger.error("[FORCE_CLEAR] Error in APPROACH 2: {}", e.getMessage(), e);
                responseData.put("approach2Error", e.getMessage());
            }

            // APPROACH 3: Update cart status to COMPLETED
            try {
                logger.info("[FORCE_CLEAR] APPROACH 3: Updating cart status to COMPLETED");
                String sql = "UPDATE carts SET status = 'COMPLETED', updated_at = NOW() WHERE user_id = ? AND status = 'ACTIVE'";
                int updated = jdbcTemplate.update(sql, userId);
                logger.info("[FORCE_CLEAR] APPROACH 3 updated {} carts to COMPLETED", updated);
                responseData.put("approach3Updated", updated);
            } catch (Exception e) {
                logger.error("[FORCE_CLEAR] Error in APPROACH 3: {}", e.getMessage(), e);
                responseData.put("approach3Error", e.getMessage());
            }

            // APPROACH 4: Create a new cart for the user
            try {
                logger.info("[FORCE_CLEAR] APPROACH 4: Creating a new cart for the user");
                // Get the user from the repository
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new UserNotFoundException(userId));
                Cart newCart = cartService.createCartForUser(user);
                logger.info("[FORCE_CLEAR] APPROACH 4 created new cart with ID {}", newCart.getCartId());
                responseData.put("approach4NewCartId", newCart.getCartId());
            } catch (Exception e) {
                logger.error("[FORCE_CLEAR] Error in APPROACH 4: {}", e.getMessage(), e);
                responseData.put("approach4Error", e.getMessage());
            }

            // Final verification
            List<CartItem> finalCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            int finalItemCount = finalCartItems.size();
            logger.info("[FORCE_CLEAR] Final verification: User has {} cart items after cleanup", finalItemCount);
            responseData.put("finalItemCount", finalItemCount);

            if (finalItemCount > 0) {
                logger.warn("[FORCE_CLEAR] Cart items STILL exist after all cleanup attempts!");
                responseData.put("cartStatus", "CLEANUP_INCOMPLETE");
                responseData.put("message", "Cart cleanup incomplete, " + finalItemCount + " items remain");
                return ResponseEntity.ok(new ApiResponse(false, "Cart cleanup incomplete", responseData));
            } else {
                logger.info("[FORCE_CLEAR] Cart is empty after cleanup");
                responseData.put("cartStatus", "CLEARED");
                responseData.put("message", "Cart cleared successfully");
                responseData.put("totalDeleted", totalDeleted);
                return ResponseEntity.ok(new ApiResponse(true, "Cart cleared successfully", responseData));
            }
        } catch (UnauthorizedAccessException e) {
            logger.warn("[FORCE_CLEAR] Unauthorized access: {}", e.getMessage());
            return cartSecurityUtils.createUnauthorizedResponse(e.getMessage());
        } catch (Exception e) {
            logger.error("[FORCE_CLEAR] Error clearing cart: {}", e.getMessage(), e);

            String errorMessage = "Error clearing cart: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            // Create error response data
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("errorType", e.getClass().getSimpleName());
            errorData.put("timestamp", LocalDateTime.now());
            errorData.put("userId", cartSecurityUtils.getCurrentUserId());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage, errorData));
        }
    }

    /**
     * Emergency cart clear endpoint - uses direct SQL to clear the cart
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @DeleteMapping("/emergency-clear")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> emergencyClearCart(HttpServletRequest request) {
        // Initialize userId outside try-catch so it's available in all blocks
        Integer userId = null;

        try {
            // Validate token
            if (!cartSecurityUtils.validateToken(request)) {
                logger.warn("[EMERGENCY] Invalid or missing token in request");
                return cartSecurityUtils.createUnauthorizedResponse("Invalid or missing token");
            }

            // Get user ID from security context
            userId = cartSecurityUtils.getCurrentUserId();
            logger.info("[EMERGENCY] Starting emergency cart clear for user {}", userId);

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", userId);
            responseData.put("timestamp", LocalDateTime.now());

            // APPROACH 1: Direct SQL to delete cart items
            int deletedItems = 0;
            try {
                String sql = "DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = ? AND status = 'ACTIVE')";
                deletedItems = jdbcTemplate.update(sql, userId);
                logger.info("[EMERGENCY] Deleted {} cart items using direct SQL", deletedItems);
                responseData.put("deletedItems", deletedItems);
            } catch (Exception e) {
                logger.error("[EMERGENCY] Error deleting cart items: {}", e.getMessage(), e);
                responseData.put("error", e.getMessage());
            }

            // APPROACH 2: Update cart status to COMPLETED
            int updatedCarts = 0;
            try {
                String sql = "UPDATE carts SET status = 'COMPLETED', updated_at = NOW() WHERE user_id = ? AND status = 'ACTIVE'";
                updatedCarts = jdbcTemplate.update(sql, userId);
                logger.info("[EMERGENCY] Updated {} carts to COMPLETED", updatedCarts);
                responseData.put("updatedCarts", updatedCarts);
            } catch (Exception e) {
                logger.error("[EMERGENCY] Error updating cart status: {}", e.getMessage(), e);
                responseData.put("statusUpdateError", e.getMessage());
            }

            // APPROACH 3: Create a new cart
            try {
                // Create a final copy of userId for use in lambda
                final Integer finalUserId = userId;
                // Get the user from the repository
                User user = userRepository.findById(finalUserId)
                        .orElseThrow(() -> new UserNotFoundException(finalUserId));
                Cart newCart = cartService.createCartForUser(user);
                logger.info("[EMERGENCY] Created new cart with ID {}", newCart.getCartId());
                responseData.put("newCartId", newCart.getCartId());
            } catch (Exception e) {
                logger.error("[EMERGENCY] Error creating new cart: {}", e.getMessage(), e);
                responseData.put("newCartError", e.getMessage());
            }

            return ResponseEntity.ok(new ApiResponse(true, "Emergency cart clear completed", responseData));
        } catch (Exception e) {
            logger.error("[EMERGENCY] Error in emergency cart clear: {}", e.getMessage(), e);

            String errorMessage = "Error in emergency cart clear: " + e.getMessage();
            if (e.getCause() != null) {
                errorMessage += " Caused by: " + e.getCause().getMessage();
            }

            // Create error response data
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("errorType", e.getClass().getSimpleName());
            errorData.put("timestamp", LocalDateTime.now());
            // Only include userId if it was successfully retrieved
            if (userId != null) {
                errorData.put("userId", userId);
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, errorMessage, errorData));
        }
    }

    /**
     * Test endpoint
     * @param request the HTTP request containing the token
     * @return the response entity
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint(HttpServletRequest request) {
        // For the test endpoint, we'll check if a token is present but not require it
        String token = tokenManager.parseTokenFromRequest(request);
        if (token != null && tokenManager.validateToken(token)) {
            String username = tokenManager.getUsernameFromToken(token);
            return ResponseEntity.ok(new ApiResponse(true, "Cart controller is working. Authenticated as: " + username));
        }

        return ResponseEntity.ok(new ApiResponse(true, "Cart controller is working. Not authenticated."));
    }
}
