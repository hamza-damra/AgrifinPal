package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Integer> {

    /**
     * Find all carts by user ID and status
     * @param userId the user ID
     * @param status the cart status
     * @return a list of carts
     */
    List<Cart> findAllByUserUserIdAndStatus(Integer userId, CartStatus status);

    /**
     * Delete carts by user ID and status
     * @param userId the user ID
     * @param status the cart status
     */
    void deleteByUserUserIdAndStatus(Integer userId, CartStatus status);

    /**
     * Find the first cart by user ID and status, ordered by updated_at desc
     * @param userId the user ID
     * @param status the cart status
     * @return an optional containing the cart, or empty if none exists
     */
    Optional<Cart> findFirstByUserUserIdAndStatusOrderByUpdatedAtDesc(Integer userId, CartStatus status);

    /**
     * Find the active cart for a user
     * @param userId the user ID
     * @return an optional containing the active cart, or empty if none exists
     */
    default Optional<Cart> findActiveCartByUserId(Integer userId) {
        return findFirstByUserUserIdAndStatusOrderByUpdatedAtDesc(userId, CartStatus.ACTIVE);
    }

    /**
     * Find all active carts by user ID
     * @param userId the user ID
     * @return the list of active carts
     */
    default List<Cart> findAllActiveCartsByUserId(Integer userId) {
        return findAllByUserUserIdAndStatus(userId, CartStatus.ACTIVE);
    }

    /**
     * Update cart status to completed for all active carts of a user
     * @param userId the user ID
     * @return the number of carts updated
     */
    @Modifying
    @Transactional
    @Query("UPDATE Cart c SET c.status = 'COMPLETED', c.updatedAt = CURRENT_TIMESTAMP WHERE c.user.userId = :userId AND c.status = 'ACTIVE'")
    int updateCartStatusToCompletedByUserId(@Param("userId") Integer userId);

    /**
     * Check if a user has any active carts
     * @param userId the user ID
     * @return true if the user has active carts, false otherwise
     */
    @Query("SELECT COUNT(c) > 0 FROM Cart c WHERE c.user.userId = :userId AND c.status = 'ACTIVE'")
    boolean hasActiveCartsByUserId(@Param("userId") Integer userId);

    /**
     * Find all active cart IDs for a user
     * @param userId the user ID
     * @return a list of active cart IDs
     */
    @Query("SELECT c.cartId FROM Cart c WHERE c.user.userId = :userId AND c.status = 'ACTIVE'")
    List<Integer> findAllActiveCartIdsByUserId(@Param("userId") Integer userId);
}
