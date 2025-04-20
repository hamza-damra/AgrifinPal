package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, Integer> {
    Optional<ProductCategory> findByCategoryNameEn(String nameEn);
    Optional<ProductCategory> findByCategoryNameAr(String nameAr);
}
