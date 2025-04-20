package com.example.agrifinpalestine.exception.user;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user is not found
 */
public class UserNotFoundException extends BaseException {
    private static final String ERROR_CODE = "USER_NOT_FOUND";
    
    public UserNotFoundException(Integer userId) {
        super("User not found with ID: " + userId, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
    
    public UserNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
    
    public UserNotFoundException(String message, Throwable cause) {
        super(message, cause, HttpStatus.NOT_FOUND, ERROR_CODE);
    }
}
