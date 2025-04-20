package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.Role.ERole;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Manages role-related operations in the application
 */
@Component
public class RoleManager {
    private static final Logger logger = LoggerFactory.getLogger(RoleManager.class);

    private final RoleRepository roleRepository;

    @Autowired
    public RoleManager(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    /**
     * Get the default user role
     * @return The default USER role
     * @throws RuntimeException if the role is not found
     */
    public Role getDefaultUserRole() {
        return roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: User role not found"));
    }

    /**
     * Get the seller role
     * @return The SELLER role
     * @throws RuntimeException if the role is not found
     */
    public Role getSellerRole() {
        return roleRepository.findByName(ERole.ROLE_SELLER)
                .orElseThrow(() -> new RuntimeException("Error: Seller role not found"));
    }

    /**
     * Get the admin role
     * @return The ADMIN role
     * @throws RuntimeException if the role is not found
     */
    public Role getAdminRole() {
        return roleRepository.findByName(ERole.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("Error: Admin role not found"));
    }

    /**
     * Get a role by its name
     * @param roleName The name of the role (e.g., "admin", "seller", "user")
     * @return The corresponding Role object
     * @throws RuntimeException if the role is not found
     */
    public Role getRoleByName(String roleName) {
        switch (roleName.toLowerCase()) {
            case "admin":
                return getAdminRole();
            case "seller":
                return getSellerRole();
            case "user":
            default:
                return getDefaultUserRole();
        }
    }

    /**
     * Assign roles to a user based on role names
     * @param user The user to assign roles to
     * @param roleNames List of role names (e.g., "admin", "seller", "user")
     */
    public void assignRolesToUser(User user, List<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        
        if (roleNames != null && !roleNames.isEmpty()) {
            roleNames.forEach(roleName -> {
                roles.add(getRoleByName(roleName));
            });
        } else {
            // Default to USER role if none specified
            roles.add(getDefaultUserRole());
        }
        
        user.setRoles(roles);
    }

    /**
     * Check if the current authenticated user has a specific role
     * @param roleName The name of the role to check (without the "ROLE_" prefix)
     * @return true if the user has the role, false otherwise
     */
    public boolean currentUserHasRole(String roleName) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        return authorities.contains(new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase()));
    }

    /**
     * Check if the current authenticated user has any of the specified roles
     * @param roleNames The names of the roles to check (without the "ROLE_" prefix)
     * @return true if the user has any of the roles, false otherwise
     */
    public boolean currentUserHasAnyRole(String... roleNames) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (String roleName : roleNames) {
            if (authorities.contains(new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase()))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get the current authenticated user's roles as a list of role names
     * @return List of role names (e.g., "ROLE_USER", "ROLE_SELLER")
     */
    public List<String> getCurrentUserRoles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return List.of();
        }
        
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }

    /**
     * Convert a set of Role entities to a list of role names
     * @param roles Set of Role entities
     * @return List of role names (e.g., "ROLE_USER", "ROLE_SELLER")
     */
    public List<String> convertRolesToRoleNames(Set<Role> roles) {
        return roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
    }

    /**
     * Check if a user has a specific role
     * @param user The user to check
     * @param roleName The name of the role to check (without the "ROLE_" prefix)
     * @return true if the user has the role, false otherwise
     */
    public boolean userHasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null || user.getRoles().isEmpty()) {
            return false;
        }
        
        ERole targetRole = ERole.valueOf("ROLE_" + roleName.toUpperCase());
        return user.getRoles().stream()
                .anyMatch(role -> role.getName() == targetRole);
    }
}
