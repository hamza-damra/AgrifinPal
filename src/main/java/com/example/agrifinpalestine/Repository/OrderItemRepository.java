package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    // الحصول على جميع عناصر الطلب حسب معرف الطلب
    List<OrderItem> findByOrder_OrderId(Integer orderId);
}
