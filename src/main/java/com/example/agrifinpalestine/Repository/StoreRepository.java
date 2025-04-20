package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Integer> {
    // Find all stores by user ID
    List<Store> findAllByUser_UserId(Integer userId);

    // Find store by user
    Optional<Store> findByUser(User user);

    // Find store by user ID (returns a single store)
    Optional<Store> findByUser_UserId(Integer userId);

    // Find store by name
    Optional<Store> findByStoreName(String storeName);

    // Find stores by user region
    List<Store> findByUser_Region(String region);
}
