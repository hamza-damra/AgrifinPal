package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.dto.StoreRequest;
import com.example.agrifinpalestine.dto.StoreResponse;

import java.util.List;

public interface StoreService {

    /**
     * Create a new store
     * @param storeRequest containing store details
     * @return StoreResponse with created store details
     */
    StoreResponse createStore(StoreRequest storeRequest);

    /**
     * Get a store by ID
     * @param storeId the ID of the store to retrieve
     * @return StoreResponse with store details
     */
    StoreResponse getStoreById(Integer storeId);

    /**
     * Get a store by user ID
     * @param userId the ID of the user who owns the store
     * @return StoreResponse with store details
     */
    StoreResponse getStoreByUserId(Integer userId);

    /**
     * Update an existing store
     * @param storeId the ID of the store to update
     * @param storeRequest containing updated store details
     * @return StoreResponse with updated store details
     */
    StoreResponse updateStore(Integer storeId, StoreRequest storeRequest);

    /**
     * Delete a store by ID
     * @param storeId the ID of the store to delete
     * @return true if deletion was successful, false otherwise
     */
    boolean deleteStore(Integer storeId);

    /**
     * Get all stores
     * @return List of StoreResponse objects
     */
    List<StoreResponse> getAllStores();

    /**
     * Get stores by region
     * @param region The region to filter by
     * @return List of StoreResponse objects
     */
    List<StoreResponse> getStoresByRegion(String region);
}
