package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class CategoryUpdateException extends ProductException {
    private static final String ERROR_CODE = "CATEGORY_UPDATE_FAILED";
    
    public CategoryUpdateException(Integer categoryId) {
        super("Failed to update category with ID: " + categoryId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public CategoryUpdateException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public CategoryUpdateException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
