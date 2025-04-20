package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class CategoryAlreadyExistsException extends ProductException {
    private static final String ERROR_CODE = "CATEGORY_ALREADY_EXISTS";
    
    public CategoryAlreadyExistsException(String language, String name) {
        super("Category with " + language + " name '" + name + "' already exists", HttpStatus.CONFLICT, ERROR_CODE);
    }
    
    public CategoryAlreadyExistsException(String message) {
        super(message, HttpStatus.CONFLICT, ERROR_CODE);
    }
}
