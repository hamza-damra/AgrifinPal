package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.exception.user.UnauthorizedAccessException;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility class for cart security operations
 */
@Component
public class CartSecurityUtils {

    private static final Logger logger = LoggerFactory.getLogger(CartSecurityUtils.class);

    private final TokenManager tokenManager;

    @Autowired
    public CartSecurityUtils(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     * Validate the token in the request
     * @param request the HTTP request
     * @return true if the token is valid, false otherwise
     */
    public boolean validateToken(HttpServletRequest request) {
        try {
            String token = tokenManager.parseTokenFromRequest(request);
            if (token == null) {
                logger.warn("No token found in request");
                return false;
            }

            boolean isValid = tokenManager.validateToken(token);
            if (isValid) {
                String username = tokenManager.getUsernameFromToken(token);
                logger.info("Token validated for user: {}", username);
            }
            return isValid;
        } catch (Exception e) {
            logger.error("Error validating token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get the current authenticated user's ID
     * @return the user ID
     */
    public Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
            !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            logger.error("User not authenticated or invalid authentication");
            throw new UnauthorizedAccessException("User not authenticated");
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    /**
     * Verify that the user can only access their own cart
     * @param requestUserId the user ID from the request
     * @return true if the user can access the cart, false otherwise
     */
    public boolean verifyCartAccess(Integer requestUserId) {
        Integer currentUserId = getCurrentUserId();
        boolean hasAccess = currentUserId.equals(requestUserId);

        if (!hasAccess) {
            logger.warn("Unauthorized access attempt: User {} tried to access cart of user {}",
                    currentUserId, requestUserId);
        }

        return hasAccess;
    }

    /**
     * Create an unauthorized response
     * @param message the error message
     * @return the response entity
     */
    public ResponseEntity<?> createUnauthorizedResponse(String message) {
        // Create error response data
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("errorType", "UnauthorizedAccess");
        errorData.put("timestamp", LocalDateTime.now());

        // Try to get current user ID if available
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
                errorData.put("userId", userDetails.getId());
            }
        } catch (Exception e) {
            logger.debug("Could not get user ID for unauthorized response: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, message, errorData));
    }
}
