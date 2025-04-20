package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for order operations
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private OrderService orderService;

    /**
     * Delete an order
     * @param orderId The ID of the order to delete
     * @return Response indicating success or failure
     */
    @DeleteMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> deleteOrder(@PathVariable Integer orderId) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Integer userId = userDetails.getId();

        logger.info("Request to delete order ID: {} from user ID: {}", orderId, userId);

        boolean deleted = orderService.deleteOrder(orderId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", orderId);
        
        if (deleted) {
            logger.info("Successfully deleted order ID: {} for user ID: {}", orderId, userId);
            return ResponseEntity.ok(new ApiResponse(true, "Order deleted successfully", response));
        } else {
            logger.warn("Failed to delete order ID: {} for user ID: {}", orderId, userId);
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Failed to delete order", response));
        }
    }
}
