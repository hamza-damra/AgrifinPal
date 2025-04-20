package com.example.agrifinpalestine.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for cart view pages
 */
@Controller
@RequestMapping("/cart")
public class CartViewController {

    /**
     * Display the cart page
     * @return The cart page view name
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public String cartPage() {
        return "cart";
    }
}
