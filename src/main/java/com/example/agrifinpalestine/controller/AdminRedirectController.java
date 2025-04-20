package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.security.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for redirecting to the admin dashboard
 */
@Controller
@RequestMapping("/admin")
public class AdminRedirectController {

    private static final Logger logger = LoggerFactory.getLogger(AdminRedirectController.class);

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Redirect to the admin dashboard with a JWT token
     * @return Redirect to the admin dashboard
     */
    @GetMapping("")
    public String redirectToAdminDashboard() {
        logger.info("Admin redirect requested");

        // Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Check if user is authenticated (not anonymous)
        boolean isAuthenticated = authentication != null &&
                                 authentication.isAuthenticated() &&
                                 !(authentication.getPrincipal() instanceof String);

        if (!isAuthenticated) {
            logger.info("User not authenticated, redirecting to admin login");
            // User is not authenticated, redirect to admin login
            return "redirect:/admin/login";
        }

        // Check if authenticated user has ADMIN role
        boolean isAdmin = authentication.getAuthorities().stream()
                         .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            logger.info("User is admin, generating token and redirecting to dashboard");
            // Generate a JWT token for the user
            String token = jwtUtils.generateJwtToken(authentication);

            // Redirect to admin dashboard
            return "redirect:/admin/dashboard?token=" + token;
        } else {
            logger.warn("User is authenticated but not an admin");
            // User is authenticated but not an admin
            return "redirect:/login?error=unauthorized";
        }
    }
}
