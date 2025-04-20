package com.example.agrifinpalestine.exception.auth;

public class TokenExpiredException extends AuthenticationException {
    private static final String ERROR_CODE = "TOKEN_EXPIRED";
    
    public TokenExpiredException() {
        super("Authentication token has expired", ERROR_CODE);
    }
    
    public TokenExpiredException(String message) {
        super(message, ERROR_CODE);
    }
    
    public TokenExpiredException(String message, Throwable cause) {
        super(message, cause, ERROR_CODE);
    }
}
