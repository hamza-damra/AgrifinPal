package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Store;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.StoreRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.security.TokenManager;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
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
import java.util.Optional;

@Controller
@RequestMapping("/seller")
public class SellerViewController {

    private static final Logger logger = LoggerFactory.getLogger(SellerViewController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private TokenManager tokenManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @GetMapping("/dashboard")
    public String sellerDashboard(@RequestParam(required = false) String token,
                                 Model model,
                                 HttpServletRequest request) {
        logger.info("Seller dashboard request received" + (token != null ? " with token" : ""));

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
                        return "redirect:/login?error=inactive";
                    }
                }
            } catch (Exception e) {
                logger.error("Error processing token: {}", e.getMessage());
                model.addAttribute("error", "Authentication error. Please login again.");
                return "redirect:/login";
            }
        }

        // Check if user is authenticated
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication.getPrincipal() instanceof String)) {

            try {
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                logger.info("User is authenticated: {}", userDetails.getUsername());

                // Check if user has SELLER or ADMIN role
                boolean hasSeller = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"));
                boolean hasAdmin = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

                if (!hasSeller && !hasAdmin) {
                    logger.warn("User does not have SELLER or ADMIN role");
                    model.addAttribute("error", "You do not have permission to access this page.");
                    return "redirect:/dashboard";
                }

                // Get user from database
                User user = userRepository.findById(userDetails.getId())
                        .orElseThrow(() -> new RuntimeException("User not found"));

                // Get seller's store
                Optional<Store> storeOptional = storeRepository.findByUser(user);

                if (storeOptional.isPresent()) {
                    Store store = storeOptional.get();
                    // Add store information to model
                    model.addAttribute("store", store);
                    model.addAttribute("user", user);
                    logger.info("Store found for seller: {}", store.getStoreName());
                } else {
                    model.addAttribute("storeNotFound", true);
                    logger.info("No store found for seller");
                }

                return "seller/dashboard";
            } catch (Exception e) {
                logger.error("Error retrieving user data: {}", e.getMessage());
                model.addAttribute("error", "Error retrieving user data.");
                return "redirect:/login";
            }
        }

        // User is not authenticated, redirect to login
        logger.info("User not authenticated, redirecting to login");
        return "redirect:/login";
    }
}
