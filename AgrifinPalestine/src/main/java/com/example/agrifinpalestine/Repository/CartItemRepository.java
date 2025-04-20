package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    // Legacy methods for backward compatibility - using cart.user instead of direct user reference
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.product.productId = :productId")
    Optional<CartItem> findByUser_UserIdAndProduct_ProductId(@Param("userId") Integer userId, @Param("productId") Integer productId);

    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.user.userId = :userId")
    List<CartItem> findByUser_UserId(@Param("userId") Integer userId);

    // Methods to find cart items by user ID (through cart)
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.user.userId = :userId")
    List<CartItem> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.product.productId = :productId")
    Optional<CartItem> findByUserIdAndProductId(@Param("userId") Integer userId, @Param("productId") Integer productId);

    // New methods for cart-based operations
    List<CartItem> findAllByCartCartId(Integer cartId);
    Optional<CartItem> findByCartCartIdAndProductProductId(Integer cartId, Integer productId);
    boolean existsByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    // Method to check if a product exists in a user's cart
    @Query("SELECT COUNT(ci) > 0 FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.product.productId = :productId")
    boolean existsByUserIdAndProductId(@Param("userId") Integer userId, @Param("productId") Integer productId);

    // Use a custom query to delete cart items by cart ID
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.cart.cartId = :cartId")
    void deleteAllByCartId(@Param("cartId") Integer cartId);

    // Method to delete all cart items for a user
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.cart.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Integer userId);

    // Method to delete all cart items for a user (legacy method name)
    @Modifying
    @Query("DELETE FROM CartItem c WHERE c.cart.user.userId = :userId")
    void deleteByUser_UserId(@Param("userId") Integer userId);
}
