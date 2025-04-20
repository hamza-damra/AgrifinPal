package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for user role-related endpoints
 */
@RestController
@RequestMapping("/api/user-role")
public class UserRoleController {

    /**
     * Check if the current user has the buyer role
     * @return ResponseEntity with a boolean indicating if the user is a buyer
     */
    @GetMapping("/is-buyer")
    public ResponseEntity<?> isBuyer() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            // Check if user is authenticated
            if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.ok(Map.of(
                    "isBuyer", false,
                    "message", "User not authenticated"
                ));
            }
            
            // Check if user has ROLE_USER (buyer) role
            boolean isBuyer = authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_USER"));
            
            // Check if user has ROLE_SELLER role
            boolean isSeller = authentication.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_SELLER"));
            
            Map<String, Object> response = new HashMap<>();
            response.put("isBuyer", isBuyer);
            response.put("isSeller", isSeller);
            
            // Add roles list for debugging
            response.put("roles", authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()));
            
            if (isBuyer) {
                response.put("message", "User has buyer role");
            } else if (isSeller) {
                response.put("message", "User has seller role but not buyer role");
            } else {
                response.put("message", "User does not have buyer role");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, "Error checking user role: " + e.getMessage()));
        }
    }
}
