package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class ProductUpdateException extends ProductException {
    private static final String ERROR_CODE = "UPDATE_FAILED";
    
    public ProductUpdateException(Integer productId) {
        super("Failed to update product with ID: " + productId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public ProductUpdateException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public ProductUpdateException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
