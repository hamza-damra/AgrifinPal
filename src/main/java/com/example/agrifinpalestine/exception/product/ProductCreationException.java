package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class ProductCreationException extends ProductException {
    private static final String ERROR_CODE = "CREATION_FAILED";
    
    public ProductCreationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public ProductCreationException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
