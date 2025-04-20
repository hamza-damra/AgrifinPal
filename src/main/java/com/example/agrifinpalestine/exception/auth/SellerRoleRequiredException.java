package com.example.agrifinpalestine.exception.auth;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user without the SELLER role tries to perform seller-specific actions
 */
public class SellerRoleRequiredException extends BaseException {
    private static final String ERROR_CODE = "AUTH_SELLER_ROLE_REQUIRED";
    
    public SellerRoleRequiredException() {
        super("The SELLER role is required to perform this action", HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public SellerRoleRequiredException(String message) {
        super(message, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
    
    public SellerRoleRequiredException(String message, Throwable cause) {
        super(message, cause, HttpStatus.FORBIDDEN, ERROR_CODE);
    }
}
