package com.example.agrifinpalestine.exception.product;

import com.example.agrifinpalestine.exception.BaseException;
import org.springframework.http.HttpStatus;

public class ProductException extends BaseException {
    private static final String ERROR_CODE_PREFIX = "PRODUCT_";
    
    public ProductException(String message, HttpStatus status, String errorCode) {
        super(message, status, ERROR_CODE_PREFIX + errorCode);
    }
    
    public ProductException(String message, Throwable cause, HttpStatus status, String errorCode) {
        super(message, cause, status, ERROR_CODE_PREFIX + errorCode);
    }
}
