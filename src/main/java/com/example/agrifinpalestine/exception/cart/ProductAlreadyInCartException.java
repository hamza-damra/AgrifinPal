package com.example.agrifinpalestine.exception.cart;

import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.dto.CartItemResponse;

/**
 * Exception thrown when a user tries to add a product that is already in their cart
 */
public class ProductAlreadyInCartException extends RuntimeException {

    private final Integer productId;
    private final CartItemResponse existingItem;

    public ProductAlreadyInCartException(Integer productId, CartItemResponse existingItem) {
        super("Product with ID " + productId + " is already in your cart. Please update the quantity instead of adding it again.");
        this.productId = productId;
        this.existingItem = existingItem;
    }

    public Integer getProductId() {
        return productId;
    }

    public CartItemResponse getExistingItem() {
        return existingItem;
    }
}
