package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.Entity.CartStatus;
import com.example.agrifinpalestine.Entity.Product;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.ProductRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.CartItemRequest;
import com.example.agrifinpalestine.dto.CartItemResponse;
import com.example.agrifinpalestine.exception.cart.ProductAlreadyInCartException;
import com.example.agrifinpalestine.exception.inventory.InsufficientInventoryException;
import com.example.agrifinpalestine.exception.product.ProductNotFoundException;
import com.example.agrifinpalestine.exception.user.UnauthorizedAccessException;
import com.example.agrifinpalestine.exception.user.UserNotFoundException;
import com.example.agrifinpalestine.service.CartItemService;
import com.example.agrifinpalestine.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Consolidated implementation of CartItemService and CartService interfaces
 */
@Service
public class CartItemServiceImpl implements CartItemService, CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartItemServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CartItemServiceImpl(CartRepository cartRepository,
                               CartItemRepository cartItemRepository,
                               UserRepository userRepository,
                               ProductRepository productRepository,
                               JdbcTemplate jdbcTemplate) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Add a product to the user's cart
     * If the product is already in the cart, throw a ProductAlreadyInCartException
     * @param userId The ID of the user
     * @param request The cart item request containing product ID and quantity
     * @return The added cart item
     */
    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CartItemResponse addToCart(Integer userId, CartItemRequest request) {
        logger.info("Adding product {} to cart for user {}", request.getProductId(), userId);

        try {
            // Get user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException(userId));

            // Check if user is a buyer
            if (!user.isBuyer()) {
                throw new UnauthorizedAccessException("Only buyers can have carts");
            }

            // Get product
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

            // Check if product is available
            if (product.getIsAvailable() != null && !product.getIsAvailable()) {
                throw new IllegalStateException("Product is not available: " + request.getProductId());
            }

            // Check if there's enough inventory
            if (product.getQuantity() < request.getQuantity()) {
                throw new InsufficientInventoryException(
                        request.getProductId(),
                        request.getQuantity(),
                        product.getQuantity()
                );
            }

            // Get or create cart
            Cart cart = getOrCreateActiveCart(user);

            // Check if product already exists in cart
            Optional<CartItem> existingCartItem = cartItemRepository.findByCartCartIdAndProductProductId(cart.getCartId(), product.getProductId());

            // If product already exists in cart, throw an exception with the existing item data
            if (existingCartItem.isPresent()) {
                CartItem existingItem = existingCartItem.get();
                CartItemResponse existingItemResponse = convertToCartItemResponse(existingItem);
                throw new ProductAlreadyInCartException(request.getProductId(), existingItemResponse);
            }

            // Create new cart item
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(request.getQuantity());
            cartItem.setPrice(product.getPrice()); // Set the price from the product
            cartItem.setCreatedAt(LocalDateTime.now());
            cartItem.setUpdatedAt(LocalDateTime.now());

            // Save cart item
            cartItem = cartItemRepository.save(cartItem);

            // Update cart totals
            updateCartTotals(cart);

            // Create response
            CartItemResponse response = convertToCartItemResponse(cartItem);

            return response;
        } catch (Exception e) {
            logger.error("Error adding product to cart: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get all items in the user's cart
     * @param userId The ID of the user
     * @return List of cart items
     */
    @Override
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartItems(Integer userId) {
        logger.info("Getting cart items for user {}", userId);

        try {
            // Get user
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException(userId));

            // Check if user is a buyer
            if (!user.isBuyer()) {
                throw new UnauthorizedAccessException("Only buyers can have carts");
            }

            // Get active cart
            Optional<Cart> activeCart = cartRepository.findActiveCartByUserId(userId);

            if (activeCart.isEmpty()) {
                // No active cart, return empty list
                return new ArrayList<>();
            }

            // Get cart items
            List<CartItem> cartItems = cartItemRepository.findAllByCartCartId(activeCart.get().getCartId());

            // Convert to response DTOs
            return cartItems.stream()
                    .map(this::convertToCartItemResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error getting cart items: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Update the quantity of a cart item
     * @param userId The ID of the user
     * @param cartItemId The ID of the cart item
     * @param cartItemRequest The cart item request containing the new quantity
     * @return The updated cart item
     */
    @Override
    @Transactional
    public CartItemResponse updateCartItem(Integer userId, Integer cartItemId, CartItemRequest cartItemRequest) {
        logger.info("Updating cart item {} for user {} with quantity {}",
                cartItemId, userId, cartItemRequest.getQuantity());

        try {
            // Get active cart
            Optional<Cart> activeCart = getActiveCartByUserId(userId);

            if (activeCart.isEmpty()) {
                throw new IllegalStateException("No active cart found for user " + userId);
            }

            // Get cart item
            CartItem cartItem = cartItemRepository.findById(cartItemId)
                    .orElseThrow(() -> new IllegalStateException("Cart item not found: " + cartItemId));

            // Check if cart item belongs to the user's cart
            if (!cartItem.getCart().getCartId().equals(activeCart.get().getCartId())) {
                throw new IllegalStateException("Cart item does not belong to the user's cart");
            }

            // Get product
            Product product = cartItem.getProduct();

            // Check if there's enough inventory
            if (product.getQuantity() < cartItemRequest.getQuantity()) {
                throw new InsufficientInventoryException(
                        product.getProductId(),
                        cartItemRequest.getQuantity(),
                        product.getQuantity()
                );
            }

            // Update cart item
            cartItem.setQuantity(cartItemRequest.getQuantity());
            cartItem.setPrice(product.getPrice()); // Ensure price is updated
            cartItem.setUpdatedAt(LocalDateTime.now());

            cartItemRepository.save(cartItem);

            // Update cart totals
            updateCartTotals(activeCart.get());

            // Create response
            CartItemResponse response = convertToCartItemResponse(cartItem);

            return response;
        } catch (Exception e) {
            logger.error("Error updating cart item: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Remove an item from the user's cart
     * @param userId The ID of the user
     * @param cartItemId The ID of the cart item
     * @return true if the item was removed, false otherwise
     */
    @Override
    @Transactional
    public boolean removeFromCart(Integer userId, Integer cartItemId) {
        logger.info("Removing cart item {} for user {}", cartItemId, userId);

        try {
            // Get active cart
            Optional<Cart> activeCart = getActiveCartByUserId(userId);

            if (activeCart.isEmpty()) {
                logger.info("No active cart found for user {}, nothing to remove", userId);
                return false;
            }

            // Get cart item
            Optional<CartItem> cartItemOpt = cartItemRepository.findById(cartItemId);

            if (cartItemOpt.isEmpty()) {
                logger.info("Cart item {} not found, nothing to remove", cartItemId);
                return false;
            }

            CartItem cartItem = cartItemOpt.get();

            // Check if cart item belongs to the user's cart
            if (!cartItem.getCart().getCartId().equals(activeCart.get().getCartId())) {
                logger.info("Cart item {} does not belong to user {}'s cart", cartItemId, userId);
                return false;
            }

            // Remove cart item
            cartItemRepository.delete(cartItem);

            // Update cart totals
            updateCartTotals(activeCart.get());

            logger.info("Cart item {} removed for user {}", cartItemId, userId);
            return true;
        } catch (Exception e) {
            logger.error("Error removing cart item: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Clear all items from the user's cart
     * @param userId The ID of the user
     * @return true if the cart was cleared, false otherwise
     */
    @Override
    @Transactional
    public boolean clearCart(Integer userId) {
        logger.info("Clearing cart for user {}", userId);

        try {
            // Get active cart
            Optional<Cart> activeCart = cartRepository.findActiveCartByUserId(userId);

            if (activeCart.isEmpty()) {
                // No active cart, nothing to clear
                logger.info("No active cart found for user {}, nothing to clear", userId);
                return false;
            }

            Integer cartId = activeCart.get().getCartId();
            logger.info("Found active cart with ID: {} for user: {}", cartId, userId);

            // Try multiple approaches to ensure cart items are deleted
            int deletedCount = 0;

            // 1. First try the standard repository method
            try {
                logger.info("Attempting to delete cart items using standard repository method");
                cartItemRepository.deleteAllByCartCartId(cartId);

                // Check if items were deleted
                List<CartItem> remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                deletedCount = activeCart.get().getCartItems().size() - remainingItems.size();
                logger.info("Standard method deleted {} items, {} items remaining",
                        deletedCount, remainingItems.size());

                // 2. If items remain, try JPQL delete
                if (!remainingItems.isEmpty()) {
                    logger.info("Attempting to delete remaining items using JPQL");
                    int jpqlDeletedCount = cartItemRepository.deleteCartItemsByCartId(cartId);
                    logger.info("JPQL method deleted {} additional items", jpqlDeletedCount);
                    deletedCount += jpqlDeletedCount;

                    // Check again
                    remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                    logger.info("After JPQL deletion, {} items remaining", remainingItems.size());

                    // 3. If items still remain, try direct SQL
                    if (!remainingItems.isEmpty()) {
                        logger.info("Attempting to delete remaining items using direct SQL");
                        int sqlDeletedCount = jdbcTemplate.update(
                                "DELETE FROM cart_items WHERE cart_id = ?", cartId);
                        logger.info("Direct SQL deleted {} additional items", sqlDeletedCount);
                        deletedCount += sqlDeletedCount;
                    }
                }
            } catch (Exception e) {
                logger.error("Error in standard delete method: {}", e.getMessage(), e);

                // Try direct SQL as fallback
                try {
                    logger.info("Attempting direct SQL delete as fallback");
                    int sqlDeletedCount = jdbcTemplate.update(
                            "DELETE FROM cart_items WHERE cart_id = ?", cartId);
                    logger.info("Fallback SQL deleted {} items", sqlDeletedCount);
                    deletedCount = sqlDeletedCount;
                } catch (Exception sqlEx) {
                    logger.error("Error in fallback SQL delete: {}", sqlEx.getMessage(), sqlEx);
                    // Continue with the process even if this fails
                }
            }

            // Final verification and cleanup
            List<CartItem> finalCheck = cartItemRepository.findAllByCartCartId(cartId);
            if (!finalCheck.isEmpty()) {
                logger.warn("After all deletion attempts, {} items still remain. Trying one last approach.", finalCheck.size());

                // Try to clear the cart items collection directly
                try {
                    Cart cart = activeCart.get();
                    cart.getCartItems().clear();
                    cartRepository.save(cart);
                    logger.info("Cleared cart items collection directly");
                } catch (Exception e) {
                    logger.error("Error clearing cart items collection: {}", e.getMessage(), e);
                }

                // Try one more direct SQL approach with a different query
                try {
                    int finalDeleteCount = jdbcTemplate.update(
                            "DELETE FROM cart_items WHERE cart_id = ? AND cart_item_id > 0", cartId);
                    logger.info("Final SQL approach deleted {} items", finalDeleteCount);
                } catch (Exception e) {
                    logger.error("Error in final SQL approach: {}", e.getMessage(), e);
                }
            }

            // Update cart totals
            Cart cart = activeCart.get();
            cart.setTotalPrice(BigDecimal.ZERO);
            cart.setTotalQuantity(0);
            cart.setUpdatedAt(LocalDateTime.now());

            cartRepository.save(cart);

            logger.info("Cart cleared for user {}, deleted {} items total", userId, deletedCount);
            return true;
        } catch (Exception e) {
            logger.error("Error clearing cart: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Check if a product is in a user's cart
     * @param userId the user ID
     * @param productId the product ID
     * @return true if the product is in the cart, false otherwise
     */
    @Override
    public boolean isProductInCart(Integer userId, Integer productId) {
        logger.info("Checking if product {} is in cart for user {}", productId, userId);

        try {
            // Get active cart
            Optional<Cart> activeCart = getActiveCartByUserId(userId);

            if (activeCart.isEmpty()) {
                // No active cart, product is not in cart
                return false;
            }

            // Check if product is in cart
            return cartItemRepository.existsByCartCartIdAndProductProductId(activeCart.get().getCartId(), productId);
        } catch (Exception e) {
            logger.error("Error checking if product is in cart: {}", e.getMessage(), e);
            return false;
        }
    }

    // --- Helpers ---

    /**
     * Create a new cart for a user
     * @param user the user to create a cart for
     * @return the created cart
     */
    @Override
    @Transactional
    public Cart createCartForUser(User user) {
        logger.info("Creating cart for user {}", user.getUserId());

        try {
            // First, try to find an existing active cart
            Optional<Cart> existingActiveCart = cartRepository.findActiveCartByUserId(user.getUserId());
            if (existingActiveCart.isPresent()) {
                logger.info("User {} already has an active cart with ID {}", user.getUserId(), existingActiveCart.get().getCartId());
                return existingActiveCart.get();
            }

            if (!user.isBuyer()) {
                throw new UnauthorizedAccessException("Only buyers can have carts");
            }

            // Use a synchronized block to prevent race conditions
            synchronized (String.valueOf(user.getUserId()).intern()) {
                // Double-check if a cart was created while we were waiting for the lock
                existingActiveCart = cartRepository.findActiveCartByUserId(user.getUserId());
                if (existingActiveCart.isPresent()) {
                    logger.info("User {} already has an active cart with ID {} (found after lock)",
                            user.getUserId(), existingActiveCart.get().getCartId());
                    return existingActiveCart.get();
                }

                // First, clean up any potential issues
                try {
                    // Delete any existing active carts for this user (should not happen, but just in case)
                    cartRepository.deleteByUserUserIdAndStatus(user.getUserId(), CartStatus.ACTIVE);
                } catch (Exception e) {
                    logger.warn("Error cleaning up existing carts: {}", e.getMessage());
                    // Continue anyway
                }

                // Create a new cart
                Cart cart = new Cart();
                cart.setUser(user);
                cart.setTotalPrice(BigDecimal.ZERO);
                cart.setTotalQuantity(0);
                cart.setStatus(CartStatus.ACTIVE);
                cart.setCreatedAt(LocalDateTime.now());
                cart.setUpdatedAt(LocalDateTime.now());

                try {
                    Cart savedCart = cartRepository.save(cart);
                    logger.info("Created new cart with ID {} for user {}", savedCart.getCartId(), user.getUserId());
                    return savedCart;
                } catch (DataIntegrityViolationException e) {
                    logger.warn("Constraint violation while creating cart for user {}: {}",
                            user.getUserId(), e.getMessage());

                    // Another thread likely created the cart, try to find it
                    existingActiveCart = cartRepository.findActiveCartByUserId(user.getUserId());
                    if (existingActiveCart.isPresent()) {
                        logger.info("Found existing cart after constraint violation for user {}", user.getUserId());
                        return existingActiveCart.get();
                    }

                    // If we still can't find it, rethrow the exception
                    throw e;
                }
            }
        } catch (Exception e) {
            logger.error("Error creating cart for user {}: {}", user.getUserId(), e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get the active cart for a user
     * @param userId the user ID
     * @return an optional containing the active cart, or empty if none exists
     */
    @Override
    public Optional<Cart> getActiveCartByUserId(Integer userId) {
        logger.info("Getting active cart for user {}", userId);

        try {
            return cartRepository.findActiveCartByUserId(userId);
        } catch (Exception e) {
            logger.error("Error getting active cart: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Get or create an active cart for a user
     * @param user the user
     * @return the active cart
     */
    private Cart getOrCreateActiveCart(User user) {
        return cartRepository.findActiveCartByUserId(user.getUserId())
                .orElseGet(() -> createCartForUser(user));
    }

    private void updateCartTotals(Cart cart) {
        // Get all cart items
        List<CartItem> cartItems = cartItemRepository.findAllByCartCartId(cart.getCartId());

        // Calculate totals
        BigDecimal totalPrice = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            BigDecimal itemPrice = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
            totalPrice = totalPrice.add(itemPrice);
            totalQuantity += item.getQuantity();
        }

        // Update cart
        cart.setTotalPrice(totalPrice);
        cart.setTotalQuantity(totalQuantity);
        cart.setUpdatedAt(LocalDateTime.now());

        cartRepository.save(cart);
    }

    /**
     * Convert a cart item to a response DTO
     * @param cartItem the cart item
     * @return the response DTO
     */
    private CartItemResponse convertToCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();
        Integer userId = cartItem.getCart().getUser().getUserId();

        CartItemResponse response = new CartItemResponse();
        response.setId(cartItem.getCartItemId());
        response.setUserId(userId); // Set the user ID
        response.setProductId(product.getProductId());
        response.setProductName(product.getProductName());
        response.setProductImage(product.getProductImage());
        response.setProductPrice(product.getPrice());
        response.setQuantity(cartItem.getQuantity());
        response.setSubtotal(product.getPrice().multiply(new BigDecimal(cartItem.getQuantity())));
        response.setCreatedAt(cartItem.getCreatedAt());
        response.setUpdatedAt(cartItem.getUpdatedAt());

        return response;
    }

    /**
     * Alias for convertToCartItemResponse for backward compatibility
     * @param cartItem the cart item
     * @return the response DTO
     */
    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        return convertToCartItemResponse(cartItem);
    }
}
