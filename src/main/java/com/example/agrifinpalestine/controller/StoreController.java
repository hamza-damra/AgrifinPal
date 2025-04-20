package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.StoreRequest;
import com.example.agrifinpalestine.dto.StoreResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Repository.StoreRepository;

@RestController
@RequestMapping("/api/stores")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StoreController {

    private final StoreService storeService;
    private final StoreRepository storeRepository;

    @Autowired
    public StoreController(StoreService storeService, StoreRepository storeRepository) {
        this.storeService = storeService;
        this.storeRepository = storeRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<StoreResponse> createStore(@RequestBody StoreRequest storeRequest) {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Set the user ID in the request if not already set
            if (storeRequest.getUserId() == null) {
                storeRequest.setUserId(userId);
            } else if (!storeRequest.getUserId().equals(userId)) {
                // For security, only allow creating stores for the authenticated user
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }

            StoreResponse createdStore = storeService.createStore(storeRequest);
            return new ResponseEntity<>(createdStore, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStoreById(@PathVariable Integer storeId) {
        try {
            StoreResponse store = storeService.getStoreById(storeId);
            return ResponseEntity.ok(store);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<StoreResponse> getStoreByUserId(@PathVariable Integer userId) {
        try {
            StoreResponse store = storeService.getStoreByUserId(userId);
            return ResponseEntity.ok(store);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{storeId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<StoreResponse> updateStore(
            @PathVariable Integer storeId,
            @RequestBody StoreRequest storeRequest) {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Get the store to check ownership
            StoreResponse existingStore = storeService.getStoreById(storeId);
            if (existingStore == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            // Verify that the user owns this store
            if (!existingStore.getUserId().equals(userId)) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN); // User doesn't own this store
            }

            // If userId is provided in the request, ensure it matches the authenticated user
            if (storeRequest.getUserId() != null && !storeRequest.getUserId().equals(userId)) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }

            // Set the userId to the authenticated user's ID
            storeRequest.setUserId(userId);

            StoreResponse updatedStore = storeService.updateStore(storeId, storeRequest);
            return ResponseEntity.ok(updatedStore);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{storeId}")
    @PreAuthorize("hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> deleteStore(@PathVariable Integer storeId) {
        Map<String, Boolean> response = new HashMap<>();
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Get the store to check ownership
            StoreResponse existingStore = storeService.getStoreById(storeId);
            if (existingStore == null) {
                response.put("deleted", false);
                return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
            }

            // Verify that the user owns this store
            if (!existingStore.getUserId().equals(userId)) {
                response.put("deleted", false);
                return new ResponseEntity<>(response, HttpStatus.FORBIDDEN); // User doesn't own this store
            }

            boolean deleted = storeService.deleteStore(storeId);
            response.put("deleted", deleted);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("deleted", false);
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getAllStores() {
        List<StoreResponse> stores = storeService.getAllStores();
        return ResponseEntity.ok(stores);
    }

    @GetMapping("/region/{region}")
    public ResponseEntity<List<StoreResponse>> getStoresByRegion(@PathVariable String region) {
        List<StoreResponse> stores = storeService.getStoresByRegion(region);
        return ResponseEntity.ok(stores);
    }

    /**
     * Check if the current authenticated user has a store
     * @return ResponseEntity with a map containing hasStore (boolean) and storeId (Integer, if exists)
     */
    @GetMapping("/check")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkUserHasStore() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Check if user has a store
            Optional<Store> storeOptional = storeRepository.findByUser_UserId(userId);

            if (storeOptional.isPresent()) {
                Store store = storeOptional.get();
                response.put("hasStore", true);
                response.put("storeId", store.getStoreId());
                response.put("storeName", store.getStoreName());
            } else {
                response.put("hasStore", false);
                response.put("storeId", null);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("hasStore", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
