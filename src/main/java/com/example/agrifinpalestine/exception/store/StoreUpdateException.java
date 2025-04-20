package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class StoreUpdateException extends StoreException {
    private static final String ERROR_CODE = "UPDATE_FAILED";
    
    public StoreUpdateException(Integer storeId) {
        super("Failed to update store with ID: " + storeId, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public StoreUpdateException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public StoreUpdateException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
