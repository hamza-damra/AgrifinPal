package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    // الحصول على صور المنتج حسب معرف المنتج
    List<ProductImage> findByProduct_ProductId(Integer productId);
}
