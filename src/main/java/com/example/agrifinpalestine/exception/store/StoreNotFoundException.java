package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class StoreNotFoundException extends StoreException {
    private static final String ERROR_CODE = "NOT_FOUND";
    
    public StoreNotFoundException(Integer storeId) {
        super("Store not found with ID: " + storeId, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
    
    public StoreNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
}
