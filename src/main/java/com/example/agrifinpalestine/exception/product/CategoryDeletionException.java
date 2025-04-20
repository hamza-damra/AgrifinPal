package com.example.agrifinpalestine.exception.product;

import org.springframework.http.HttpStatus;

public class CategoryDeletionException extends ProductException {
    private static final String ERROR_CODE = "CATEGORY_DELETION_FAILED";
    
    public CategoryDeletionException(Integer categoryId) {
        super("Failed to delete category with ID: " + categoryId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public CategoryDeletionException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public CategoryDeletionException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
