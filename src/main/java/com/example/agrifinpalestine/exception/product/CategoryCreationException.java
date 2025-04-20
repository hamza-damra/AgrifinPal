package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class CategoryCreationException extends ProductException {
    private static final String ERROR_CODE = "CATEGORY_CREATION_FAILED";
    
    public CategoryCreationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public CategoryCreationException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
