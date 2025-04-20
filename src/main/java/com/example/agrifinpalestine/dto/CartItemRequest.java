package com.example.agrifinpalestine.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for cart item requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemRequest {
    
    /**
     * The ID of the product to add to the cart
     */
    @NotNull(message = "Product ID is required")
    private Integer productId;
    
    /**
     * The quantity of the product to add to the cart
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
