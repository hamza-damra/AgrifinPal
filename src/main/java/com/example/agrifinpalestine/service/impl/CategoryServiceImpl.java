package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.ProductCategory;
import com.example.agrifinpalestine.Repository.ProductCategoryRepository;
import com.example.agrifinpalestine.dto.CategoryRequest;
import com.example.agrifinpalestine.dto.CategoryResponse;
import com.example.agrifinpalestine.exception.product.CategoryAlreadyExistsException;
import com.example.agrifinpalestine.exception.product.CategoryCreationException;
import com.example.agrifinpalestine.exception.product.CategoryDeletionException;
import com.example.agrifinpalestine.exception.product.CategoryNotFoundException;
import com.example.agrifinpalestine.exception.product.CategoryUpdateException;
import com.example.agrifinpalestine.service.CategoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryServiceImpl.class);

    private final ProductCategoryRepository categoryRepository;

    @Autowired
    public CategoryServiceImpl(ProductCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest categoryRequest) {
        try {
            // Check if category with same name already exists
            if (categoryRepository.findByCategoryNameEn(categoryRequest.getNameEn()).isPresent()) {
                throw new CategoryAlreadyExistsException("English", categoryRequest.getNameEn());
            }

            if (categoryRepository.findByCategoryNameAr(categoryRequest.getNameAr()).isPresent()) {
                throw new CategoryAlreadyExistsException("Arabic", categoryRequest.getNameAr());
            }

            // Create new category
            ProductCategory category = new ProductCategory();
            category.setCategoryNameEn(categoryRequest.getNameEn());
            category.setCategoryNameAr(categoryRequest.getNameAr());
            category.setCategoryDescription(categoryRequest.getDescription());
            category.setCategoryImage(categoryRequest.getImage());

            // Save category to database
            ProductCategory savedCategory = categoryRepository.save(category);

            // Return response
            return mapToCategoryResponse(savedCategory);
        } catch (CategoryAlreadyExistsException e) {
            // Re-throw this exception as it's already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error creating category: {}", e.getMessage());
            throw new CategoryCreationException("Failed to create category: " + e.getMessage(), e);
        }
    }

    @Override
    public CategoryResponse getCategoryById(Integer categoryId) {
        ProductCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        return mapToCategoryResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Integer categoryId, CategoryRequest categoryRequest) {
        try {
            // Find existing category
            ProductCategory existingCategory = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new CategoryNotFoundException(categoryId));

            // Check if updated names conflict with existing categories
            if (categoryRequest.getNameEn() != null) {
                categoryRepository.findByCategoryNameEn(categoryRequest.getNameEn())
                        .ifPresent(category -> {
                            if (!category.getCategoryId().equals(categoryId)) {
                                throw new CategoryAlreadyExistsException("English", categoryRequest.getNameEn());
                            }
                        });
                existingCategory.setCategoryNameEn(categoryRequest.getNameEn());
            }

            if (categoryRequest.getNameAr() != null) {
                categoryRepository.findByCategoryNameAr(categoryRequest.getNameAr())
                        .ifPresent(category -> {
                            if (!category.getCategoryId().equals(categoryId)) {
                                throw new CategoryAlreadyExistsException("Arabic", categoryRequest.getNameAr());
                            }
                        });
                existingCategory.setCategoryNameAr(categoryRequest.getNameAr());
            }

            // Update other fields if they are not null
            if (categoryRequest.getDescription() != null) {
                existingCategory.setCategoryDescription(categoryRequest.getDescription());
            }

            if (categoryRequest.getImage() != null) {
                existingCategory.setCategoryImage(categoryRequest.getImage());
            }

            // Save updated category
            ProductCategory updatedCategory = categoryRepository.save(existingCategory);

            // Return response
            return mapToCategoryResponse(updatedCategory);
        } catch (CategoryNotFoundException | CategoryAlreadyExistsException e) {
            // Re-throw these exceptions as they are already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error updating category: {}", e.getMessage());
            throw new CategoryUpdateException(String.valueOf(categoryId), e);
        }
    }

    @Override
    @Transactional
    public boolean deleteCategory(Integer categoryId) {
        try {
            if (!categoryRepository.existsById(categoryId)) {
                throw new CategoryNotFoundException(categoryId);
            }
            categoryRepository.deleteById(categoryId);
            return true;
        } catch (CategoryNotFoundException e) {
            // Re-throw this exception as it's already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting category: {}", e.getMessage());
            throw new CategoryDeletionException(String.valueOf(categoryId), e);
        }
    }

    @Override
    public List<CategoryResponse> getAllCategories() {
        List<ProductCategory> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    // Helper method to map ProductCategory entity to CategoryResponse DTO
    private CategoryResponse mapToCategoryResponse(ProductCategory category) {
        return CategoryResponse.builder()
                .id(category.getCategoryId())
                .nameEn(category.getCategoryNameEn())
                .nameAr(category.getCategoryNameAr())
                .description(category.getCategoryDescription())
                .image(category.getCategoryImage())
                .build();
    }
}
