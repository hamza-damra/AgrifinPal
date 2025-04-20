package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class StoreCreationException extends StoreException {
    private static final String ERROR_CODE = "CREATION_FAILED";
    
    public StoreCreationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
    
    public StoreCreationException(String message, Throwable cause) {
        super(message, cause, HttpStatus.BAD_REQUEST, ERROR_CODE);
    }
}
