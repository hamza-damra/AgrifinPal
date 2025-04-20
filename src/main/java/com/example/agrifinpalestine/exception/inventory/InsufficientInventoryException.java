package com.example.agrifinpalestine.exception.inventory;

import com.example.agrifinpalestine.exception.BaseException;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown when there is not enough inventory for a product
 */
@Getter
public class InsufficientInventoryException extends BaseException {
    private static final String ERROR_CODE = "INVENTORY_INSUFFICIENT";
    
    private final Integer productId;
    private final Integer requestedQuantity;
    private final Integer availableQuantity;
    
    public InsufficientInventoryException(Integer productId, Integer requestedQuantity, Integer availableQuantity) {
        super(
            String.format("Insufficient inventory for product ID %d. Requested: %d, Available: %d", 
                productId, requestedQuantity, availableQuantity),
            HttpStatus.BAD_REQUEST,
            ERROR_CODE
        );
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }

}
