package com.example.agrifinpalestine.exception.auth;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

public class AuthenticationException extends BaseException {
    private static final String ERROR_CODE_PREFIX = "AUTH_";
    
    public AuthenticationException(String message, String errorCode) {
        super(message, HttpStatus.UNAUTHORIZED, ERROR_CODE_PREFIX + errorCode);
    }
    
    public AuthenticationException(String message, Throwable cause, String errorCode) {
        super(message, cause, HttpStatus.UNAUTHORIZED, ERROR_CODE_PREFIX + errorCode);
    }
}
