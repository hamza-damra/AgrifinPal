package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.dto.CartItemRequest;
import com.example.agrifinpalestine.dto.CartItemResponse;

import java.util.List;

/**
 * Service interface for cart item operations
 */
public interface CartItemService {

    /**
     * Add a product to the user's cart
     * @param userId The ID of the user
     * @param cartItemRequest The cart item request containing product ID and quantity
     * @return The added cart item
     */
    CartItemResponse addToCart(Integer userId, CartItemRequest cartItemRequest);

    /**
     * Get all items in the user's cart
     * @param userId The ID of the user
     * @return List of cart items
     */
    List<CartItemResponse> getCartItems(Integer userId);

    /**
     * Update the quantity of a cart item
     * @param userId The ID of the user
     * @param cartItemId The ID of the cart item
     * @param cartItemRequest The cart item request containing the new quantity
     * @return The updated cart item
     */
    CartItemResponse updateCartItem(Integer userId, Integer cartItemId, CartItemRequest cartItemRequest);

    /**
     * Remove an item from the user's cart
     * @param userId The ID of the user
     * @param cartItemId The ID of the cart item
     * @return true if the item was removed, false otherwise
     */
    boolean removeFromCart(Integer userId, Integer cartItemId);

    /**
     * Clear all items from the user's cart
     * @param userId The ID of the user
     * @return true if the cart was cleared, false otherwise
     */
    boolean clearCart(Integer userId);

    /**
     * Check if a product is in a user's cart
     * @param userId the user ID
     * @param productId the product ID
     * @return true if the product is in the cart, false otherwise
     */
    boolean isProductInCart(Integer userId, Integer productId);
}
