package com.example.agrifinpalestine.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchRequest {
    private Integer storeId;
    private Integer categoryId;

    @Size(max = 100, message = "Keyword cannot exceed 100 characters")
    private String keyword;

    @Size(max = 100, message = "Search term cannot exceed 100 characters")
    private String searchTerm; // Alias for keyword for frontend compatibility

    @DecimalMin(value = "0", message = "Minimum price cannot be negative")
    private BigDecimal minPrice;

    @DecimalMin(value = "0", message = "Maximum price cannot be negative")
    private BigDecimal maxPrice;

    private Boolean isOrganic;
    private Boolean isAvailable;

    @Min(value = 0, message = "Page number cannot be negative")
    private Integer page = 0;

    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 100, message = "Page size cannot exceed 100")
    private Integer size = 10;

    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Sort by field can only contain letters and numbers")
    private String sortBy = "productId";

    @Pattern(regexp = "^(asc|desc)$", message = "Sort direction must be 'asc' or 'desc'")
    private String sortDirection = "asc";
}
