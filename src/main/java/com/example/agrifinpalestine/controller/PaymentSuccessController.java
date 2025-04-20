package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.Entity.Order;
import com.example.agrifinpalestine.Repository.CartItemRepository;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.CartCleanupService;
import com.example.agrifinpalestine.service.CartItemService;
import com.example.agrifinpalestine.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Controller
public class PaymentSuccessController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentSuccessController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartItemService cartItemService;

    @Autowired
    private CartCleanupService cartCleanupService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @GetMapping("/payment-success")
    @PreAuthorize("hasRole('USER')")
    public String paymentSuccessGet(
            @RequestParam(required = false) Integer orderId,
            @RequestParam(required = false) String paymentIntentId,
            Model model) {

        return handlePaymentSuccess(orderId, paymentIntentId, model);
    }

    @PostMapping("/payment-success")
    @PreAuthorize("hasRole('USER')")
    public String paymentSuccessPost(
            @RequestParam(required = false) Integer orderId,
            @RequestParam(required = false) String paymentIntentId,
            Model model) {

        return handlePaymentSuccess(orderId, paymentIntentId, model);
    }

    /**
     * Common handler for both GET and POST requests
     */
    private String handlePaymentSuccess(Integer orderId, String paymentIntentId, Model model) {
        logger.info("[PAYMENT_SUCCESS] Handling payment success for orderId: {}, paymentIntentId: {}", orderId, paymentIntentId);

        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();
            logger.info("[PAYMENT_SUCCESS] User ID: {}", userId);

            // Use a comprehensive approach to clear the cart
            try {
                logger.info("[PAYMENT_SUCCESS] Using comprehensive approach to clear cart");
                boolean cartCleared = false;

                // Check if user has any cart items before processing
                List<CartItem> initialCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                int initialItemCount = initialCartItems.size();
                logger.info("[PAYMENT_SUCCESS] User has {} cart items before cleanup", initialItemCount);

                if (initialItemCount == 0) {
                    logger.info("[PAYMENT_SUCCESS] Cart is already empty, nothing to clean up");
                    model.addAttribute("cartCleared", true);
                    model.addAttribute("cartStatus", "ALREADY_EMPTY");
                } else {
                    // APPROACH 1: Use CartItemService's clearCart method
                    try {
                        logger.info("[PAYMENT_SUCCESS] Using CartItemService.clearCart");
                        boolean cleared = cartItemService.clearCart(userId);
                        logger.info("[PAYMENT_SUCCESS] CartItemService.clearCart result: {}", cleared);
                        cartCleared = cleared;
                    } catch (Exception e) {
                        logger.warn("[PAYMENT_SUCCESS] CartItemService.clearCart failed: {}", e.getMessage());
                    }

                    // APPROACH 2: Use native SQL for maximum reliability
                    try {
                        logger.info("[PAYMENT_SUCCESS] Using native SQL to delete cart items");
                        int deleted = cartItemRepository.deleteAllCartItemsByUserIdNative(userId);
                        logger.info("[PAYMENT_SUCCESS] Native SQL deleted {} cart items", deleted);
                        if (deleted > 0) cartCleared = true;
                    } catch (Exception e) {
                        logger.warn("[PAYMENT_SUCCESS] Native SQL deletion failed: {}", e.getMessage());
                    }

                    // APPROACH 3: Use CartCleanupService for a comprehensive cleanup
                    try {
                        logger.info("[PAYMENT_SUCCESS] Using CartCleanupService");
                        boolean success = false;

                        if (orderId != null) {
                            // If we have an order ID, use the completeCheckoutProcess method
                            success = cartCleanupService.completeCheckoutProcess(userId, orderId);
                            logger.info("[PAYMENT_SUCCESS] CartCleanupService (with orderId) result: {}", success);
                        } else {
                            // Otherwise, use the cleanupUserCart method
                            int deleted = cartCleanupService.cleanupUserCart(userId);
                            success = deleted > 0;
                            logger.info("[PAYMENT_SUCCESS] CartCleanupService (without orderId) deleted {} items", deleted);
                        }

                        if (success) cartCleared = true;
                    } catch (Exception e) {
                        logger.warn("[PAYMENT_SUCCESS] CartCleanupService failed: {}", e.getMessage());
                    }

                    // Final direct approach if all else failed
                    try {
                        logger.info("[PAYMENT_SUCCESS] Attempting final direct cleanup");
                        Optional<Cart> activeCart = cartRepository.findActiveCartByUserId(userId);
                        if (activeCart.isPresent()) {
                            Cart cart = activeCart.get();
                            cart.getCartItems().clear();
                            cartRepository.save(cart);
                            logger.info("[PAYMENT_SUCCESS] Final direct cleanup completed");
                            cartCleared = true;
                        }
                    } catch (Exception e) {
                        logger.error("[PAYMENT_SUCCESS] Error in final cleanup: {}", e.getMessage());
                    }

                    // Final verification
                    List<CartItem> finalCartItems = cartItemRepository.findAllByUserIdAndCartStatusActive(userId);
                    int finalItemCount = finalCartItems.size();
                    logger.info("[PAYMENT_SUCCESS] Final verification: User has {} cart items after cleanup", finalItemCount);

                    if (finalItemCount > 0) {
                        logger.warn("[PAYMENT_SUCCESS] Cart items STILL exist after all cleanup attempts!");
                        model.addAttribute("cartCleared", false);
                        model.addAttribute("cartStatus", "CLEANUP_INCOMPLETE");
                    } else {
                        logger.info("[PAYMENT_SUCCESS] Cart is empty after cleanup");
                        model.addAttribute("cartCleared", true);
                        model.addAttribute("cartStatus", "CLEARED");
                    }
                }
            } catch (Exception e) {
                logger.error("[PAYMENT_SUCCESS] Error in comprehensive cart clearing: {}", e.getMessage(), e);
                model.addAttribute("cartCleared", false);
                model.addAttribute("cartClearError", e.getMessage());
            }
        } else {
            logger.warn("[PAYMENT_SUCCESS] No authenticated user found");
        }

        // If orderId is provided, get order details
        if (orderId != null) {
            Order order = orderService.getOrderById(orderId);
            if (order != null) {
                logger.info("[PAYMENT_SUCCESS] Found order: {}", order.getOrderId());
                model.addAttribute("orderId", order.getOrderId());
                model.addAttribute("orderDate", order.getOrderDate());
                model.addAttribute("totalAmount", order.getTotalAmount());
                return "payment-success";
            } else {
                logger.warn("[PAYMENT_SUCCESS] Order not found for ID: {}", orderId);
            }
        }

        // If paymentIntentId is provided but no orderId, try to find by paymentIntentId
        if (paymentIntentId != null && !paymentIntentId.isEmpty()) {
            logger.info("[PAYMENT_SUCCESS] Using paymentIntentId: {}", paymentIntentId);
            // This would require a method to find order by paymentIntentId
            // For now, we'll just show a generic success page
        }

        // Fallback to generic success information
        logger.info("[PAYMENT_SUCCESS] Using fallback success information");
        model.addAttribute("orderId", orderId != null ? orderId : "N/A");
        model.addAttribute("orderDate", new Date());
        model.addAttribute("totalAmount", BigDecimal.ZERO);

        return "payment-success";
    }
}
