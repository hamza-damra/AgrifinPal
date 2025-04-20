package com.example.agrifinpalestine.exception.user;

/**
 * Exception thrown when a user tries to access a resource they are not authorized to access
 */
public class UnauthorizedAccessException extends RuntimeException {

    /**
     * Create a new UnauthorizedAccessException with a message
     * @param message the error message
     */
    public UnauthorizedAccessException(String message) {
        super(message);
    }

    /**
     * Create a new UnauthorizedAccessException with a message and cause
     * @param message the error message
     * @param cause the cause of the exception
     */
    public UnauthorizedAccessException(String message, Throwable cause) {
        super(message, cause);
    }
}
