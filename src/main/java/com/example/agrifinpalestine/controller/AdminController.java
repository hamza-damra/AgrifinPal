package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Entity.UserStatus;
import com.example.agrifinpalestine.Repository.ProductRepository;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.ApiResponse;
import com.example.agrifinpalestine.dto.CategoryResponse;
import com.example.agrifinpalestine.dto.ProductResponse;
import com.example.agrifinpalestine.dto.RegistrationRequest;
import com.example.agrifinpalestine.dto.RegistrationResponse;
import com.example.agrifinpalestine.security.RoleManager;
import com.example.agrifinpalestine.service.CategoryService;
import com.example.agrifinpalestine.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleManager roleManager;

    @Autowired
    private ProductService productService;

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Integer id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Create a response map with user details
            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getUserId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("phone", user.getPhone());
            response.put("region", user.getRegion());
            response.put("agricultureType", user.getAgricultureType());
            response.put("profileImage", user.getProfileImage());
            response.put("bio", user.getBio());
            response.put("createdAt", user.getCreatedAt());
            response.put("updatedAt", user.getUpdatedAt());
            response.put("isActive", user.getIsActive());
            response.put("status", user.getStatus() != null ? user.getStatus().name() : "ACTIVE");

            // Convert roles to strings
            Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());
            response.put("roles", roleNames);

            // Check if user has a store and include store information
            Optional<Store> storeOpt = storeRepository.findByUser(user);
            if (storeOpt.isPresent()) {
                Store store = storeOpt.get();
                response.put("hasStore", true);
                response.put("storeId", store.getStoreId());
                response.put("storeName", store.getStoreName());
            } else {
                response.put("hasStore", false);
            }

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/activate")
    public ResponseEntity<?> activateUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.ACTIVE);
            user.setIsActive(true); // For backward compatibility
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(true, "User activated successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<?> deactivateUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.INACTIVE);
            user.setIsActive(false); // For backward compatibility
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(true, "User deactivated successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/suspend")
    public ResponseEntity<?> suspendUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.SUSPENDED);
            user.setIsActive(false); // For backward compatibility
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(true, "User suspended successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.BANNED);
            user.setIsActive(false); // For backward compatibility
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(true, "User banned successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/set-pending")
    public ResponseEntity<?> setPendingUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setStatus(UserStatus.PENDING);
            user.setIsActive(false); // For backward compatibility
            userRepository.save(user);
            return ResponseEntity.ok(new ApiResponse(true, "User set to pending status successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/users/{id}/update-status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Integer id, @RequestParam("status") String statusName) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            try {
                UserStatus status = UserStatus.valueOf(statusName.toUpperCase());
                user.setStatus(status);
                // Update isActive field for backward compatibility
                user.setIsActive(status == UserStatus.ACTIVE);
                userRepository.save(user);
                return ResponseEntity.ok(new ApiResponse(true, "User status updated to " + status + " successfully"));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid status: " + statusName));
            }
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            userRepository.deleteById(id);
            return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @Autowired
    private StoreRepository storeRepository;

    /**
     * Get all sellers
     * @return List of sellers
     */
    @GetMapping("/sellers")
    public ResponseEntity<List<Map<String, Object>>> getAllSellers() {
        try {
            // Get all users with ROLE_SELLER role
            List<User> sellers = userRepository.findByRoleName(Role.ERole.ROLE_SELLER);

            // Convert to Maps
            List<Map<String, Object>> sellerMaps = sellers.stream().map(seller -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", seller.getUserId());
                map.put("username", seller.getUsername());
                map.put("email", seller.getEmail());
                map.put("fullName", seller.getFullName());
                map.put("phone", seller.getPhone());
                map.put("region", seller.getRegion());
                map.put("agricultureType", seller.getAgricultureType());
                map.put("profileImage", seller.getProfileImage());
                map.put("bio", seller.getBio());
                map.put("createdAt", seller.getCreatedAt());
                map.put("updatedAt", seller.getUpdatedAt());
                map.put("isActive", seller.getIsActive());
                map.put("status", seller.getStatus() != null ? seller.getStatus().name() : "ACTIVE");

                // Convert roles to strings
                Set<String> roleNames = seller.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());
                map.put("roles", roleNames);

                // Get store information for this seller
                Optional<Store> storeOpt = storeRepository.findByUser(seller);
                if (storeOpt.isPresent()) {
                    Store store = storeOpt.get();
                    map.put("storeId", store.getStoreId());
                    map.put("storeName", store.getStoreName());
                    map.put("storeDescription", store.getStoreDescription());
                    map.put("storeLogoUrl", store.getStoreLogo());
                    map.put("storeBannerUrl", store.getStoreBanner());
                    map.put("location", store.getLocation());
                    map.put("contactInfo", store.getContactInfo());

                    // Get product count for this store
                    long productCount = productRepository.countByStore(store);
                    map.put("productCount", productCount);
                }

                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(sellerMaps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all buyers
     * @return List of buyers
     */
    @GetMapping("/buyers")
    public ResponseEntity<List<Map<String, Object>>> getAllBuyers() {
        try {
            // Get all users with ROLE_USER role
            List<User> buyers = userRepository.findByRoleName(Role.ERole.ROLE_USER);

            // Convert to Maps
            List<Map<String, Object>> buyerMaps = buyers.stream().map(buyer -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", buyer.getUserId());
                map.put("username", buyer.getUsername());
                map.put("email", buyer.getEmail());
                map.put("fullName", buyer.getFullName());
                map.put("phone", buyer.getPhone());
                map.put("region", buyer.getRegion());
                map.put("agricultureType", buyer.getAgricultureType());
                map.put("profileImage", buyer.getProfileImage());
                map.put("bio", buyer.getBio());
                map.put("createdAt", buyer.getCreatedAt());
                map.put("updatedAt", buyer.getUpdatedAt());
                map.put("isActive", buyer.getIsActive());
                map.put("status", buyer.getStatus() != null ? buyer.getStatus().name() : "ACTIVE");

                // Convert roles to strings
                Set<String> roleNames = buyer.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());
                map.put("roles", roleNames);

                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(buyerMaps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all administrators
     * @return List of administrators
     */
    @GetMapping("/admins")
    public ResponseEntity<List<Map<String, Object>>> getAllAdmins() {
        try {
            // Get all users with ROLE_ADMIN role
            List<User> admins = userRepository.findByRoleName(Role.ERole.ROLE_ADMIN);

            // Convert to Maps
            List<Map<String, Object>> adminMaps = admins.stream().map(admin -> {
                Map<String, Object> map = new HashMap<>();
                map.put("userId", admin.getUserId());
                map.put("username", admin.getUsername());
                map.put("email", admin.getEmail());
                map.put("fullName", admin.getFullName());
                map.put("phone", admin.getPhone());
                map.put("region", admin.getRegion());
                map.put("profileImage", admin.getProfileImage());
                map.put("createdAt", admin.getCreatedAt());
                map.put("updatedAt", admin.getUpdatedAt());
                map.put("isActive", admin.getIsActive());
                map.put("status", admin.getStatus() != null ? admin.getStatus().name() : "ACTIVE");
                map.put("lastLogin", LocalDateTime.now().minusDays((long) (Math.random() * 30))); // Placeholder for last login

                // Convert roles to strings
                Set<String> roleNames = admin.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());
                map.put("roles", roleNames);

                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(adminMaps);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get dashboard statistics
     * @return Dashboard statistics
     */
    @GetMapping("/dashboard-stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            // Get total users count
            long totalUsers = userRepository.count();
            stats.put("totalUsers", totalUsers);

            // Get active sellers count
            List<User> sellers = userRepository.findByRoleName(Role.ERole.ROLE_SELLER);
            long activeSellers = sellers.stream()
                .filter(User::getIsActive)
                .count();
            stats.put("activeSellers", activeSellers);

            // Get total products count from ProductRepository
            long totalProducts = productRepository.count();
            // Log the product count for debugging
            System.out.println("Total products in database: " + totalProducts);
            stats.put("totalProducts", totalProducts);

            // Get monthly orders count (if OrderRepository is available)
            // For now, we'll use a placeholder
            long monthlyOrders = 0;
            stats.put("monthlyOrders", monthlyOrders);

            // Add growth percentages (these would be calculated in a real application)
            stats.put("userGrowth", 12); // 12%
            stats.put("sellerGrowth", 5); // 5%
            stats.put("productGrowth", 8); // 8%
            stats.put("orderGrowth", 15); // 15%

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete an administrator
     * @param id The user ID of the administrator to delete
     * @return Response with success or error message
     */
    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Integer id) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            if (userOptional.isPresent()) {
                User admin = userOptional.get();

                // Check if user has ADMIN role
                boolean isAdmin = admin.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.ERole.ROLE_ADMIN);

                if (!isAdmin) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "User is not an administrator"));
                }

                // Delete the administrator
                userRepository.delete(admin);

                return ResponseEntity.ok(new ApiResponse(true, "Administrator deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error deleting administrator: " + e.getMessage()));
        }
    }

    /**
     * Toggle administrator active status
     * @param id The user ID of the administrator
     * @return Response with success or error message
     */
    @PutMapping("/admins/{id}/toggle-status")
    public ResponseEntity<?> toggleAdminStatus(@PathVariable Integer id) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            if (userOptional.isPresent()) {
                User admin = userOptional.get();

                // Check if user has ADMIN role
                boolean isAdmin = admin.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.ERole.ROLE_ADMIN);

                if (!isAdmin) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "User is not an administrator"));
                }

                // Toggle active status
                boolean isCurrentlyActive = admin.isActive();
                if (isCurrentlyActive) {
                    admin.setStatus(UserStatus.INACTIVE);
                } else {
                    admin.setStatus(UserStatus.ACTIVE);
                }
                // Update isActive field for backward compatibility
                admin.setIsActive(!isCurrentlyActive);
                userRepository.save(admin);

                String statusMessage = !isCurrentlyActive ? "activated" : "deactivated";
                return ResponseEntity.ok(new ApiResponse(true, "Administrator " + statusMessage + " successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error toggling administrator status: " + e.getMessage()));
        }
    }

    /**
     * Update administrator status
     * @param id The user ID of the administrator
     * @param statusName The new status
     * @return Response with success or error message
     */
    @PutMapping("/admins/{id}/status")
    public ResponseEntity<?> updateAdminStatus(@PathVariable Integer id, @RequestParam("status") String statusName) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            if (userOptional.isPresent()) {
                User admin = userOptional.get();

                // Check if user has ADMIN role
                boolean isAdmin = admin.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.ERole.ROLE_ADMIN);

                if (!isAdmin) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "User is not an administrator"));
                }

                try {
                    UserStatus status = UserStatus.valueOf(statusName.toUpperCase());
                    admin.setStatus(status);
                    // Update isActive field for backward compatibility
                    admin.setIsActive(status == UserStatus.ACTIVE);
                    userRepository.save(admin);
                    return ResponseEntity.ok(new ApiResponse(true, "Administrator status updated to " + status + " successfully"));
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(new ApiResponse(false, "Invalid status: " + statusName));
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error updating administrator status: " + e.getMessage()));
        }
    }

    /**
     * Get all products for admin dashboard
     * @return List of all products
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        try {
            List<ProductResponse> products = productService.getAllProducts();
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all categories for admin dashboard
     * @return List of all categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        try {
            List<CategoryResponse> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Create a new admin user
     * This endpoint is accessible without authentication to allow initial admin setup
     * In a production environment, this should be secured or disabled after initial setup
     */
    @PostMapping("/create-admin")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> createAdminUser(@RequestBody RegistrationRequest request) {
        try {
            // Check if username already exists
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Username already exists"));
            }

            // Check if email already exists
            if (userRepository.findDistinctByEmail(request.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Email already exists"));
            }

            // Create new user
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setFullName(request.getFullName());
            user.setPhone(request.getPhone());
            user.setRegion(request.getRegion() != null ? request.getRegion() : "Admin Region");
            user.setAgricultureType(request.getAgricultureType() != null ? request.getAgricultureType() : "Administration");
            user.setBio(request.getBio());
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setIsActive(true);
            user.setStatus(UserStatus.ACTIVE);

            // Set ADMIN role
            Set<String> roleSet = new HashSet<>();
            roleSet.add("ADMIN");
            // Convert Set to List for the roleManager
            List<String> roleList = new ArrayList<>(roleSet);
            roleManager.assignRolesToUser(user, roleList);

            // Save user to database
            User savedUser = userRepository.save(user);

            // Create response
            RegistrationResponse response = RegistrationResponse.builder()
                    .userId(savedUser.getUserId())
                    .username(savedUser.getUsername())
                    .email(savedUser.getEmail())
                    .roles(Collections.singleton("ROLE_ADMIN"))
                    .message("Admin user created successfully")
                    .success(true)
                    .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, "Error creating admin user: " + e.getMessage()));
        }
    }

    /**
     * Get store by user ID
     * @param userId The user ID to find the store for
     * @return The store associated with the user
     */
    @GetMapping("/stores/user/{userId}")
    public ResponseEntity<?> getStoreByUserId(@PathVariable Integer userId) {
        try {
            // Get user from database
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            // Get store for this user
            Optional<Store> storeOpt = storeRepository.findByUser(user);

            if (storeOpt.isPresent()) {
                Store store = storeOpt.get();

                // Create response map
                Map<String, Object> response = new HashMap<>();
                response.put("storeId", store.getStoreId());
                response.put("userId", store.getUser().getUserId());
                response.put("storeName", store.getStoreName());
                response.put("storeDescription", store.getStoreDescription());
                response.put("storeLogo", store.getStoreLogo());
                response.put("storeBanner", store.getStoreBanner());
                response.put("location", store.getLocation());
                response.put("contactInfo", store.getContactInfo());
                response.put("createdAt", store.getCreatedAt());
                response.put("updatedAt", store.getUpdatedAt());

                // Get product count for this store
                long productCount = productRepository.countByStore(store);
                response.put("productCount", productCount);

                // Add placeholder values for statistics that might be needed by the frontend
                response.put("orderCount", 0);
                response.put("totalRevenue", 0);
                response.put("averageRating", 0);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "No store found for user with ID: " + userId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching store: " + e.getMessage()));
        }
    }

    /**
     * Get store by store ID
     * @param storeId The store ID to find
     * @return The store with the given ID
     */
    @GetMapping("/stores/{storeId}")
    public ResponseEntity<?> getStoreById(@PathVariable Integer storeId) {
        try {
            // Get store from database
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));

            // Create response map
            Map<String, Object> response = new HashMap<>();
            response.put("storeId", store.getStoreId());
            response.put("userId", store.getUser().getUserId());
            response.put("storeName", store.getStoreName());
            response.put("storeDescription", store.getStoreDescription());
            response.put("storeLogo", store.getStoreLogo());
            response.put("storeBanner", store.getStoreBanner());
            response.put("location", store.getLocation());
            response.put("contactInfo", store.getContactInfo());
            response.put("createdAt", store.getCreatedAt());
            response.put("updatedAt", store.getUpdatedAt());

            // Get product count for this store
            long productCount = productRepository.countByStore(store);
            response.put("productCount", productCount);

            // Add placeholder values for statistics that might be needed by the frontend
            response.put("orderCount", 0);
            response.put("totalRevenue", 0);
            response.put("averageRating", 0);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching store: " + e.getMessage()));
        }
    }

    /**
     * Get products for a specific store
     * @param storeId The store ID to get products for
     * @return List of products for the store
     */
    @GetMapping("/stores/{storeId}/products")
    public ResponseEntity<?> getProductsByStoreId(@PathVariable Integer storeId) {
        try {
            // Get store from database
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new RuntimeException("Store not found with ID: " + storeId));

            // Get products for this store
            List<ProductResponse> products = productService.getProductsByStore(store.getStoreId());

            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching products: " + e.getMessage()));
        }
    }

    /**
     * Get all orders
     * @return List of orders
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders() {
        try {
            // Create a list of mock orders for now
            List<Map<String, Object>> orders = new ArrayList<>();

            // Add some mock orders
            for (int i = 1; i <= 5; i++) {
                Map<String, Object> order = new HashMap<>();
                order.put("orderId", i);
                order.put("buyerId", i + 10);
                order.put("sellerId", i + 20);
                order.put("totalAmount", 100.0 * i);
                order.put("status", i % 2 == 0 ? "COMPLETED" : "PENDING");
                order.put("createdAt", LocalDateTime.now().minusDays(i));
                order.put("updatedAt", LocalDateTime.now().minusHours(i));

                // Add some order items
                List<Map<String, Object>> items = new ArrayList<>();
                for (int j = 1; j <= 3; j++) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("productId", j);
                    item.put("quantity", j);
                    item.put("price", 50.0 * j);
                    items.add(item);
                }
                order.put("items", items);

                orders.add(order);
            }

            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Error fetching orders: " + e.getMessage()));
        }
    }
}
