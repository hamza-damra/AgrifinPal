package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.dto.CartItemRequest;
import com.example.agrifinpalestine.dto.CartItemResponse;
import com.example.agrifinpalestine.service.CartItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Delegating implementation of CartItemService that delegates to CartItemServiceImpl
 */
@Service
@Primary
public class CartItemServiceDelegator implements CartItemService {

    private final CartItemServiceImpl cartItemService;

    @Autowired
    public CartItemServiceDelegator(CartItemServiceImpl cartItemService) {
        this.cartItemService = cartItemService;
    }

    @Override
    public CartItemResponse addToCart(Integer userId, CartItemRequest cartItemRequest) {
        return cartItemService.addToCart(userId, cartItemRequest);
    }

    @Override
    public List<CartItemResponse> getCartItems(Integer userId) {
        return cartItemService.getCartItems(userId);
    }

    @Override
    public CartItemResponse updateCartItem(Integer userId, Integer cartItemId, CartItemRequest cartItemRequest) {
        return cartItemService.updateCartItem(userId, cartItemId, cartItemRequest);
    }

    @Override
    public boolean removeFromCart(Integer userId, Integer cartItemId) {
        return cartItemService.removeFromCart(userId, cartItemId);
    }

    @Override
    public boolean clearCart(Integer userId) {
        return cartItemService.clearCart(userId);
    }

    @Override
    public boolean isProductInCart(Integer userId, Integer productId) {
        return cartItemService.isProductInCart(userId, productId);
    }
}
