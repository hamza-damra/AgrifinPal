package com.example.agrifinpalestine.exception.store;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

public class StoreException extends BaseException {
    private static final String ERROR_CODE_PREFIX = "STORE_";
    
    public StoreException(String message, HttpStatus status, String errorCode) {
        super(message, status, ERROR_CODE_PREFIX + errorCode);
    }
    
    public StoreException(String message, Throwable cause, HttpStatus status, String errorCode) {
        super(message, cause, status, ERROR_CODE_PREFIX + errorCode);
    }
}
