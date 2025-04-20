package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.Entity.Order;
import com.example.agrifinpalestine.Entity.User;

import java.util.List;

public interface OrderService {

    /**
     * Create a new order from the user's cart
     *
     * @param userId The ID of the user placing the order
     * @param paymentIntentId The Stripe payment intent ID
     * @return The created order
     */
    Order createOrderFromCart(Integer userId, String paymentIntentId);

    /**
     * Get all orders for a user
     *
     * @param userId The ID of the user
     * @return List of orders
     */
    List<Order> getUserOrders(Integer userId);

    /**
     * Get order by ID
     *
     * @param orderId The ID of the order
     * @return The order if found
     */
    Order getOrderById(Integer orderId);

    /**
     * Delete an order by ID
     *
     * @param orderId The ID of the order to delete
     * @param userId The ID of the user who owns the order (for security check)
     * @return true if the order was deleted successfully, false otherwise
     */
    boolean deleteOrder(Integer orderId, Integer userId);

    /**
     * Update order payment status
     *
     * @param orderId The ID of the order
     * @param paymentStatus The new payment status
     * @return The updated order
     */
    Order updateOrderPaymentStatus(Integer orderId, String paymentStatus);

    /**
     * Finalize order after successful payment
     * This will mark the cart as completed and clear cart items
     *
     * @param userId The ID of the user
     * @param orderId The ID of the order
     * @return true if successful
     */
    boolean finalizeOrder(Integer userId, Integer orderId);
}
