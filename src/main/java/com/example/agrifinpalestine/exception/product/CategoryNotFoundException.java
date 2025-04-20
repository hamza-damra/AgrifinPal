package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class CategoryNotFoundException extends ProductException {
    private static final String ERROR_CODE = "CATEGORY_NOT_FOUND";
    
    public CategoryNotFoundException(Integer categoryId) {
        super("Category not found with ID: " + categoryId, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
    
    public CategoryNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
}
