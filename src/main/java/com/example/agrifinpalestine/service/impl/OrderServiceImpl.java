package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.*;
import com.example.agrifinpalestine.Repository.OrderRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.Repository.OrderItemRepository;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.service.CartCleanupService;
import com.example.agrifinpalestine.service.CartService;
import com.example.agrifinpalestine.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
// Using only JPA/Hibernate, no JDBC
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CartService cartService;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartCleanupService cartCleanupService;

    // Constructor injection
    @Autowired
    public OrderServiceImpl(OrderRepository orderRepository, OrderItemRepository orderItemRepository, CartItemRepository cartItemRepository, CartService cartService, UserRepository userRepository, CartRepository cartRepository, CartCleanupService cartCleanupService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.cartService = cartService;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.cartCleanupService = cartCleanupService;
    }




    @Override
    @Transactional
    public Order createOrderFromCart(Integer userId, String paymentIntentId) {
        // Get user
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        User user = userOptional.get();

        // Get active cart
        Optional<Cart> cartOptional = cartRepository.findActiveCartByUserId(userId);
        if (cartOptional.isEmpty() || cartOptional.get().getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }
        Cart cart = cartOptional.get();

        // Calculate total
        BigDecimal total = cart.getCartItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setTotalAmount(total);
        order.setStatus("PAID");
        order.setPaymentMethod("Stripe");
        order.setPaymentIntentId(paymentIntentId);
        order.setPaymentStatus("COMPLETED");

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Create order items from cart items
        for (CartItem cartItem : cart.getCartItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPricePerUnit(cartItem.getProduct().getPrice());

            // Save order item
            orderItemRepository.save(orderItem);

            // Add to order's item list
            savedOrder.getOrderItems().add(orderItem);
        }

        // Note: We don't mark the cart as completed or clear items here
        // This will be done in a separate method after payment confirmation
        // to prevent losing the cart if payment fails

        return savedOrder;
    }

    @Override
    public List<Order> getUserOrders(Integer userId) {
        return orderRepository.findByUser_UserId(userId);
    }

    @Override
    public Order getOrderById(Integer orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    @Transactional
    public boolean deleteOrder(Integer orderId, Integer userId) {
        logger.info("[ORDER] Attempting to delete order ID: {} for user ID: {}", orderId, userId);

        try {
            // Find the order
            Optional<Order> orderOptional = orderRepository.findById(orderId);
            if (orderOptional.isEmpty()) {
                logger.warn("[ORDER] Order not found with ID: {}", orderId);
                return false;
            }

            Order order = orderOptional.get();

            // Security check: Verify the user owns the order
            if (!order.getUser().getUserId().equals(userId)) {
                logger.warn("[ORDER] User {} does not own order {}", userId, orderId);
                return false;
            }

            // Delete the order items first (due to foreign key constraints)
            orderItemRepository.deleteAll(order.getOrderItems());

            // Delete the order
            orderRepository.delete(order);

            logger.info("[ORDER] Successfully deleted order ID: {} for user ID: {}", orderId, userId);
            return true;
        } catch (Exception e) {
            logger.error("[ORDER] Error deleting order ID: {} for user ID: {}: {}", orderId, userId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public Order updateOrderPaymentStatus(Integer orderId, String paymentStatus) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            throw new RuntimeException("Order not found");
        }

        order.setStatus(paymentStatus);
        return orderRepository.save(order);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, isolation = Isolation.SERIALIZABLE)
    public boolean finalizeOrder(Integer userId, Integer orderId) {
        logger.info("[ORDER] Starting finalizeOrder for userId: {} and orderId: {}", userId, orderId);

        try {
            // Verify order exists
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                logger.error("[ORDER] Order not found with ID: {}", orderId);
                throw new RuntimeException("Order not found");
            }
            logger.info("[ORDER] Found order with ID: {}, status: {}, total: {}",
                    orderId, order.getStatus(), order.getTotalAmount());

            // Verify the user owns the order
            if (!order.getUser().getUserId().equals(userId)) {
                logger.error("[ORDER] User {} does not own order {}", userId, orderId);
                throw new RuntimeException("User does not own this order");
            }
            logger.info("[ORDER] Verified user {} owns order {}", userId, orderId);

            // Check if a user has any cart items before processing
            try {
                List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                logger.info("[ORDER] User has {} cart items before processing", initialCartItems.size());

                // Log each item for debugging
                for (CartItem item : initialCartItems) {
                    logger.info("[ORDER] Cart item before processing: ID={}, productId={}, quantity={}, cartId={}",
                            item.getCartItemId(), item.getProduct().getProductId(),
                            item.getQuantity(), item.getCart().getCartId());
                }
            } catch (Exception e) {
                logger.warn("[ORDER] Error checking initial cart items: {}", e.getMessage());
            }

            // Get active cart
            Optional<Cart> cartOptional = cartRepository.findActiveCartByUserId(userId);
            if (cartOptional.isEmpty()) {
                // Cart already finalized or doesn't exist
                logger.warn("[ORDER] No active cart found for user {}, order may have already been finalized", userId);
                return true;
            }

            Cart cart = cartOptional.get();
            logger.info("[ORDER] Found active cart with ID: {} for user: {}, status: {}",
                    cart.getCartId(), userId, cart.getStatus());

            // Log cart items before deletion
            List<CartItem> cartItems = cart.getCartItems();
            int itemCount = cartItems != null ? cartItems.size() : 0;
            logger.info("[ORDER] Cart {} has {} items before deletion", cart.getCartId(), itemCount);

            if (itemCount > 0) {
                for (CartItem item : cartItems) {
                    logger.info("[ORDER] Cart item before deletion: ID={}, productId={}, quantity={}",
                            item.getCartItemId(), item.getProduct().getProductId(), item.getQuantity());
                }
            }

            // Use the CartCleanupService to handle the entire checkout process
            logger.info("[ORDER] Using CartCleanupService to complete checkout process");
            boolean success = cartCleanupService.completeCheckoutProcess(userId, orderId);

            if (success) {
                logger.info("[ORDER] Successfully completed checkout process for order: {}", orderId);

                // Verify the cart is empty after cleanup
                try {
                    List<CartItem> remainingItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                    logger.info("[ORDER] After CartCleanupService, user has {} cart items", remainingItems.size());

                    if (!remainingItems.isEmpty()) {
                        logger.warn("[ORDER] Items still remain after CartCleanupService");

                        // Log the remaining items
                        for (CartItem item : remainingItems) {
                            logger.warn("[ORDER] Remaining item: cartId={}, itemId={}, productId={}, quantity={}",
                                    item.getCart().getCartId(), item.getCartItemId(),
                                    item.getProduct().getProductId(), item.getQuantity());
                        }
                    }
                } catch (Exception e) {
                    logger.error("[ORDER] Error checking remaining items: {}", e.getMessage(), e);
                }
            } else {
                logger.warn("[ORDER] Failed to complete checkout process for order: {}", orderId);

                // Fallback to a direct approach if the service fails
                logger.info("[ORDER] Falling back to direct approach");

                // Get the cart ID before we modify anything
                Integer cartId = cart.getCartId();

                // Use JPA to delete cart items
                logger.info("[ORDER] Using JPA to delete cart items for cart ID: {}", cartId);
                List<CartItem> itemsToDelete = cartItemRepository.findAllByCartCartId(cartId);
                logger.info("[ORDER] Found {} items to delete", itemsToDelete.size());

                cartItemRepository.deleteAll(itemsToDelete);
                cartItemRepository.flush();
                logger.info("[ORDER] Deleted {} cart items using JPA", itemsToDelete.size());

                // Mark cart as completed
                logger.info("[ORDER] Marking cart {} as completed using JPA", cartId);
                cart.setStatus(CartStatus.COMPLETED);
                cart.setUpdatedAt(LocalDateTime.now());
                cartRepository.save(cart);
                cartRepository.flush();
                logger.info("[ORDER] Updated cart status to COMPLETED");

                // Create a new active cart for the user
                logger.info("[ORDER] Creating new active cart for user {}", userId);
                Cart newCart = cartService.createCartForUser(cart.getUser());
                logger.info("[ORDER] Created new active cart with ID: {} for user ID: {}", newCart.getCartId(), userId);

                // Verify cart is empty after JPA approach
                try {
                    List<CartItem> remainingItems = cartItemRepository.findAllByCartCartId(cartId);
                    int remainingCount = remainingItems.size();

                    logger.info("[ORDER] After JPA approach, cart {} has {} items remaining", cartId, remainingCount);

                    if (remainingCount > 0) {
                        logger.warn("[ORDER] Items STILL remain after JPA approach");

                        // Log remaining items
                        for (CartItem item : remainingItems) {
                            logger.warn("[ORDER] Remaining item: ID={}, productId={}, quantity={}",
                                    item.getCartItemId(), item.getProduct().getProductId(), item.getQuantity());
                        }

                        // Try one more time with individual deletes
                        try {
                            logger.info("[ORDER] Attempting final individual deletes");
                            int finalDeleted = 0;
                            for (CartItem item : remainingItems) {
                                cartItemRepository.delete(item);
                                finalDeleted++;
                            }
                            cartItemRepository.flush();
                            logger.info("[ORDER] Final individual deletes removed {} items", finalDeleted);
                        } catch (Exception e) {
                            logger.error("[ORDER] Error in final individual deletes: {}", e.getMessage(), e);
                        }
                    }
                } catch (Exception e) {
                    logger.error("[ORDER] Error checking remaining items after JPA approach: {}", e.getMessage(), e);
                }
            }

            // Final verification
            try {
                List<CartItem> finalCheck = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                logger.info("[ORDER] Final verification: User has {} active cart items", finalCheck.size());

                if (!finalCheck.isEmpty()) {
                    logger.warn("[ORDER] Cart items STILL exist after all cleanup attempts!");

                    // Log remaining items
                    for (CartItem item : finalCheck) {
                        logger.warn("[ORDER] Final remaining item: ID={}, productId={}, quantity={}, cartId={}",
                                item.getCartItemId(), item.getProduct().getProductId(),
                                item.getQuantity(), item.getCart().getCartId());
                    }

                    // Try one more time with the CartCleanupService
                    try {
                        logger.info("[ORDER] Trying CartCleanupService again for final cleanup");
                        boolean cleanupSuccess = cartCleanupService.completeCheckoutProcess(userId, orderId);
                        logger.info("[ORDER] CartCleanupService retry result: {}", cleanupSuccess);
                    } catch (Exception e) {
                        logger.error("[ORDER] Error in CartCleanupService retry: {}", e.getMessage(), e);
                    }
                } else {
                    logger.info("[ORDER] Cart is empty after all cleanup attempts");
                }
            } catch (Exception e) {
                logger.error("[ORDER] Error in final verification: {}", e.getMessage(), e);
            }

            return true;
        } catch (Exception e) {
            logger.error("[ORDER] Error finalizing order: {}", e.getMessage(), e);
            throw e;
        }
    }
}
