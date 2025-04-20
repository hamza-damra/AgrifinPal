package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.dto.ProductRequest;
import com.example.agrifinpalestine.dto.ProductResponse;
import com.example.agrifinpalestine.dto.ProductSearchRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductService {

    /**
     * Create a new product
     * @param productRequest containing product details
     * @return ProductResponse with created product details
     */
    ProductResponse createProduct(ProductRequest productRequest);

    /**
     * Get a product by ID
     * @param productId the ID of the product to retrieve
     * @return ProductResponse with product details
     */
    ProductResponse getProductById(Integer productId);

    /**
     * Update an existing product
     * @param productId the ID of the product to update
     * @param productRequest containing updated product details
     * @return ProductResponse with updated product details
     */
    ProductResponse updateProduct(Integer productId, ProductRequest productRequest);

    /**
     * Delete a product by ID
     * @param productId the ID of the product to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteProduct(Integer productId);

    /**
     * Get all products
     * @return List of ProductResponse objects
     */
    List<ProductResponse> getAllProducts();

    /**
     * Get products by store ID
     * @param storeId the ID of the store
     * @return List of ProductResponse objects
     */
    List<ProductResponse> getProductsByStore(Integer storeId);

    /**
     * Get products by category ID
     * @param categoryId the ID of the category
     * @return List of ProductResponse objects
     */
    List<ProductResponse> getProductsByCategory(Integer categoryId);

    /**
     * Search for products based on various criteria
     * @param searchRequest containing search parameters
     * @return Page of ProductResponse objects
     */
    Page<ProductResponse> searchProducts(ProductSearchRequest searchRequest);

    /**
     * Search for products based on various criteria with pagination
     * @param searchRequest containing search parameters
     * @param pageable pagination information
     * @return Page of ProductResponse objects
     */
    Page<ProductResponse> searchProducts(ProductSearchRequest searchRequest, Pageable pageable);
}
