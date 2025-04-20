package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Product;
import com.example.agrifinpalestine.Entity.ProductCategory;
import com.example.agrifinpalestine.Entity.Review;
import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Repository.ProductCategoryRepository;
import com.example.agrifinpalestine.Repository.ProductRepository;
import com.example.agrifinpalestine.Repository.ReviewRepository;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.dto.ProductRequest;
import com.example.agrifinpalestine.dto.ProductResponse;
import com.example.agrifinpalestine.dto.ProductSearchRequest;
import com.example.agrifinpalestine.exception.product.CategoryNotFoundException;
import com.example.agrifinpalestine.exception.product.ProductCreationException;
import com.example.agrifinpalestine.exception.product.ProductDeletionException;
import com.example.agrifinpalestine.exception.product.ProductNotFoundException;
import com.example.agrifinpalestine.exception.product.ProductUpdateException;
import com.example.agrifinpalestine.exception.store.StoreNotFoundException;
import com.example.agrifinpalestine.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final ProductCategoryRepository categoryRepository;
    private final ReviewRepository reviewRepository;

    @Autowired
    public ProductServiceImpl(ProductRepository productRepository,
                             StoreRepository storeRepository,
                             ProductCategoryRepository categoryRepository,
                             ReviewRepository reviewRepository) {
        this.productRepository = productRepository;
        this.storeRepository = storeRepository;
        this.categoryRepository = categoryRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest productRequest) {
        try {
            // Get store and category
            Store store = storeRepository.findById(productRequest.getStoreId())
                    .orElseThrow(() -> new StoreNotFoundException(productRequest.getStoreId()));

            ProductCategory category = categoryRepository.findById(productRequest.getCategoryId())
                    .orElseThrow(() -> new CategoryNotFoundException(productRequest.getCategoryId()));

            // Create new product
            Product product = new Product();
            product.setStore(store);
            product.setCategory(category);
            product.setProductName(productRequest.getProductName());
            product.setProductDescription(productRequest.getProductDescription());
            product.setPrice(productRequest.getPrice());
            product.setQuantity(productRequest.getQuantity());
            product.setUnit(productRequest.getUnit());
            // Handle long image URLs by truncating if necessary
            String productImage = productRequest.getProductImage();
            if (productImage != null && productImage.length() > 255) {
                logger.warn("Product image URL is too long ({} characters), truncating to 255 characters", productImage.length());
                productImage = productImage.substring(0, 255);
            }
            product.setProductImage(productImage);
            product.setIsOrganic(productRequest.getIsOrganic() != null ? productRequest.getIsOrganic() : false);
            product.setIsAvailable(productRequest.getIsAvailable() != null ? productRequest.getIsAvailable() : true);
            product.setCreatedAt(LocalDateTime.now());
            product.setUpdatedAt(LocalDateTime.now());

            // Save product to database
            Product savedProduct = productRepository.save(product);

            // Return response
            return mapToProductResponse(savedProduct);
        } catch (StoreNotFoundException | CategoryNotFoundException e) {
            // Re-throw these exceptions as they are already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error creating product: {}", e.getMessage());
            throw new ProductCreationException("Failed to create product: " + e.getMessage(), e);
        }
    }

    @Override
    public ProductResponse getProductById(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));

        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Integer productId, ProductRequest productRequest) {
        try {
            // Find existing product
            Product existingProduct = productRepository.findById(productId)
                    .orElseThrow(() -> new ProductNotFoundException(productId));

            // Get store and category if they are being updated
            if (productRequest.getStoreId() != null) {
                Store store = storeRepository.findById(productRequest.getStoreId())
                        .orElseThrow(() -> new StoreNotFoundException(productRequest.getStoreId()));
                existingProduct.setStore(store);
            }

            if (productRequest.getCategoryId() != null) {
                ProductCategory category = categoryRepository.findById(productRequest.getCategoryId())
                        .orElseThrow(() -> new CategoryNotFoundException(productRequest.getCategoryId()));
                existingProduct.setCategory(category);
            }

            // Update product fields if they are not null
            if (productRequest.getProductName() != null) {
                existingProduct.setProductName(productRequest.getProductName());
            }

            if (productRequest.getProductDescription() != null) {
                existingProduct.setProductDescription(productRequest.getProductDescription());
            }

            if (productRequest.getPrice() != null) {
                existingProduct.setPrice(productRequest.getPrice());
            }

            if (productRequest.getQuantity() != null) {
                existingProduct.setQuantity(productRequest.getQuantity());
            }

            if (productRequest.getUnit() != null) {
                existingProduct.setUnit(productRequest.getUnit());
            }

            if (productRequest.getProductImage() != null) {
                // Handle long image URLs by truncating if necessary
                String productImage = productRequest.getProductImage();
                if (productImage.length() > 255) {
                    logger.warn("Product image URL is too long ({} characters), truncating to 255 characters", productImage.length());
                    productImage = productImage.substring(0, 255);
                }
                existingProduct.setProductImage(productImage);
            }

            if (productRequest.getIsOrganic() != null) {
                existingProduct.setIsOrganic(productRequest.getIsOrganic());
            }

            if (productRequest.getIsAvailable() != null) {
                existingProduct.setIsAvailable(productRequest.getIsAvailable());
            }

            // Update the updatedAt timestamp
            existingProduct.setUpdatedAt(LocalDateTime.now());

            // Save updated product
            Product updatedProduct = productRepository.save(existingProduct);

            // Return response
            return mapToProductResponse(updatedProduct);
        } catch (ProductNotFoundException | StoreNotFoundException | CategoryNotFoundException e) {
            // Re-throw these exceptions as they are already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error updating product: {}", e.getMessage());
            throw new ProductUpdateException(String.valueOf(productId), e);
        }
    }

    @Override
    @Transactional
    public boolean deleteProduct(Integer productId) {
        try {
            if (!productRepository.existsById(productId)) {
                throw new ProductNotFoundException(productId);
            }
            productRepository.deleteById(productId);
            return true;
        } catch (ProductNotFoundException e) {
            // Re-throw this exception as it's already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting product: {}", e.getMessage());
            throw new ProductDeletionException(String.valueOf(productId), e);
        }
    }

    @Override
    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(storeId));

        List<Product> products = productRepository.findByStore(store);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getProductsByCategory(Integer categoryId) {
        ProductCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new CategoryNotFoundException(categoryId));

        List<Product> products = productRepository.findByCategory(category);
        return products.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<ProductResponse> searchProducts(ProductSearchRequest searchRequest) {
        // Create pageable object for pagination and sorting
        Sort sort = Sort.by(
                searchRequest.getSortDirection().equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC,
                searchRequest.getSortBy());

        Pageable pageable = PageRequest.of(
                searchRequest.getPage(),
                searchRequest.getSize(),
                sort);

        // Perform search using the repository method
        Page<Product> productPage = productRepository.searchProducts(
                searchRequest.getStoreId(),
                searchRequest.getCategoryId(),
                searchRequest.getKeyword(),
                searchRequest.getMinPrice(),
                searchRequest.getMaxPrice(),
                searchRequest.getIsOrganic(),
                searchRequest.getIsAvailable(),
                pageable);

        // Map the results to DTOs
        return productPage.map(this::mapToProductResponse);
    }

    @Override
    public Page<ProductResponse> searchProducts(ProductSearchRequest searchRequest, Pageable pageable) {
        // If search request has specific pagination/sorting, use those instead
        if (searchRequest.getPage() >= 0 && searchRequest.getSize() > 0) {
            // Use the existing method with the search request's pagination
            return searchProducts(searchRequest);
        }

        // Perform search using the repository method with the provided pageable
        Page<Product> productPage = productRepository.searchProducts(
                searchRequest.getStoreId(),
                searchRequest.getCategoryId(),
                searchRequest.getSearchTerm(), // Use searchTerm instead of keyword for compatibility
                searchRequest.getMinPrice(),
                searchRequest.getMaxPrice(),
                searchRequest.getIsOrganic(),
                searchRequest.getIsAvailable(),
                pageable);

        // Map the results to DTOs
        return productPage.map(this::mapToProductResponse);
    }

    /**
     * Helper method to sort products based on Sort specification
     *
     * @param products List of products to sort
     * @param sort Sort specification
     * @return Sorted list of products
     */
    private List<Product> sortProducts(List<Product> products, Sort sort) {
        List<Product> sortedProducts = new ArrayList<>(products);

        sort.forEach(order -> {
            String property = order.getProperty();
            boolean isAscending = order.getDirection().isAscending();

            Comparator<Product> comparator = switch (property) {
                case "name", "productName" -> Comparator.comparing(Product::getProductName);
                case "price" -> Comparator.comparing(Product::getPrice);
                case "createdAt" -> Comparator.comparing(Product::getCreatedAt);
                default -> Comparator.comparing(Product::getProductId);
            };

            if (!isAscending) {
                comparator = comparator.reversed();
            }

            sortedProducts.sort(comparator);
        });

        return sortedProducts;
    }

    // Helper method to map Product entity to ProductResponse DTO
    private ProductResponse mapToProductResponse(Product product) {
        // Get reviews for this product
        List<Review> reviews = reviewRepository.findByProduct_ProductId(product.getProductId());

        // Calculate average rating
        double averageRating = 0.0;
        if (!reviews.isEmpty()) {
            averageRating = reviews.stream()
                    .mapToInt(Review::getRating)
                    .average()
                    .orElse(0.0);
        }

        // Build store response
        Store store = product.getStore();
        com.example.agrifinpalestine.dto.StoreResponse storeResponse = com.example.agrifinpalestine.dto.StoreResponse.builder()
                .id(store.getStoreId())
                .userId(store.getUser() != null ? store.getUser().getUserId() : null)
                .name(store.getStoreName())
                .description(store.getStoreDescription())
                .logo(store.getStoreLogo())
                .banner(store.getStoreBanner())
                .location(store.getLocation())
                .contactInfo(store.getContactInfo())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();

        // Build product response
        ProductResponse response = ProductResponse.builder()
                .productId(product.getProductId())
                .storeId(product.getStore().getStoreId())
                .storeName(product.getStore().getStoreName())
                .categoryId(product.getCategory().getCategoryId())
                .categoryName(product.getCategory().getCategoryNameEn()) // Using English name by default
                .productName(product.getProductName())
                .productDescription(product.getProductDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .unit(product.getUnit())
                .productImage(product.getProductImage())
                .isOrganic(product.getIsOrganic())
                .isAvailable(product.getIsAvailable())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                // Additional fields for frontend compatibility
                .id(product.getProductId())
                .name(product.getProductName())
                .description(product.getProductDescription())
                .imageUrl(product.getProductImage())
                .store(storeResponse)
                .averageRating(averageRating)
                .reviewCount(reviews.size())
                .build();

        return response;
    }
}
