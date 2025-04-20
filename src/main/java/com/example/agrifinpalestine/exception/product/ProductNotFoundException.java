package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class ProductNotFoundException extends ProductException {
    private static final String ERROR_CODE = "NOT_FOUND";
    
    public ProductNotFoundException(Integer productId) {
        super("Product not found with ID: " + productId, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
    
    public ProductNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
}
