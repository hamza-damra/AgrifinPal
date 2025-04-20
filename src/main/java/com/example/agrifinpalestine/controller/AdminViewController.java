package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.security.TokenManager;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/admin")
public class AdminViewController {

    private static final Logger logger = LoggerFactory.getLogger(AdminViewController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenManager tokenManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @GetMapping("/dashboard")
    public String adminDashboard(@RequestParam(required = false) String token,
                               Model model,
                               HttpServletRequest request) {
        return handleAdminRequest(token, model, request, "admin/dashboard");
    }

    @GetMapping("/store-details")
    public String storeDetails(@RequestParam(required = false) String token,
                             @RequestParam(required = false) String id,
                             Model model,
                             HttpServletRequest request) {
        // Add the seller ID to the model if provided
        if (id != null && !id.isEmpty()) {
            model.addAttribute("sellerId", id);
        }
        return handleAdminRequest(token, model, request, "admin/store-details");
    }

    /**
     * Common method to handle admin requests with authentication
     */
    private String handleAdminRequest(String token, Model model, HttpServletRequest request, String viewName) {
        logger.info("Admin request received" + (token != null ? " with token" : ""));

        // If token is provided, authenticate the user
        if (token != null && !token.isEmpty()) {
            try {
                // Validate token
                if (tokenManager.validateToken(token)) {
                    String username = tokenManager.getUsernameFromToken(token);
                    logger.info("Valid token for user: {}", username);

                    // Load user details
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // Check if user is enabled (active)
                    if (userDetails.isEnabled()) {
                        // Set authentication in security context
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        logger.info("User authenticated via token: {}", username);
                    } else {
                        logger.warn("User {} is not active, denying authentication", username);
                        // Redirect to login page with error message
                        return "redirect:/admin/login?error=inactive";
                    }
                }
            } catch (Exception e) {
                logger.error("Error processing token: {}", e.getMessage());
                model.addAttribute("error", "Authentication error. Please login again.");
                return "redirect:/admin/login?error=true";
            }
        }

        // Check if user is authenticated
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication.getPrincipal() instanceof String)) {

            try {
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                logger.info("User is authenticated: {}", userDetails.getUsername());

                // Check if user has ADMIN role
                boolean hasAdmin = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

                if (!hasAdmin) {
                    logger.warn("User does not have ADMIN role");
                    model.addAttribute("error", "You do not have permission to access this page.");
                    return "redirect:/dashboard";
                }

                // Get user from database
                User user = userRepository.findById(userDetails.getId())
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Add user information to model
                model.addAttribute("user", user);

                return viewName;
            } catch (Exception e) {
                logger.error("Error retrieving user data: {}", e.getMessage());
                model.addAttribute("error", "Error retrieving user data.");
                return "redirect:/admin/login?error=true";
            }
        }

        // User is not authenticated, redirect to admin login
        logger.info("User not authenticated, redirecting to admin login");
        return "redirect:/admin/login";
    }
}
