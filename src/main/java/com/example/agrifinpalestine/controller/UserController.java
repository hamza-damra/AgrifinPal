package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.UserUpdateRequest;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Update the authenticated user's profile
     * 
     * @param userUpdateRequest The updated user data
     * @return The updated user data
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UserUpdateRequest userUpdateRequest) {
        try {
            // Get the authenticated user's ID from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Find the user in the database
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update user fields if provided
            if (userUpdateRequest.getFullName() != null) {
                user.setFullName(userUpdateRequest.getFullName());
            }
            
            if (userUpdateRequest.getEmail() != null) {
                // Check if email is already taken by another user
                userRepository.findByEmail(userUpdateRequest.getEmail())
                        .ifPresent(existingUser -> {
                            if (!existingUser.getUserId().equals(userId)) {
                                throw new RuntimeException("Email is already in use");
                            }
                        });
                user.setEmail(userUpdateRequest.getEmail());
            }
            
            if (userUpdateRequest.getPhone() != null) {
                user.setPhone(userUpdateRequest.getPhone());
            }
            
            if (userUpdateRequest.getRegion() != null) {
                user.setRegion(userUpdateRequest.getRegion());
            }
            
            if (userUpdateRequest.getAgricultureType() != null) {
                user.setAgricultureType(userUpdateRequest.getAgricultureType());
            }
            
            if (userUpdateRequest.getBio() != null) {
                user.setBio(userUpdateRequest.getBio());
            }
            
            if (userUpdateRequest.getProfileImage() != null) {
                user.setProfileImage(userUpdateRequest.getProfileImage());
            }
            
            // Update the updatedAt timestamp
            user.setUpdatedAt(LocalDateTime.now());
            
            // Save the updated user
            User updatedUser = userRepository.save(user);
            
            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("userId", updatedUser.getUserId());
            response.put("username", updatedUser.getUsername());
            response.put("email", updatedUser.getEmail());
            response.put("fullName", updatedUser.getFullName());
            response.put("phone", updatedUser.getPhone());
            response.put("region", updatedUser.getRegion());
            response.put("agricultureType", updatedUser.getAgricultureType());
            response.put("bio", updatedUser.getBio());
            response.put("profileImage", updatedUser.getProfileImage());
            response.put("updatedAt", updatedUser.getUpdatedAt());
            response.put("message", "Profile updated successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "Error updating profile: " + e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
    }
}
