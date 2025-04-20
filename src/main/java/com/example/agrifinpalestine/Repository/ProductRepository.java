package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Product;
import com.example.agrifinpalestine.Entity.ProductCategory;
import com.example.agrifinpalestine.Entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    // Find products by store
    List<Product> findByStore(Store store);
    Page<Product> findByStore(Store store, Pageable pageable);

    // Find products by category
    List<Product> findByCategory(ProductCategory category);
    Page<Product> findByCategory(ProductCategory category, Pageable pageable);

    // Find products by name containing a keyword
    List<Product> findByProductNameContainingIgnoreCase(String keyword);
    Page<Product> findByProductNameContainingIgnoreCase(String keyword, Pageable pageable);

    // Find products by price range
    List<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice);
    Page<Product> findByPriceBetween(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable);

    // Find available products
    List<Product> findByIsAvailableTrue();
    Page<Product> findByIsAvailableTrue(Pageable pageable);

    // Find organic products
    List<Product> findByIsOrganicTrue();
    Page<Product> findByIsOrganicTrue(Pageable pageable);

    // Find products by store and category
    List<Product> findByStoreAndCategory(Store store, ProductCategory category);
    Page<Product> findByStoreAndCategory(Store store, ProductCategory category, Pageable pageable);

    // Find available products by store
    List<Product> findByStoreAndIsAvailableTrue(Store store);
    Page<Product> findByStoreAndIsAvailableTrue(Store store, Pageable pageable);

    // Count products by store
    long countByStore(Store store);

    /**
     * Find a product by ID with a pessimistic lock to prevent concurrent modifications
     * This is used for inventory management to ensure consistency
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.productId = :id")
    Optional<Product> findByIdWithPessimisticLock(@Param("id") Integer id);

    // Advanced search with multiple criteria
    @Query("SELECT p FROM Product p WHERE " +
           "(:storeId IS NULL OR p.store.storeId = :storeId) AND " +
           "(:categoryId IS NULL OR p.category.categoryId = :categoryId) AND " +
           "(:keyword IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:isOrganic IS NULL OR p.isOrganic = :isOrganic) AND " +
           "(:isAvailable IS NULL OR p.isAvailable = :isAvailable)")
    Page<Product> searchProducts(
            @Param("storeId") Integer storeId,
            @Param("categoryId") Integer categoryId,
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("isOrganic") Boolean isOrganic,
            @Param("isAvailable") Boolean isAvailable,
            Pageable pageable);
}
