package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {

    /**
     * Find all items in a given cart
     * @param cartId the cart ID
     * @return a list of cart items
     */
    List<CartItem> findAllByCartCartId(Integer cartId);

    /**
     * Find all items in a given cart (simplified method name)
     * @param cartId the cart ID
     * @return a list of cart items
     */
    List<CartItem> findByCartCartId(Integer cartId);

    /**
     * Find a specific line by cart + product
     * @param cartId the cart ID
     * @param productId the product ID
     * @return an optional containing the cart item, or empty if none exists
     */
    Optional<CartItem> findByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    /**
     * Find a specific line by cart + product (simplified method name)
     * @param cartId the cart ID
     * @param productId the product ID
     * @return an optional containing the cart item, or empty if none exists
     */
    Optional<CartItem> findByCart_CartIdAndProduct_ProductId(Integer cartId, Integer productId);

    /**
     * Delete all lines belonging to a cart
     * @param cartId the cart ID
     */
    void deleteAllByCartCartId(Integer cartId);

    /**
     * Delete all cart items by cart ID using JPQL
     * This is a more direct approach that can be used if the standard method fails
     * @param cartId the cart ID
     * @return the number of items deleted
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem ci WHERE ci.cart.cartId = :cartId")
    int deleteCartItemsByCartId(@Param("cartId") Integer cartId);

    /**
     * Delete all cart items for a user's active carts
     * @param userId the user ID
     * @return the number of items deleted
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.cart.status = 'ACTIVE'")
    int deleteAllCartItemsByUserId(@Param("userId") Integer userId);

    /**
     * Find all cart items for a user's active carts
     * @param userId the user ID
     * @return the list of cart items
     */
    @Query("SELECT ci FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.cart.status = 'ACTIVE'")
    List<CartItem> findAllByUserIdAndCartStatusActive(@Param("userId") Integer userId);

    /**
     * Count all cart items for a user's active carts
     * @param userId the user ID
     * @return the count of cart items
     */
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cart.user.userId = :userId AND ci.cart.status = 'ACTIVE'")
    long countByUserIdAndCartStatusActive(@Param("userId") Integer userId);

    /**
     * Existence check
     * @param cartId the cart ID
     * @param productId the product ID
     * @return true if the cart item exists, false otherwise
     */
    boolean existsByCartCartIdAndProductProductId(Integer cartId, Integer productId);

    /**
     * Existence check (simplified method name)
     * @param cartId the cart ID
     * @param productId the product ID
     * @return true if the cart item exists, false otherwise
     */
    boolean existsByCart_CartIdAndProduct_ProductId(Integer cartId, Integer productId);

    // if you ever need to fetch by user, go through cart → user:
    List<CartItem> findByCart_User_UserId(Integer userId);

    /**
     * Delete all cart items for a user after successful payment using native SQL
     * This is a more direct approach that should work even if JPA methods fail
     *
     * @param userId the user ID
     * @return the number of rows affected
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM cart_items WHERE cart_id IN (SELECT cart_id FROM carts WHERE user_id = :userId AND status = 'ACTIVE')", nativeQuery = true)
    int deleteAllCartItemsByUserIdNative(@Param("userId") Integer userId);
}
