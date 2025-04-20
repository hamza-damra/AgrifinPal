package com.example.agrifinpalestine.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole name;
    
    public Role(ERole name) {
        this.name = name;
    }
    
    public enum ERole {
        ROLE_USER,    // Regular users (buyers/shippers)
        ROLE_SELLER,  // Sellers who can create stores and products
        ROLE_ADMIN    // Administrators with full access
    }
}
