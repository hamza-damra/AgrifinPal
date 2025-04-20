package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.exception.auth.SellerRoleRequiredException;
import com.example.agrifinpalestine.dto.StoreRequest;
import com.example.agrifinpalestine.dto.StoreResponse;
import com.example.agrifinpalestine.exception.auth.UserAlreadyExistsException;
import com.example.agrifinpalestine.exception.store.StoreDeletionException;
import com.example.agrifinpalestine.exception.store.StoreNotFoundException;
import com.example.agrifinpalestine.exception.store.StoreCreationException;
import com.example.agrifinpalestine.exception.store.StoreUpdateException;
import com.example.agrifinpalestine.exception.store.UserAlreadyHasStoreException;
import com.example.agrifinpalestine.service.StoreService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoreServiceImpl implements StoreService {

    private static final Logger logger = LoggerFactory.getLogger(StoreServiceImpl.class);

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @Autowired
    public StoreServiceImpl(StoreRepository storeRepository, UserRepository userRepository) {
        this.storeRepository = storeRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public StoreResponse createStore(StoreRequest storeRequest) {
        try {
            // Get user
            User user = userRepository.findById(storeRequest.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + storeRequest.getUserId()));

            // Check if user has SELLER role
            boolean hasSellerRole = user.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.ERole.ROLE_SELLER);

            if (!hasSellerRole) {
                throw new SellerRoleRequiredException("User must have the SELLER role to create a store");
            }

            // Check if user already has a store
            if (storeRepository.findByUser(user).isPresent()) {
                throw new UserAlreadyHasStoreException(storeRequest.getUserId());
            }

            // Create new store
            Store store = new Store();
            store.setUser(user);
            store.setStoreName(storeRequest.getName());
            store.setStoreDescription(storeRequest.getDescription());
            store.setStoreLogo(storeRequest.getLogo());
            store.setStoreBanner(storeRequest.getBanner());
            store.setLocation(storeRequest.getLocation());
            store.setContactInfo(storeRequest.getContactInfo());
            store.setCreatedAt(LocalDateTime.now());
            store.setUpdatedAt(LocalDateTime.now());

            // Save store to database
            Store savedStore = storeRepository.save(store);

            // Return response
            return mapToStoreResponse(savedStore);
        } catch (UserAlreadyHasStoreException | SellerRoleRequiredException e) {
            // Re-throw these exceptions as they are already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error creating store: {}", e.getMessage());
            throw new StoreCreationException("Failed to create store: " + e.getMessage(), e);
        }
    }

    @Override
    public StoreResponse getStoreById(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new StoreNotFoundException(storeId));

        return mapToStoreResponse(store);
    }

    @Override
    public StoreResponse getStoreByUserId(Integer userId) {
        Store store = storeRepository.findByUser_UserId(userId)
                .orElseThrow(() -> new StoreNotFoundException("Store not found for user with ID: " + userId));

        return mapToStoreResponse(store);
    }

    @Override
    @Transactional
    public StoreResponse updateStore(Integer storeId, StoreRequest storeRequest) {
        try {
            // Find existing store
            Store existingStore = storeRepository.findById(storeId)
                    .orElseThrow(() -> new StoreNotFoundException(storeId));

            // Update store fields if they are not null
            if (storeRequest.getName() != null) {
                existingStore.setStoreName(storeRequest.getName());
            }

            if (storeRequest.getDescription() != null) {
                existingStore.setStoreDescription(storeRequest.getDescription());
            }

            if (storeRequest.getLogo() != null) {
                existingStore.setStoreLogo(storeRequest.getLogo());
            }

            if (storeRequest.getBanner() != null) {
                existingStore.setStoreBanner(storeRequest.getBanner());
            }

            if (storeRequest.getLocation() != null) {
                existingStore.setLocation(storeRequest.getLocation());
            }

            if (storeRequest.getContactInfo() != null) {
                existingStore.setContactInfo(storeRequest.getContactInfo());
            }

            // Update the updatedAt timestamp
            existingStore.setUpdatedAt(LocalDateTime.now());

            // Save updated store
            Store updatedStore = storeRepository.save(existingStore);

            // Return response
            return mapToStoreResponse(updatedStore);
        } catch (StoreNotFoundException e) {
            // Re-throw this exception as it's already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error updating store: {}", e.getMessage());
            throw new StoreUpdateException(String.valueOf(storeId), e);
        }
    }

    @Override
    @Transactional
    public boolean deleteStore(Integer storeId) {
        try {
            if (!storeRepository.existsById(storeId)) {
                throw new StoreNotFoundException(storeId);
            }
            storeRepository.deleteById(storeId);
            return true;
        } catch (StoreNotFoundException e) {
            // Re-throw this exception as it's already handled
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting store: {}", e.getMessage());
            throw new StoreDeletionException(String.valueOf(storeId), e);
        }
    }

    @Override
    public List<StoreResponse> getAllStores() {
        List<Store> stores = storeRepository.findAll();
        return stores.stream()
                .map(this::mapToStoreResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StoreResponse> getStoresByRegion(String region) {
        List<Store> stores = storeRepository.findByUser_Region(region);
        return stores.stream()
                .map(this::mapToStoreResponse)
                .collect(Collectors.toList());
    }

    // Helper method to map Store entity to StoreResponse DTO
    private StoreResponse mapToStoreResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getStoreId())
                .userId(store.getUser().getUserId())
                .name(store.getStoreName())
                .description(store.getStoreDescription())
                .logo(store.getStoreLogo())
                .banner(store.getStoreBanner())
                .location(store.getLocation())
                .contactInfo(store.getContactInfo())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
