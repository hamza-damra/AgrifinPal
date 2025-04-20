package com.example.agrifinpalestine.exception.store;

import org.springframework.http.HttpStatus;

public class UserAlreadyHasStoreException extends StoreException {
    private static final String ERROR_CODE = "USER_ALREADY_HAS_STORE";
    
    public UserAlreadyHasStoreException(Integer userId) {
        super("User with ID: " + userId + " already has a store", HttpStatus.CONFLICT, ERROR_CODE);
    }
    
    public UserAlreadyHasStoreException(String message) {
        super(message, HttpStatus.CONFLICT, ERROR_CODE);
    }
}
