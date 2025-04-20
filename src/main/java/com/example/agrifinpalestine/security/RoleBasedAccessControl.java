package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.exception.auth.RoleRequiredException;
import com.example.agrifinpalestine.exception.auth.UnauthorizedAccessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;

/**
 * Utility class for role-based access control checks
 */
@Component
public class RoleBasedAccessControl {

    /**
     * Check if the current user has the specified role
     * @param role The role to check for
     * @return true if the user has the role, false otherwise
     */
    public static boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.stream()
                .anyMatch(authority -> authority.getAuthority().equals(role));
    }
    
    /**
     * Check if the current user has any of the specified roles
     * @param roles The roles to check for
     * @return true if the user has any of the roles, false otherwise
     */
    public static boolean hasAnyRole(String... roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (String role : roles) {
            if (authorities.stream().anyMatch(authority -> authority.getAuthority().equals(role))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Require that the current user has the specified role, throwing an exception if not
     * @param role The role to require
     * @throws RoleRequiredException if the user doesn't have the required role
     */
    public static void requireRole(String role) {
        if (!hasRole(role)) {
            throw new RoleRequiredException(role.replace("ROLE_", "").toLowerCase());
        }
    }
    
    /**
     * Require that the current user has any of the specified roles, throwing an exception if not
     * @param roles The roles to require
     * @throws RoleRequiredException if the user doesn't have any of the required roles
     */
    public static void requireAnyRole(String... roles) {
        if (!hasAnyRole(roles)) {
            String roleList = String.join(" or ", roles);
            throw new RoleRequiredException("One of the following roles is required: " + roleList, "");
        }
    }
    
    /**
     * Check if the current user is the owner of a resource or has admin role
     * @param resourceOwnerId The ID of the resource owner
     * @return true if the user is the owner or an admin, false otherwise
     */
    public static boolean isOwnerOrAdmin(Integer resourceOwnerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        
        // Check if user is admin
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        
        if (isAdmin) {
            return true;
        }
        
        // Check if user is the owner
        if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            return userDetails.getId().equals(resourceOwnerId);
        }
        
        return false;
    }
    
    /**
     * Require that the current user is the owner of a resource or has admin role
     * @param resourceOwnerId The ID of the resource owner
     * @param resourceType The type of resource (e.g., "review", "product")
     * @throws UnauthorizedAccessException if the user is not the owner or an admin
     */
    public static void requireOwnerOrAdmin(Integer resourceOwnerId, String resourceType) {
        if (!isOwnerOrAdmin(resourceOwnerId)) {
            throw new UnauthorizedAccessException("You don't have permission to access this " + resourceType);
        }
    }
}
