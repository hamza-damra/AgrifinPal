package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Delegating implementation of CartService that delegates to CartItemServiceImpl
 */
@Service
public class CartServiceImpl implements CartService {

    private final CartItemServiceImpl cartItemService;

    @Autowired
    public CartServiceImpl(@Lazy CartItemServiceImpl cartItemService) {
        this.cartItemService = cartItemService;
    }

    @Override
    public Cart createCartForUser(User user) {
        return cartItemService.createCartForUser(user);
    }

    @Override
    public Optional<Cart> getActiveCartByUserId(Integer userId) {
        return cartItemService.getActiveCartByUserId(userId);
    }
}
