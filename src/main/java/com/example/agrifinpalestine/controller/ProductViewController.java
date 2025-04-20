package com.example.agrifinpalestine.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ProductViewController {

    /**
     * Display the edit product page
     * @param productId The ID of the product to edit
     * @return the edit-product template
     */
    @GetMapping("/edit-product/{productId}")
    public String editProductPage(@PathVariable Integer productId) {
        return "edit-product";
    }

    /**
     * Display the marketplace page
     * @return the marketplace template
     */
    @GetMapping("/marketplace")
    public String marketplacePage() {
        return "marketplace";
    }

    /**
     * Display the product details page
     * @param productId The ID of the product to display
     * @return the product-details template
     */
    @GetMapping("/product/{productId}")
    public String productDetailsPage(@PathVariable Integer productId) {
        return "product-details";
    }
}
