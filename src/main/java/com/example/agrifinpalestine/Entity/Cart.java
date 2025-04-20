package com.example.agrifinpalestine.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "carts",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_user_active_cart", columnNames = {"user_id", "status"})
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cart_id")
    private Integer cartId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity = 0;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private CartStatus status = CartStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems = new ArrayList<>();

    /**
     * Mark the cart as completed
     */
    public void completeCart() {
        this.status = CartStatus.COMPLETED;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Reopen a completed cart
     */
    public void reopenCart() {
        this.status = CartStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Set the user for this cart and establish the bidirectional relationship
     * @param user the user to set
     */
    public void setUserWithBidirectional(User user) {
        // Remove old bidirectional reference
        if (this.user != null && this.user.getCart() == this) {
            this.user.setCart(null);
        }

        // Set new reference
        this.user = user;

        // Set bidirectional reference
        if (user != null && user.getCart() != this) {
            user.setCart(this);
        }
    }
}
