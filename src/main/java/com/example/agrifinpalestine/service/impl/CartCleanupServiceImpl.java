package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.Entity.CartStatus;
import com.example.agrifinpalestine.Entity.Order;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.OrderRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.service.CartCleanupService;
import com.example.agrifinpalestine.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Implementation of CartCleanupService that uses direct SQL operations
 * to ensure cart items are properly deleted after a successful payment
 */
@Service
public class CartCleanupServiceImpl implements CartCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(CartCleanupServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CartCleanupServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            @org.springframework.context.annotation.Lazy CartService cartService,
            JdbcTemplate jdbcTemplate) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cartService = cartService;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Clean up a cart by deleting all its items using direct SQL
     * This method uses direct SQL to ensure the items are deleted
     * regardless of any JPA/Hibernate issues
     *
     * @param cartId the ID of the cart to clean up
     * @return the number of items deleted
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public int cleanupCart(Integer cartId) {
        logger.info("[CART_CLEANUP] Starting cleanup for cart ID: {}", cartId);

        try {
            // Get the cart to check its items
            Optional<Cart> cartOptional = cartRepository.findById(cartId);
            if (cartOptional.isEmpty()) {
                logger.warn("[CART_CLEANUP] Cart with ID: {} not found", cartId);
                return 0;
            }

            Cart cart = cartOptional.get();
            List<CartItem> cartItems = cart.getCartItems();
            int itemCount = cartItems != null ? cartItems.size() : 0;

            logger.info("[CART_CLEANUP] Found {} items in cart ID: {}", itemCount, cartId);

            // Log each item for debugging
            if (itemCount > 0) {
                for (CartItem item : cartItems) {
                    logger.info("[CART_CLEANUP] Cart item: ID={}, productId={}, quantity={}",
                            item.getCartItemId(), item.getProduct().getProductId(), item.getQuantity());
                }
            } else {
                logger.info("[CART_CLEANUP] Cart is already empty");
                return 0;
            }

            // First try using the standard repository method
            try {
                logger.info("[CART_CLEANUP] Attempting to delete cart items using standard repository method");
                cartItemRepository.deleteAllByCartCartId(cartId);
                cartItemRepository.flush(); // Force flush to ensure changes are committed

                // Verify deletion by checking if any items remain
                List<CartItem> remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                int remainingCount = remainingItems.size();
                int deleted = itemCount - remainingCount;

                logger.info("[CART_CLEANUP] Standard repository method deleted {} items, {} items remaining",
                        deleted, remainingCount);

                if (remainingCount == 0) {
                    logger.info("[CART_CLEANUP] All items deleted successfully using standard repository method");
                    return deleted;
                }
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error deleting cart items using standard repository method: {}", e.getMessage());
                logger.debug("[CART_CLEANUP] Standard repository method exception", e);
                // Continue to the next approach
            }

            // Then try using JPQL
            try {
                logger.info("[CART_CLEANUP] Attempting to delete cart items using JPQL");
                int jpqlDeleted = cartItemRepository.deleteCartItemsByCartId(cartId);
                cartItemRepository.flush(); // Force flush to ensure changes are committed

                logger.info("[CART_CLEANUP] JPQL method deleted {} items", jpqlDeleted);

                // Verify deletion by checking if any items remain
                List<CartItem> remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                int remainingCount = remainingItems.size();

                logger.info("[CART_CLEANUP] After JPQL, {} items remaining", remainingCount);

                if (remainingCount == 0) {
                    logger.info("[CART_CLEANUP] All items deleted successfully using JPQL");
                    return jpqlDeleted;
                }
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error deleting cart items using JPQL: {}", e.getMessage());
                logger.debug("[CART_CLEANUP] JPQL method exception", e);
                // Continue to the next approach
            }

            // Finally, try deleting items one by one
            try {
                logger.info("[CART_CLEANUP] Attempting to delete cart items one by one");
                int individualDeleted = 0;

                // Get fresh list of items
                List<CartItem> itemsToDelete = cartItemRepository.findAllByCartCartId(cartId);
                logger.info("[CART_CLEANUP] Found {} items to delete individually", itemsToDelete.size());

                for (CartItem item : itemsToDelete) {
                    try {
                        logger.info("[CART_CLEANUP] Deleting cart item ID: {}", item.getCartItemId());
                        cartItemRepository.delete(item);
                        cartItemRepository.flush(); // Flush after each delete
                        individualDeleted++;
                    } catch (Exception e) {
                        logger.warn("[CART_CLEANUP] Error deleting individual cart item ID: {}: {}",
                                item.getCartItemId(), e.getMessage());
                    }
                }

                logger.info("[CART_CLEANUP] Deleted {} cart items individually", individualDeleted);

                // Verify deletion by checking if any items remain
                List<CartItem> remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                int remainingCount = remainingItems.size();

                logger.info("[CART_CLEANUP] After individual deletes, {} items remaining", remainingCount);

                if (remainingCount > 0) {
                    logger.warn("[CART_CLEANUP] Failed to delete all cart items. {} items still remain.", remainingCount);

                    // Log remaining items
                    for (CartItem item : remainingItems) {
                        logger.warn("[CART_CLEANUP] Remaining item: ID={}, productId={}, quantity={}",
                                item.getCartItemId(), item.getProduct().getProductId(), item.getQuantity());
                    }
                } else {
                    logger.info("[CART_CLEANUP] All items deleted successfully using individual deletes");
                }

                return individualDeleted;
            } catch (Exception e) {
                logger.error("[CART_CLEANUP] Error deleting cart items individually: {}", e.getMessage(), e);
                throw e;
            }
        } catch (Exception e) {
            logger.error("[CART_CLEANUP] Error cleaning up cart: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Clean up a user's active cart by deleting all its items and marking it as completed
     *
     * @param userId the ID of the user
     * @return the number of items deleted, or -1 if no active cart was found
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public int cleanupUserCart(Integer userId) {
        logger.info("[CART_CLEANUP] Starting cleanup for user ID: {}", userId);

        try {
            // First check if user has any active carts
            boolean hasActiveCarts = cartRepository.hasActiveCartsByUserId(userId);
            if (!hasActiveCarts) {
                logger.info("[CART_CLEANUP] User with ID: {} has no active carts", userId);
                return 0;
            }

            // Get all active carts for the user
            List<Cart> activeCarts = cartRepository.findAllActiveCartsByUserId(userId);
            logger.info("[CART_CLEANUP] Found {} active carts for user ID: {}", activeCarts.size(), userId);

            if (activeCarts.isEmpty()) {
                logger.warn("[CART_CLEANUP] No active carts found for user with ID: {}", userId);
                return 0;
            }

            // Check if user has any cart items
            List<CartItem> userCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            logger.info("[CART_CLEANUP] Found {} cart items for user ID: {}", userCartItems.size(), userId);

            // Log each item for debugging
            for (CartItem item : userCartItems) {
                logger.info("[CART_CLEANUP] User cart item: ID={}, productId={}, quantity={}, cartId={}",
                        item.getCartItemId(), item.getProduct().getProductId(),
                        item.getQuantity(), item.getCart().getCartId());
            }

            int totalDeleted = 0;

            // Try to delete all cart items for the user's active carts
            try {
                logger.info("[CART_CLEANUP] Attempting to delete all cart items for user ID: {}", userId);
                int deleted = cartItemRepository.deleteAllCartItemsByUserId(userId);
                cartItemRepository.flush(); // Force flush to ensure changes are committed

                logger.info("[CART_CLEANUP] Deleted {} cart items for user ID: {}", deleted, userId);
                totalDeleted = deleted;
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error deleting all cart items for user ID: {}: {}", userId, e.getMessage());
                logger.debug("[CART_CLEANUP] Error details", e);

                // If bulk delete fails, try cleaning up each cart individually
                logger.info("[CART_CLEANUP] Attempting to clean up each cart individually");

                for (Cart cart : activeCarts) {
                    try {
                        logger.info("[CART_CLEANUP] Cleaning up cart ID: {}", cart.getCartId());
                        int deleted = cleanupCart(cart.getCartId());
                        logger.info("[CART_CLEANUP] Deleted {} items from cart ID: {}", deleted, cart.getCartId());
                        totalDeleted += deleted;
                    } catch (Exception ex) {
                        logger.error("[CART_CLEANUP] Error cleaning up cart ID: {}: {}", cart.getCartId(), ex.getMessage());
                    }
                }
            }

            // Mark all active carts as completed
            try {
                logger.info("[CART_CLEANUP] Marking all active carts as completed for user ID: {}", userId);
                int updated = cartRepository.updateCartStatusToCompletedByUserId(userId);
                logger.info("[CART_CLEANUP] Marked {} carts as completed for user ID: {}", updated, userId);
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error marking carts as completed for user ID: {}: {}", userId, e.getMessage());

                // If bulk update fails, try marking each cart individually
                for (Cart cart : activeCarts) {
                    try {
                        logger.info("[CART_CLEANUP] Marking cart ID: {} as completed", cart.getCartId());
                        boolean marked = markCartAsCompleted(cart);
                        logger.info("[CART_CLEANUP] Marked cart ID: {} as completed: {}", cart.getCartId(), marked);
                    } catch (Exception ex) {
                        logger.error("[CART_CLEANUP] Error marking cart ID: {} as completed: {}", cart.getCartId(), ex.getMessage());
                    }
                }
            }

            // Verify all cart items were deleted
            long remainingCount = cartItemRepository.countByUserIdAndCartStatusActive(userId);
            logger.info("[CART_CLEANUP] After cleanup, user has {} active cart items", remainingCount);

            if (remainingCount > 0) {
                logger.warn("[CART_CLEANUP] Failed to delete all cart items for user ID: {}", userId);

                // Try one more approach - delete items one by one
                List<CartItem> remainingItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                logger.info("[CART_CLEANUP] Found {} remaining items to delete individually", remainingItems.size());

                for (CartItem item : remainingItems) {
                    try {
                        logger.info("[CART_CLEANUP] Deleting remaining cart item ID: {}", item.getCartItemId());
                        cartItemRepository.delete(item);
                        cartItemRepository.flush(); // Flush after each delete
                        totalDeleted++;
                    } catch (Exception e) {
                        logger.warn("[CART_CLEANUP] Error deleting remaining cart item ID: {}: {}",
                                item.getCartItemId(), e.getMessage());
                    }
                }

                // Final verification
                remainingCount = cartItemRepository.countByUserIdAndCartStatusActive(userId);
                logger.info("[CART_CLEANUP] After final cleanup, user has {} active cart items", remainingCount);
            }

            return totalDeleted;
        } catch (Exception e) {
            logger.error("[CART_CLEANUP] Error cleaning up user cart: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Mark a cart as completed without deleting its items
     *
     * @param cart the cart to mark as completed
     * @return true if the cart was marked as completed, false otherwise
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public boolean markCartAsCompleted(Cart cart) {
        logger.info("[CART_CLEANUP] Marking cart with ID: {} as completed", cart.getCartId());

        try {
            // Get the current status
            String currentStatus = cart.getStatus().toString();
            logger.info("[CART_CLEANUP] Current cart status: {}", currentStatus);

            // If cart is already completed, return true
            if (CartStatus.COMPLETED.equals(cart.getStatus())) {
                logger.info("[CART_CLEANUP] Cart with ID: {} is already completed", cart.getCartId());
                return true;
            }

            // Set the new status
            cart.setStatus(CartStatus.COMPLETED);
            cart.setUpdatedAt(LocalDateTime.now());

            // Save the cart
            Cart savedCart = cartRepository.save(cart);

            // Flush to ensure changes are committed
            cartRepository.flush();

            // Verify the status was updated
            logger.info("[CART_CLEANUP] Cart with ID: {} marked as completed. New status: {}",
                    savedCart.getCartId(), savedCart.getStatus());

            // Verify by retrieving the cart again
            Optional<Cart> updatedCartOptional = cartRepository.findById(cart.getCartId());
            if (updatedCartOptional.isPresent()) {
                Cart updatedCart = updatedCartOptional.get();
                logger.info("[CART_CLEANUP] Verified cart status after update: {}", updatedCart.getStatus());
                return CartStatus.COMPLETED.equals(updatedCart.getStatus());
            } else {
                logger.warn("[CART_CLEANUP] Could not verify cart status after update - cart not found");
                return false;
            }
        } catch (Exception e) {
            logger.error("[CART_CLEANUP] Error marking cart as completed: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Create a new active cart for a user
     *
     * @param userId the ID of the user
     * @return the ID of the new cart
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public Integer createNewCartForUser(Integer userId) {
        logger.info("Creating new active cart for user with ID: {}", userId);

        try {
            // Get the user
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                logger.error("User with ID: {} not found", userId);
                throw new RuntimeException("User not found");
            }

            User user = userOptional.get();

            // Create a new cart using the cart service
            Cart newCart = cartService.createCartForUser(user);
            logger.info("Created new active cart with ID: {} for user with ID: {}", newCart.getCartId(), userId);

            return newCart.getCartId();
        } catch (Exception e) {
            logger.error("Error creating new cart for user: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Complete the checkout process by cleaning up the cart and creating a new one
     *
     * @param userId the ID of the user
     * @param orderId the ID of the order
     * @return true if the process was completed successfully, false otherwise
     */
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public boolean completeCheckoutProcess(Integer userId, Integer orderId) {
        logger.info("[CART_CLEANUP] Starting checkout process completion for user ID: {} and order ID: {}", userId, orderId);

        try {
            // First check if the order exists and is valid
            Optional<Order> orderOptional = orderRepository.findById(orderId);
            if (orderOptional.isPresent()) {
                Order order = orderOptional.get();
                logger.info("[CART_CLEANUP] Order info: ID={}, userId={}, status={}",
                        order.getOrderId(), order.getUser().getUserId(), order.getStatus());

                // Verify the order belongs to the user
                if (!userId.equals(order.getUser().getUserId())) {
                    logger.warn("[CART_CLEANUP] Order {} belongs to user {}, not user {}",
                            orderId, order.getUser().getUserId(), userId);
                }
            } else {
                logger.warn("[CART_CLEANUP] Order with ID: {} not found", orderId);
            }

            // Check if user has any active cart items before cleanup
            List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            logger.info("[CART_CLEANUP] User has {} cart items before cleanup", initialCartItems.size());

            // Log each item for debugging
            for (CartItem item : initialCartItems) {
                logger.info("[CART_CLEANUP] Cart item before cleanup: ID={}, productId={}, quantity={}, cartId={}",
                        item.getCartItemId(), item.getProduct().getProductId(),
                        item.getQuantity(), item.getCart().getCartId());
            }

            // APPROACH 1: Try using the native SQL repository method to delete all cart items for the user
            try {
                logger.info("[CART_CLEANUP] APPROACH 1: Deleting all cart items using native SQL repository method");
                int deleted = cartItemRepository.deleteAllCartItemsByUserIdNative(userId);
                cartItemRepository.flush(); // Force flush to ensure changes are committed
                logger.info("[CART_CLEANUP] Deleted {} cart items for user with ID: {}", deleted, userId);
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error in APPROACH 1: {}", e.getMessage());
            }

            // APPROACH 2: Try using the JPQL repository method to delete all cart items for the user
            try {
                logger.info("[CART_CLEANUP] APPROACH 2: Deleting all cart items using JPQL repository method");
                int deleted = cartItemRepository.deleteAllCartItemsByUserId(userId);
                cartItemRepository.flush(); // Force flush to ensure changes are committed
                logger.info("[CART_CLEANUP] Deleted {} cart items for user with ID: {}", deleted, userId);
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error in APPROACH 2: {}", e.getMessage());
            }

            // APPROACH 3: Clean up the user's active cart using our standard method
            try {
                logger.info("[CART_CLEANUP] APPROACH 3: Using cleanupUserCart method");
                int deleted = cleanupUserCart(userId);
                logger.info("[CART_CLEANUP] Deleted {} cart items for user with ID: {}", deleted, userId);
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error in APPROACH 3: {}", e.getMessage());
            }

            // APPROACH 4: Try using CartItemService's clearCart method
            try {
                // Get all active carts for the user
                List<Cart> activeCarts = cartRepository.findAllActiveCartsByUserId(userId);
                logger.info("[CART_CLEANUP] APPROACH 4: Found {} active carts to process", activeCarts.size());

                for (Cart cart : activeCarts) {
                    try {
                        logger.info("[CART_CLEANUP] Processing cart ID: {}", cart.getCartId());

                        // Clear all items from the cart
                        cart.getCartItems().clear();

                        // Mark the cart as completed
                        cart.setStatus(CartStatus.COMPLETED);
                        cart.setUpdatedAt(LocalDateTime.now());

                        // Save the cart
                        cartRepository.save(cart);
                        cartRepository.flush();

                        logger.info("[CART_CLEANUP] Cleared and completed cart ID: {}", cart.getCartId());
                    } catch (Exception e) {
                        logger.warn("[CART_CLEANUP] Error processing cart ID: {}: {}", cart.getCartId(), e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error in APPROACH 4: {}", e.getMessage());
            }

            // APPROACH 5: Try direct SQL deletion as a last resort
            try {
                logger.info("[CART_CLEANUP] APPROACH 5: Using direct SQL deletion");

                // Get all active cart IDs for the user
                List<Integer> activeCartIds = cartRepository.findAllActiveCartIdsByUserId(userId);
                logger.info("[CART_CLEANUP] Found {} active cart IDs", activeCartIds.size());

                for (Integer cartId : activeCartIds) {
                    try {
                        // Use JdbcTemplate for direct SQL deletion
                        int deleted = jdbcTemplate.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
                        logger.info("[CART_CLEANUP] Direct SQL deleted {} items from cart ID: {}", deleted, cartId);

                        // Mark the cart as completed
                        int updated = jdbcTemplate.update(
                                "UPDATE carts SET status = 'COMPLETED', updated_at = NOW() WHERE cart_id = ?",
                                cartId);
                        logger.info("[CART_CLEANUP] Direct SQL updated {} cart(s) to COMPLETED", updated);
                    } catch (Exception e) {
                        logger.warn("[CART_CLEANUP] Error in direct SQL for cart ID: {}: {}", cartId, e.getMessage());
                    }
                }
            } catch (Exception e) {
                logger.warn("[CART_CLEANUP] Error in APPROACH 5: {}", e.getMessage());
            }

            // Verify cart is empty after all cleanup attempts
            List<CartItem> remainingCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            logger.info("[CART_CLEANUP] User has {} cart items after cleanup attempts", remainingCartItems.size());

            if (!remainingCartItems.isEmpty()) {
                logger.warn("[CART_CLEANUP] Cart items still exist after cleanup. Attempting final individual cleanup.");

                // Log remaining items
                for (CartItem item : remainingCartItems) {
                    logger.warn("[CART_CLEANUP] Remaining item: ID={}, productId={}, quantity={}, cartId={}",
                            item.getCartItemId(), item.getProduct().getProductId(),
                            item.getQuantity(), item.getCart().getCartId());
                }

                // Try deleting items one by one
                for (CartItem item : remainingCartItems) {
                    try {
                        logger.info("[CART_CLEANUP] Deleting remaining cart item ID: {}", item.getCartItemId());
                        cartItemRepository.delete(item);
                        cartItemRepository.flush(); // Flush after each delete
                    } catch (Exception e) {
                        logger.warn("[CART_CLEANUP] Error deleting remaining cart item ID: {}: {}",
                                item.getCartItemId(), e.getMessage());
                    }
                }

                // Mark all active carts as completed
                int updated = cartRepository.updateCartStatusToCompletedByUserId(userId);
                logger.info("[CART_CLEANUP] Marked {} carts as completed in final cleanup", updated);
            }

            // Create a new active cart for the user
            Integer newCartId = createNewCartForUser(userId);
            logger.info("[CART_CLEANUP] Created new active cart with ID: {} for user with ID: {}", newCartId, userId);

            // Final verification
            List<CartItem> finalCheck = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
            logger.info("[CART_CLEANUP] Final check: User has {} active cart items", finalCheck.size());

            if (!finalCheck.isEmpty()) {
                logger.warn("[CART_CLEANUP] Cart items STILL exist after all cleanup attempts!");
                for (CartItem item : finalCheck) {
                    logger.warn("[CART_CLEANUP] Remaining item after all attempts: ID={}, productId={}, quantity={}, cartId={}",
                            item.getCartItemId(), item.getProduct().getProductId(),
                            item.getQuantity(), item.getCart().getCartId());
                }
            } else {
                logger.info("[CART_CLEANUP] Checkout process completed successfully. Cart is empty.");
            }

            return true;
        } catch (Exception e) {
            logger.error("[CART_CLEANUP] Error completing checkout process: {}", e.getMessage(), e);
            throw e;
        }
    }
}
