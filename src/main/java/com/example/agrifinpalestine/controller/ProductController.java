package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.ProductRequest;
import com.example.agrifinpalestine.dto.ProductResponse;
import com.example.agrifinpalestine.dto.ProductSearchRequest;
import com.example.agrifinpalestine.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.security.UserDetailsImpl;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*", maxAge = 3600)
@Validated
public class ProductController {

    private final ProductService productService;
    private final StoreRepository storeRepository;

    @Autowired
    public ProductController(ProductService productService, StoreRepository storeRepository) {
        this.productService = productService;
        this.storeRepository = storeRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<?> createProduct(@Valid @RequestBody ProductRequest productRequest) {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // If storeId is not provided, find the user's store
            if (productRequest.getStoreId() == null) {
                // Find the store owned by the authenticated user
                Store userStore = storeRepository.findByUser_UserId(userId).orElse(null);

                if (userStore == null) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("message", "You need to create a store before adding products");
                    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
                }

                productRequest.setStoreId(userStore.getStoreId());
            } else {
                // Verify that the user owns the specified store
                Store store = storeRepository.findById(productRequest.getStoreId()).orElse(null);

                if (store == null) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("message", "Store not found with the provided ID");
                    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
                }

                if (!store.getUser().getUserId().equals(userId)) {
                    Map<String, String> errorResponse = new HashMap<>();
                    errorResponse.put("message", "You don't have permission to add products to this store");
                    return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
                }
            }

            ProductResponse createdProduct = productService.createProduct(productRequest);
            return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error creating product: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable @Min(value = 1, message = "Product ID must be positive") Integer productId) {
        try {
            ProductResponse product = productService.getProductById(productId);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable @Min(value = 1, message = "Product ID must be positive") Integer productId,
            @Valid @RequestBody ProductRequest productRequest) {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Get the product to check ownership
            ProductResponse existingProduct = productService.getProductById(productId);
            if (existingProduct == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Verify that the user owns the store that owns this product
            Store store = storeRepository.findById(existingProduct.getStoreId()).orElse(null);
            if (store == null || !store.getUser().getUserId().equals(userId)) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN); // User doesn't own this store
            }

            // If storeId is provided in the request, verify ownership
            if (productRequest.getStoreId() != null && !productRequest.getStoreId().equals(existingProduct.getStoreId())) {
                Store newStore = storeRepository.findById(productRequest.getStoreId()).orElse(null);
                if (newStore == null || !newStore.getUser().getUserId().equals(userId)) {
                    return new ResponseEntity<>(HttpStatus.FORBIDDEN); // User doesn't own the new store
                }
            }

            ProductResponse updatedProduct = productService.updateProduct(productId, productRequest);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteProduct(@PathVariable @Min(value = 1, message = "Product ID must be positive") Integer productId) {
        Map<String, Boolean> response = new HashMap<>();
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Get the product to check ownership
            ProductResponse existingProduct = productService.getProductById(productId);
            if (existingProduct == null) {
                response.put("deleted", false);
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }

            // Verify that the user owns the store that owns this product
            Store store = storeRepository.findById(existingProduct.getStoreId()).orElse(null);
            if (store == null || !store.getUser().getUserId().equals(userId)) {
                response.put("deleted", false);
                return new ResponseEntity<>(response, HttpStatus.FORBIDDEN); // User doesn't own this store
            }

            boolean deleted = productService.deleteProduct(productId);
            response.put("deleted", deleted);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("deleted", false);
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * Get paginated products with optional filtering and sorting
     *
     * @param page Page number (0-based)
     * @param size Number of items per page
     * @param search Optional search term
     * @param categoryId Optional category ID filter
     * @param organic Optional filter for organic products
     * @param sort Optional sort field and direction (e.g., "name,asc" or "price,desc")
     * @return Page of ProductResponse objects
     */
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getPaginatedProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean organic,
            @RequestParam(defaultValue = "productId,asc") String sort) {

        // Parse sort parameter
        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("desc") ?
                Sort.Direction.DESC : Sort.Direction.ASC;

        // Create pageable object
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        // Create search request
        ProductSearchRequest searchRequest = new ProductSearchRequest();
        searchRequest.setSearchTerm(search);
        searchRequest.setCategoryId(categoryId);
        searchRequest.setIsOrganic(organic);

        // Get paginated products
        Page<ProductResponse> products = productService.searchProducts(searchRequest, pageable);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/store/{storeId}")
    public ResponseEntity<List<ProductResponse>> getProductsByStore(@PathVariable Integer storeId) {
        try {
            List<ProductResponse> products = productService.getProductsByStore(storeId);
            return ResponseEntity.ok(products);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable Integer categoryId) {
        try {
            List<ProductResponse> products = productService.getProductsByCategory(categoryId);
            return ResponseEntity.ok(products);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get products for the current authenticated user
     *
     * @return List of products owned by the current user
     */
    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserProducts() {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Find the store owned by the authenticated user
            Store userStore = storeRepository.findByUser_UserId(userId).orElse(null);

            if (userStore == null) {
                // User doesn't have a store, return empty list
                return ResponseEntity.ok(new ArrayList<ProductResponse>());
            }

            // Get products for this store
            List<ProductResponse> products = productService.getProductsByStore(userStore.getStoreId());
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error fetching user products: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProducts(@RequestBody ProductSearchRequest searchRequest) {
        try {
            Page<ProductResponse> productPage = productService.searchProducts(searchRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("products", productPage.getContent());
            response.put("currentPage", productPage.getNumber());
            response.put("totalItems", productPage.getTotalElements());
            response.put("totalPages", productPage.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
