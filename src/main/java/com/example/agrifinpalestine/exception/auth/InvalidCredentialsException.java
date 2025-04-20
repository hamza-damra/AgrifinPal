package com.example.agrifinpalestine.exception.auth;

public class InvalidCredentialsException extends AuthenticationException {
    private static final String ERROR_CODE = "INVALID_CREDENTIALS";
    
    public InvalidCredentialsException() {
        super("Invalid username or password", ERROR_CODE);
    }
    
    public InvalidCredentialsException(String message) {
        super(message, ERROR_CODE);
    }
    
    public InvalidCredentialsException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
}
