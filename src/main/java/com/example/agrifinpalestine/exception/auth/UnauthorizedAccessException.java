package com.example.agrifinpalestine.exception.auth;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user attempts to access a resource they don't have permission for
 */
public class UnauthorizedAccessException extends BaseException {
    private static final String ERROR_CODE = "AUTH_UNAUTHORIZED_ACCESS";
    
    public UnauthorizedAccessException() {
        super("You don't have permission to access this resource", HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public UnauthorizedAccessException(String message) {
        super(message, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public UnauthorizedAccessException(String message, Throwable cause) {
        super(message, cause, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
}
