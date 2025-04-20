package com.example.agrifinpalestine.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CartViewController {

    /**
     * Display the cart page
     * @return the cart template
     */
    @GetMapping("/cart")
    @PreAuthorize("hasRole('USER')")
    public String cartPage() {
        return "cart";
    }

    /**
     * Display the checkout page
     * @return the checkout template
     */
    @GetMapping("/checkout")
    @PreAuthorize("hasRole('USER')")
    public String checkoutPage() {
        return "checkout";
    }

    /**
     * Display the cart test page
     * @return the cart test template
     */
    @GetMapping("/cart-test")
    public String cartTestPage() {
        return "cart-test";
    }
}
