package com.example.agrifinpalestine.exception.auth;

public class InvalidTokenException extends AuthenticationException {
    private static final String ERROR_CODE = "INVALID_TOKEN";
    
    public InvalidTokenException() {
        super("Invalid authentication token", ERROR_CODE);
    }
    
    public InvalidTokenException(String message) {
        super(message, ERROR_CODE);
    }
    
    public InvalidTokenException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
}
