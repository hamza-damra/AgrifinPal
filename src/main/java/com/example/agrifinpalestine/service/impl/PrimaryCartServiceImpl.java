package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Primary implementation of CartService that delegates to CartItemServiceImpl
 */
@Service
@Primary
public class PrimaryCartServiceImpl implements CartService {

    private final CartItemServiceImpl cartItemService;

    @Autowired
    public PrimaryCartServiceImpl(CartItemServiceImpl cartItemService) {
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
