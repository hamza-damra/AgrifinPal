package com.example.agrifinpalestine.exception.auth;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user doesn't have the required role to perform an action
 */
public class RoleRequiredException extends BaseException {
    private static final String ERROR_CODE = "AUTH_ROLE_REQUIRED";
    
    public RoleRequiredException(String role) {
        super("The " + role + " role is required to perform this action", HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public RoleRequiredException(String message, String role) {
        super(message, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public RoleRequiredException(String message, Throwable cause) {
        super(message, cause, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
}
