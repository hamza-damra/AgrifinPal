package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/seller")
@PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
public class SellerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getSellerDashboard() {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Get user from database
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get seller's store
        Optional<Store> storeOptional = storeRepository.findByUser(user);
        
        if (storeOptional.isPresent()) {
            Store store = storeOptional.get();
            // Return store information and other seller-specific data
            return ResponseEntity.ok(store);
        } else {
            return ResponseEntity.ok(new ApiResponse(false, "No store found for this seller"));
        }
    }

    @GetMapping("/sales")
    public ResponseEntity<?> getSalesData() {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Implementation for getting sales data
        // This would typically involve querying orders related to the seller's products
        
        return ResponseEntity.ok(new ApiResponse(true, "Sales data endpoint (to be implemented)"));
    }

    @GetMapping("/products")
    public ResponseEntity<?> getSellerProducts() {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        // Get user from database
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get seller's store
        Optional<Store> storeOptional = storeRepository.findByUser(user);
        
        if (storeOptional.isPresent()) {
            Store store = storeOptional.get();
            // Return products for this store
            // This would typically involve querying products related to the store
            return ResponseEntity.ok(new ApiResponse(true, "Products endpoint (to be implemented)"));
        } else {
            return ResponseEntity.ok(new ApiResponse(false, "No store found for this seller"));
        }
    }
}
