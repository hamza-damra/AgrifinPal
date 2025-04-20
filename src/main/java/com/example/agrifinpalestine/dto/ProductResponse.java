package com.example.agrifinpalestine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    // Original fields
    private Integer productId;
    private Integer storeId;
    private String storeName;
    private Integer categoryId;
    private String categoryName;
    private String productName;
    private String productDescription;
    private BigDecimal price;
    private Integer quantity;
    private String unit;
    private String productImage;
    private Boolean isOrganic;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional fields for frontend compatibility
    private Integer id;
    private String name;
    private String description;
    private String imageUrl;
    private StoreResponse store;
    private Double averageRating;
    private Integer reviewCount;

    // This method ensures the additional fields are populated from the original fields
    public void populateAdditionalFields() {
        this.id = this.productId;
        this.name = this.productName;
        this.description = this.productDescription;
        this.imageUrl = this.productImage;

        // Create store object if storeId and storeName are available
        if (this.storeId != null) {
            this.store = StoreResponse.builder()
                    .id(this.storeId)
                    .name(this.storeName)
                    .build();
        }

        // Default values if not set
        if (this.averageRating == null) {
            this.averageRating = 0.0;
        }

        if (this.reviewCount == null) {
            this.reviewCount = 0;
        }
    }
}
