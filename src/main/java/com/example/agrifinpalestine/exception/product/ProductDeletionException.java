package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class ProductDeletionException extends ProductException {
    private static final String ERROR_CODE = "DELETION_FAILED";
    
    public ProductDeletionException(Integer productId) {
        super("Failed to delete product with ID: " + productId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public ProductDeletionException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public ProductDeletionException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
