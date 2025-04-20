package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class UnauthorizedStoreAccessException extends StoreException {
    private static final String ERROR_CODE = "UNAUTHORIZED_ACCESS";
    
    public UnauthorizedStoreAccessException() {
        super("You are not authorized to access this store", HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public UnauthorizedStoreAccessException(String message) {
        super(message, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
}
