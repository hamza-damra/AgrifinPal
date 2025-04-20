package com.example.agrifinpalestine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {
    @NotBlank(message = "English name is required")
    @Size(min = 2, max = 100, message = "English name must be between 2 and 100 characters")
    private String nameEn;

    @Size(max = 100, message = "Arabic name cannot exceed 100 characters")
    private String nameAr;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Size(max = 500, message = "Image URL cannot exceed 500 characters")
    private String image;
}
