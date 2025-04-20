package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {

    Logger logger = LoggerFactory.getLogger(UserRepository.class);

    // Find by username
    Optional<User> findByUsername(String username);

    // Safer version of find by email to avoid duplicate results due to roles
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.email = :email")
    List<User> findByEmailList(@Param("email") String email);

    // Find by email returning at most one result
    default Optional<User> findDistinctByEmail(String email) {
        List<User> users = findByEmailList(email);
        if (users.isEmpty()) {
            return Optional.empty();
        } else if (users.size() > 1) {
            // Log a warning and return the first user
            logger.warn("Multiple users found with email: {}. Returning the first one.", email);
            return Optional.of(users.get(0));
        } else {
            return Optional.of(users.get(0));
        }
    }

    // Remove the redundant findByEmail method
    // Optional<User> findByEmail(String email);

    // Optional safe version of findByUsername (also avoids duplicate results)
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<User> findDistinctByUsername(@Param("username") String username);

    // Get distinct regions from users who have stores
    @Query("SELECT DISTINCT u.region FROM User u JOIN Store s ON u.userId = s.user.userId")
    List<String> findDistinctRegionsWithStores();

    // Get all distinct regions
    @Query("SELECT DISTINCT u.region FROM User u")
    List<String> findDistinctRegions();

    // Find users by role name
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") Role.ERole roleName);
}
