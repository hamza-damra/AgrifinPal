package com.example.agrifinpalestine.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "username", unique = true, nullable = false)
    private String username;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone")
    private String phone;

    @Column(name = "region", nullable = false)
    private String region;

    @Column(name = "agriculture_type", nullable = false)
    private String agricultureType;

    @Column(name = "profile_image")
    private String profileImage;

    @Column(name = "bio")
    private String bio;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "is_active")
    private Boolean isActive;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Cart cart;

    /**
     * Check if the user has a specific role
     * @param roleName the role name to check
     * @return true if the user has the role, false otherwise
     */
    public boolean hasRole(String roleName) {
        return roles.stream().anyMatch(role -> role.getName().name().equals(roleName));
    }

    /**
     * Check if the user is a buyer
     * @return true if the user has the ROLE_USER role, false otherwise
     */
    public boolean isBuyer() {
        return hasRole("ROLE_USER");
    }

    /**
     * Check if the user is active
     * @return true if the user status is ACTIVE, false otherwise
     */
    public boolean isActive() {
        // For backward compatibility, check both status and isActive fields
        if (status != null) {
            return status == UserStatus.ACTIVE;
        }
        return isActive != null ? isActive : false;
    }

    /**
     * Set the cart for this user and establish the bidirectional relationship
     * @param cart the cart to set
     */
    public void setCartWithBidirectional(Cart cart) {
        // Remove old bidirectional reference
        if (this.cart != null) {
            this.cart.setUser(null);
        }

        // Set new reference
        this.cart = cart;

        // Set bidirectional reference
        if (cart != null) {
            cart.setUser(this);
        }
    }

    /**
     * Check if the user is suspended
     * @return true if the user status is SUSPENDED, false otherwise
     */
    public boolean isSuspended() {
        return status == UserStatus.SUSPENDED;
    }

    /**
     * Check if the user is banned
     * @return true if the user status is BANNED, false otherwise
     */
    public boolean isBanned() {
        return status == UserStatus.BANNED;
    }

    /**
     * Check if the user is pending
     * @return true if the user status is PENDING, false otherwise
     */
    public boolean isPending() {
        return status == UserStatus.PENDING;
    }

    /**
     * Set the user status and update the isActive field for backward compatibility
     * @param status the new status
     */
    public void setStatus(UserStatus status) {
        this.status = status;
        // Update isActive field for backward compatibility
        this.isActive = (status == UserStatus.ACTIVE);
    }
}