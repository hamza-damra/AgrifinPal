package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.LoginRequest;
import com.example.agrifinpalestine.dto.LoginResponse;
import com.example.agrifinpalestine.dto.RegistrationRequest;
import com.example.agrifinpalestine.dto.RegistrationResponse;
import com.example.agrifinpalestine.security.RoleManager;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleManager roleManager;

    @Autowired
    public AuthController(UserService userService, UserRepository userRepository, RoleManager roleManager) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.roleManager = roleManager;
    }


    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = userService.authenticateUser(loginRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegistrationRequest registrationRequest) {
        RegistrationResponse response = userService.registerUser(registrationRequest);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("userId", user.getUserId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("phone", user.getPhone());
            response.put("region", user.getRegion());
            response.put("agricultureType", user.getAgricultureType());
            response.put("bio", user.getBio());
            response.put("profileImage", user.getProfileImage());
            response.put("createdAt", user.getCreatedAt());

            // Add user roles using RoleManager
            response.put("roles", roleManager.getCurrentUserRoles());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Error retrieving user information",
                    "error", e.getMessage()
            ));
        }
    }

    // Old logout method removed to avoid ambiguous mapping

    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuthentication() {
        logger.info("Checking authentication status");

        Map<String, Object> response = new HashMap<>();

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            boolean isAuthenticated = authentication != null &&
                                     authentication.isAuthenticated() &&
                                     !(authentication.getPrincipal() instanceof String);

            if (isAuthenticated) {
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                logger.info("User is authenticated: {}", userDetails.getUsername());

                response.put("authenticated", true);
                response.put("username", userDetails.getUsername());
                response.put("roles", userDetails.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()));

                return ResponseEntity.ok(response);
            } else {
                logger.info("User is not authenticated");
                response.put("authenticated", false);
                response.put("message", "User is not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
        } catch (Exception e) {
            logger.error("Error checking authentication: {}", e.getMessage());
            response.put("authenticated", false);
            response.put("message", "Error checking authentication: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Logout the user
     * @param request The HTTP request
     * @param response The HTTP response
     * @return ResponseEntity with logout status
     */
    @GetMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        logger.info("Logout request received");

        // Invalidate session if exists
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            logger.info("Session invalidated");
        }

        // Clear security context
        SecurityContextHolder.clearContext();
        logger.info("Security context cleared");

        // Clear cookies
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                    logger.info("Token cookie cleared");
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "message", "Logged out successfully",
            "redirectUrl", "/"
        ));
    }
}
