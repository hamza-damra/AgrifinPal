package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.dto.CategoryRequest;
import com.example.agrifinpalestine.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    
    /**
     * Create a new category
     * @param categoryRequest containing category details
     * @return CategoryResponse with created category details
     */
    CategoryResponse createCategory(CategoryRequest categoryRequest);
    
    /**
     * Get a category by ID
     * @param categoryId the ID of the category to retrieve
     * @return CategoryResponse with category details
     */
    CategoryResponse getCategoryById(Integer categoryId);
    
    /**
     * Update an existing category
     * @param categoryId the ID of the category to update
     * @param categoryRequest containing updated category details
     * @return CategoryResponse with updated category details
     */
    CategoryResponse updateCategory(Integer categoryId, CategoryRequest categoryRequest);
    
    /**
     * Delete a category by ID
     * @param categoryId the ID of the category to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteCategory(Integer categoryId);
    
    /**
     * Get all categories
     * @return List of CategoryResponse objects
     */
    List<CategoryResponse> getAllCategories();
}
