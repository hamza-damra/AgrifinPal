package com.example.agrifinpalestine.exception.auth;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

public class UserAlreadyExistsException extends BaseException {
    private static final String ERROR_CODE = "AUTH_USER_ALREADY_EXISTS";
    
    public UserAlreadyExistsException(String field) {
        super("User with this " + field + " already exists", HttpStatus.CONFLICT, ERROR_CODE);
    }
    
    public UserAlreadyExistsException(String message, String field) {
        super(message, HttpStatus.CONFLICT, ERROR_CODE);
    }
}
