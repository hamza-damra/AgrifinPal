package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.*;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.CartService;
import com.example.agrifinpalestine.service.CartItemService;
import com.example.agrifinpalestine.service.CartCleanupService;
import com.example.agrifinpalestine.service.OrderService;
import com.example.agrifinpalestine.service.StripeService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// Using only JPA/Hibernate, no JDBC
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private static final Logger logger = LoggerFactory.getLogger(CheckoutController.class);

    @Autowired
    private StripeService stripeService;

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartItemService cartItemService;

    @Autowired
    private CartCleanupService cartCleanupService;

    // Stripe is now initialized in StripeConfig

    // Checkout page is now handled by CheckoutViewController

    @PostMapping("/create-payment-intent")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createPaymentIntent() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Get active cart
            Optional<Cart> cartOptional = cartRepository.findActiveCartByUserId(userId);
            if (cartOptional.isEmpty() || cartOptional.get().getCartItems().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("error", "Cart is empty");
                return ResponseEntity.badRequest().body(response);
            }
            Cart cart = cartOptional.get();
            List<CartItem> cartItems = cart.getCartItems();

            // Calculate total in cents (Stripe requires amount in smallest currency unit)
            long totalCents = cartItems.stream()
                    .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .multiply(BigDecimal.valueOf(100))
                    .longValue();

            // Create metadata for the payment intent
            Map<String, String> metadata = new HashMap<>();
            metadata.put("userId", userId.toString());
            metadata.put("cartId", cart.getCartId().toString());
            metadata.put("description", "Order from AgriFinPalestine");

            // Create payment intent with metadata included
            PaymentIntent paymentIntent = stripeService.createPaymentIntent(totalCents, "ils", metadata);

            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret", paymentIntent.getClientSecret());
            return ResponseEntity.ok(response);
        } catch (StripeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/payment-success")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> paymentSuccess(@RequestBody Map<String, String> payload) {
        logger.info("[PAYMENT] Payment success endpoint called with payload: {}", payload);
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();
            logger.info("[PAYMENT] Processing payment success for user ID: {}", userId);

            // Get payment intent ID from payload
            String paymentIntentId = payload.get("paymentIntentId");
            if (paymentIntentId == null || paymentIntentId.isEmpty()) {
                logger.error("[PAYMENT] Payment intent ID is missing from payload");
                throw new IllegalArgumentException("Payment intent ID is required");
            }
            logger.info("[PAYMENT] Payment intent ID: {}", paymentIntentId);

            // Check if user has any cart items before processing
            try {
                List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                logger.info("[PAYMENT] User has {} cart items before processing", initialCartItems.size());

                // Log each item for debugging
                for (CartItem item : initialCartItems) {
                    logger.info("[PAYMENT] Cart item before processing: ID={}, productId={}, quantity={}, cartId={}",
                            item.getCartItemId(), item.getProduct().getProductId(),
                            item.getQuantity(), item.getCart().getCartId());
                }
            } catch (Exception e) {
                logger.warn("[PAYMENT] Error checking initial cart items: {}", e.getMessage());
            }

            // Create order from cart (this doesn't finalize the cart yet)
            logger.info("[PAYMENT] Creating order from cart for user: {}", userId);
            Order order = orderService.createOrderFromCart(userId, paymentIntentId);
            logger.info("[PAYMENT] Order created with ID: {}", order.getOrderId());

            // Now finalize the order (mark cart as completed and clear items)
            logger.info("[PAYMENT] Finalizing order: {} for user: {}", order.getOrderId(), userId);
            boolean finalized = orderService.finalizeOrder(userId, order.getOrderId());
            logger.info("[PAYMENT] Order finalized: {}, finalized status: {}", order.getOrderId(), finalized);

            // Double-check if cart items were cleared
            Optional<Cart> cartCheck = cartRepository.findActiveCartByUserId(userId);
            if (cartCheck.isPresent()) {
                Cart cart = cartCheck.get();
                List<CartItem> cartItems = cart.getCartItems();
                int itemCount = cartItems != null ? cartItems.size() : 0;

                logger.info("[PAYMENT] After finalization, user has active cart ID: {} with {} items",
                        cart.getCartId(), itemCount);

                if (itemCount > 0) {
                    logger.warn("[PAYMENT] Cart items still exist after finalization, attempting additional cleanup");

                    // Log the items that remain
                    for (CartItem item : cartItems) {
                        logger.warn("[PAYMENT] Remaining item: ID={}, productId={}, quantity={}",
                                item.getCartItemId(), item.getProduct().getProductId(), item.getQuantity());
                    }

                    // Use multiple approaches to ensure cart is cleared
                    try {
                        // 1. First try the CartItemService's clearCart method
                        try {
                            logger.info("[PAYMENT] Using CartItemService to clear cart");
                            boolean cleared = cartItemService.clearCart(userId);
                            logger.info("[PAYMENT] CartItemService.clearCart result: {}", cleared);
                        } catch (Exception e) {
                            logger.warn("[PAYMENT] CartItemService.clearCart failed: {}", e.getMessage());
                        }

                        // 2. Try the native SQL approach for maximum reliability
                        try {
                            logger.info("[PAYMENT] Using native SQL to delete cart items");
                            int deleted = cartItemRepository.deleteAllCartItemsByUserIdNative(userId);
                            logger.info("[PAYMENT] Native SQL deleted {} cart items", deleted);
                        } catch (Exception e) {
                            logger.warn("[PAYMENT] Native SQL deletion failed: {}", e.getMessage());
                        }

                        // 3. Then use the CartCleanupService for a comprehensive cleanup
                        logger.info("[PAYMENT] Using CartCleanupService to complete checkout process");
                        boolean success = cartCleanupService.completeCheckoutProcess(userId, order.getOrderId());
                        logger.info("[PAYMENT] CartCleanupService.completeCheckoutProcess result: {}", success);

                        // Check if items were cleared after using CartCleanupService
                        try {
                            List<CartItem> remainingItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                            logger.info("[PAYMENT] After CartCleanupService, user has {} cart items", remainingItems.size());

                            if (!remainingItems.isEmpty()) {
                                logger.warn("[PAYMENT] Items still remain after CartCleanupService");

                                // Log remaining items
                                for (CartItem item : remainingItems) {
                                    logger.warn("[PAYMENT] Remaining item: ID={}, productId={}, quantity={}, cartId={}",
                                            item.getCartItemId(), item.getProduct().getProductId(),
                                            item.getQuantity(), item.getCart().getCartId());
                                }

                                // Try using the CartItemService as a last resort
                                try {
                                    logger.info("[PAYMENT] Using CartItemService for final cleanup");
                                    boolean cleared = cartItemService.clearCart(userId);
                                    logger.info("[PAYMENT] CartItemService.clearCart result: {}", cleared);
                                } catch (Exception e) {
                                    logger.error("[PAYMENT] Error using CartItemService for cleanup: {}", e.getMessage(), e);
                                }
                            }
                        } catch (Exception e) {
                            logger.error("[PAYMENT] Error checking remaining items: {}", e.getMessage(), e);
                        }
                    } catch (Exception e) {
                        logger.error("[PAYMENT] Error using CartCleanupService: {}", e.getMessage(), e);

                        // If CartCleanupService fails, try direct approach
                        try {
                            logger.warn("[PAYMENT] CartCleanupService failed, trying direct approach");

                            // Try using the CartItemService clearCart method
                            try {
                                logger.info("[PAYMENT] Attempting to clear cart using CartItemService");
                                boolean cleared = cartItemService.clearCart(userId);
                                logger.info("[PAYMENT] CartItemService.clearCart result: {}", cleared);
                            } catch (Exception ex) {
                                logger.error("[PAYMENT] Error using CartItemService to clear cart: {}", ex.getMessage(), ex);
                            }

                            // Try one more time with CartItemService
                            try {
                                logger.info("[PAYMENT] Attempting one more cleanup with CartItemService");
                                boolean cleared = cartItemService.clearCart(userId);
                                logger.info("[PAYMENT] Final CartItemService.clearCart result: {}", cleared);
                            } catch (Exception ex) {
                                logger.error("[PAYMENT] Error in final CartItemService cleanup: {}", ex.getMessage(), ex);
                            }
                        } catch (Exception ex) {
                            logger.error("[PAYMENT] Error in fallback cleanup: {}", ex.getMessage(), ex);
                        }
                    }
                } else {
                    logger.info("[PAYMENT] Cart is already empty after finalization");
                }
            } else {
                logger.info("[PAYMENT] No active cart found after finalization");
            }

            // Final verification
            try {
                List<CartItem> finalCheck = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                logger.info("[PAYMENT] Final verification: User has {} active cart items", finalCheck.size());

                if (!finalCheck.isEmpty()) {
                    logger.warn("[PAYMENT] Cart items STILL exist after all cleanup attempts!");

                    // Log remaining items
                    for (CartItem item : finalCheck) {
                        logger.warn("[PAYMENT] Final remaining item: ID={}, productId={}, quantity={}, cartId={}",
                                item.getCartItemId(), item.getProduct().getProductId(),
                                item.getQuantity(), item.getCart().getCartId());
                    }

                    // Use a comprehensive approach to clear the cart
                    try {
                        logger.info("[PAYMENT] Using comprehensive approach to clear cart");

                        // APPROACH 1: Use CartItemService's clearCart method
                        try {
                            logger.info("[PAYMENT] Using CartItemService.clearCart");
                            boolean cleared = cartItemService.clearCart(userId);
                            logger.info("[PAYMENT] CartItemService.clearCart result: {}", cleared);
                        } catch (Exception e) {
                            logger.warn("[PAYMENT] CartItemService.clearCart failed: {}", e.getMessage());
                        }

                        // APPROACH 2: Use native SQL for maximum reliability
                        try {
                            logger.info("[PAYMENT] Using native SQL to delete cart items");
                            int deleted = cartItemRepository.deleteAllCartItemsByUserIdNative(userId);
                            logger.info("[PAYMENT] Native SQL deleted {} cart items", deleted);
                        } catch (Exception e) {
                            logger.warn("[PAYMENT] Native SQL deletion failed: {}", e.getMessage());
                        }

                        // APPROACH 3: Use CartCleanupService for a comprehensive cleanup
                        try {
                            logger.info("[PAYMENT] Using CartCleanupService to complete checkout process");
                            boolean success = cartCleanupService.completeCheckoutProcess(userId, order.getOrderId());
                            logger.info("[PAYMENT] CartCleanupService.completeCheckoutProcess result: {}", success);
                        } catch (Exception e) {
                            logger.warn("[PAYMENT] CartCleanupService failed: {}", e.getMessage());
                        }

                        // Final direct approach if all else failed
                        try {
                            logger.info("[PAYMENT] Attempting final direct cleanup");
                            Optional<Cart> activeCart = cartRepository.findActiveCartByUserId(userId);
                            if (activeCart.isPresent()) {
                                Cart cart = activeCart.get();
                                cart.getCartItems().clear();
                                cartRepository.save(cart);
                                logger.info("[PAYMENT] Final direct cleanup completed");
                            }
                        } catch (Exception e) {
                            logger.error("[PAYMENT] Error in final cleanup: {}", e.getMessage());
                        }
                    } catch (Exception e) {
                        logger.error("[PAYMENT] Error in comprehensive cart clearing: {}", e.getMessage(), e);
                    }
                } else {
                    logger.info("[PAYMENT] Cart is empty after all cleanup attempts");
                }
            } catch (Exception e) {
                logger.error("[PAYMENT] Error in final verification: {}", e.getMessage(), e);
            }

            // Return success response with order details
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment processed successfully");
            response.put("orderId", order.getOrderId());
            response.put("orderDate", order.getOrderDate());
            response.put("totalAmount", order.getTotalAmount());
            response.put("finalized", finalized);
            response.put("paymentIntentId", paymentIntentId);
            response.put("redirectUrl", "/payment-success?orderId=" + order.getOrderId());
            logger.info("[PAYMENT] Returning success response for order: {}", order.getOrderId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[PAYMENT] Error processing payment success: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
