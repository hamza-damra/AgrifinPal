package com.example.agrifinpalestine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreRequest {
    // User ID is optional as it can be retrieved from the authenticated user
    private Integer userId;

    @NotBlank(message = "Store name is required")
    @Size(min = 2, max = 100, message = "Store name must be between 2 and 100 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    @Size(max = 500, message = "Logo URL cannot exceed 500 characters")
    private String logo;

    @Size(max = 500, message = "Banner URL cannot exceed 500 characters")
    private String banner;

    @Size(max = 200, message = "Location cannot exceed 200 characters")
    private String location;

    @Size(max = 200, message = "Contact information cannot exceed 200 characters")
    private String contactInfo;
}
