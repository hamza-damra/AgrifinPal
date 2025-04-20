package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Integer> {
    // الحصول على جميع الطلبات لمستخدم معين
    List<Order> findByUser_UserId(Integer userId);
}
