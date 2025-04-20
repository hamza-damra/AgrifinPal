package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.User;

import java.util.Optional;

/**
 * Service interface for cart operations
 */
public interface CartService {

    /**
     * Create a new cart for a user
     * @param user the user to create a cart for
     * @return the created cart
     */
    Cart createCartForUser(User user);

    /**
     * Get the active cart for a user
     * @param userId the user ID
     * @return an optional containing the active cart, or empty if none exists
     */
    Optional<Cart> getActiveCartByUserId(Integer userId);
}
