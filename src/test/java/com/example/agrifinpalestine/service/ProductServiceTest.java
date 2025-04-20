package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.Entity.Product;
import com.example.agrifinpalestine.Entity.ProductCategory;
import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Repository.ProductCategoryRepository;
import com.example.agrifinpalestine.Repository.ProductRepository;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.dto.ProductRequest;
import com.example.agrifinpalestine.dto.ProductResponse;
import com.example.agrifinpalestine.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private ProductCategoryRepository categoryRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product testProduct;
    private Store testStore;
    private ProductCategory testCategory;
    private ProductRequest testProductRequest;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Create test store
        testStore = new Store();
        testStore.setStoreId(1);
        testStore.setStoreName("Test Store");

        // Create test category
        testCategory = new ProductCategory();
        testCategory.setCategoryId(1);
        testCategory.setCategoryNameEn("Test Category");
        testCategory.setCategoryNameAr("فئة اختبار");

        // Create test product
        testProduct = new Product();
        testProduct.setProductId(1);
        testProduct.setStore(testStore);
        testProduct.setCategory(testCategory);
        testProduct.setProductName("Test Product");
        testProduct.setProductDescription("Test Description");
        testProduct.setPrice(new BigDecimal("10.99"));
        testProduct.setQuantity(100);
        testProduct.setUnit("kg");
        testProduct.setProductImage("test-image.jpg");
        testProduct.setIsOrganic(true);
        testProduct.setIsAvailable(true);
        testProduct.setCreatedAt(LocalDateTime.now());
        testProduct.setUpdatedAt(LocalDateTime.now());

        // Create test product request
        testProductRequest = new ProductRequest();
        testProductRequest.setStoreId(1);
        testProductRequest.setCategoryId(1);
        testProductRequest.setProductName("Test Product");
        testProductRequest.setProductDescription("Test Description");
        testProductRequest.setPrice(new BigDecimal("10.99"));
        testProductRequest.setQuantity(100);
        testProductRequest.setUnit("kg");
        testProductRequest.setProductImage("test-image.jpg");
        testProductRequest.setIsOrganic(true);
        testProductRequest.setIsAvailable(true);
    }

    @Test
    void createProduct_Success() {
        // Arrange
        when(storeRepository.findById(1)).thenReturn(Optional.of(testStore));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(testCategory));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // Act
        ProductResponse result = productService.createProduct(testProductRequest);

        // Assert
        assertNotNull(result);
        assertEquals(testProduct.getProductId(), result.getProductId());
        assertEquals(testProduct.getProductName(), result.getProductName());
        assertEquals(testProduct.getPrice(), result.getPrice());
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    void getProductById_Success() {
        // Arrange
        when(productRepository.findById(1)).thenReturn(Optional.of(testProduct));

        // Act
        ProductResponse result = productService.getProductById(1);

        // Assert
        assertNotNull(result);
        assertEquals(testProduct.getProductId(), result.getProductId());
        assertEquals(testProduct.getProductName(), result.getProductName());
    }

    @Test
    void getProductById_NotFound() {
        // Arrange
        when(productRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> productService.getProductById(999));
    }

    @Test
    void updateProduct_Success() {
        // Arrange
        when(productRepository.findById(1)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // Update request with new values
        ProductRequest updateRequest = new ProductRequest();
        updateRequest.setProductName("Updated Product");
        updateRequest.setPrice(new BigDecimal("15.99"));

        // Act
        ProductResponse result = productService.updateProduct(1, updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Updated Product", result.getProductName());
        assertEquals(new BigDecimal("15.99"), result.getPrice());
    }

    @Test
    void deleteProduct_Success() {
        // Arrange
        when(productRepository.existsById(1)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1);

        // Act
        boolean result = productService.deleteProduct(1);

        // Assert
        assertTrue(result);
        verify(productRepository, times(1)).deleteById(1);
    }

    @Test
    void getAllProducts_Success() {
        // Arrange
        when(productRepository.findAll()).thenReturn(Arrays.asList(testProduct));

        // Act
        List<ProductResponse> results = productService.getAllProducts();

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(testProduct.getProductId(), results.get(0).getProductId());
    }

    @Test
    void getProductsByStore_Success() {
        // Arrange
        when(storeRepository.findById(1)).thenReturn(Optional.of(testStore));
        when(productRepository.findByStore(testStore)).thenReturn(Arrays.asList(testProduct));

        // Act
        List<ProductResponse> results = productService.getProductsByStore(1);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(testProduct.getProductId(), results.get(0).getProductId());
    }

    @Test
    void getProductsByCategory_Success() {
        // Arrange
        when(categoryRepository.findById(1)).thenReturn(Optional.of(testCategory));
        when(productRepository.findByCategory(testCategory)).thenReturn(Arrays.asList(testProduct));

        // Act
        List<ProductResponse> results = productService.getProductsByCategory(1);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(testProduct.getProductId(), results.get(0).getProductId());
    }
}
