package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class StoreDeletionException extends StoreException {
    private static final String ERROR_CODE = "DELETION_FAILED";
    
    public StoreDeletionException(Integer storeId) {
        super("Failed to delete store with ID: " + storeId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public StoreDeletionException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public StoreDeletionException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
