package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartStatus;

/**
 * Service interface for cart cleanup operations
 * This service is responsible for cleaning up cart items after a successful payment
 */
public interface CartCleanupService {

    /**
     * Clean up a cart by deleting all its items and marking it as completed
     * @param cartId the ID of the cart to clean up
     * @return the number of items deleted
     */
    int cleanupCart(Integer cartId);
    
    /**
     * Clean up a user's active cart by deleting all its items and marking it as completed
     * @param userId the ID of the user
     * @return the number of items deleted, or -1 if no active cart was found
     */
    int cleanupUserCart(Integer userId);
    
    /**
     * Mark a cart as completed without deleting its items
     * @param cart the cart to mark as completed
     * @return true if the cart was marked as completed, false otherwise
     */
    boolean markCartAsCompleted(Cart cart);
    
    /**
     * Create a new active cart for a user
     * @param userId the ID of the user
     * @return the ID of the new cart
     */
    Integer createNewCartForUser(Integer userId);
    
    /**
     * Complete the checkout process by cleaning up the cart and creating a new one
     * @param userId the ID of the user
     * @param orderId the ID of the order
     * @return true if the process was completed successfully, false otherwise
     */
    boolean completeCheckoutProcess(Integer userId, Integer orderId);
}
