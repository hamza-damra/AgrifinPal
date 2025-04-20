package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    // البحث عن مستخدم باستخدام اسم المستخدم
    Optional<User> findByUsername(String username);

    // البحث عن مستخدم باستخدام البريد الإلكتروني
    Optional<User> findByEmail(String email);

    // Get distinct regions from users who have stores
    @Query("SELECT DISTINCT u.region FROM User u JOIN Store s ON u.userId = s.user.userId")
    List<String> findDistinctRegionsWithStores();

    // Get all distinct regions
    @Query("SELECT DISTINCT u.region FROM User u")
    List<String> findDistinctRegions();

    // Find users by role name
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") Role.ERole roleName);
}
