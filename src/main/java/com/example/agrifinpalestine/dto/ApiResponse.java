package com.example.agrifinpalestine.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;

    /**
     * Create a new ApiResponse with success and message
     * @param success whether the operation was successful
     * @param message the message to return
     */
    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    /**
     * Create a new ApiResponse with success, message, and data
     * @param success whether the operation was successful
     * @param message the message to return
     * @param data the data to return
     */
    public ApiResponse(boolean success, String message, Object data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
}
