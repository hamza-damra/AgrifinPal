package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Integer> {
    // الحصول على جميع التقييمات لمنتج معين
    List<Review> findByProduct_ProductId(Integer productId);

    // الحصول على جميع التقييمات لمستخدم معين
    List<Review> findByUser_UserId(Integer userId);
}
