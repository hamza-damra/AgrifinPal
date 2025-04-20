package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.LoginRequest;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.security.Principal;
import java.util.Collection;

@Controller
public class WebController {

    private static final Logger logger = LoggerFactory.getLogger(WebController.class);

    @Autowired
    private UserService userService;

    @GetMapping("/login")
    public String loginPage(Model model) {
        model.addAttribute("loginRequest", new LoginRequest());
        return "login";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "register";
    }

    @GetMapping("/")
    public String homePage() {
        return "home";
    }

    @GetMapping("/dashboard")
    public String dashboard(@RequestParam(required = false) String token, Model model) {
        logger.info("Dashboard request received" + (token != null ? " with token" : ""));

        // Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Log authentication status
        if (authentication != null) {
            logger.info("Authentication: name={}, authenticated={}, principal={}",
                authentication.getName(),
                authentication.isAuthenticated(),
                authentication.getPrincipal().getClass().getName());
        } else {
            logger.info("No authentication found");
        }

        // Check if user is authenticated
        boolean isAuthenticated = authentication != null &&
                                 authentication.isAuthenticated() &&
                                 !(authentication.getPrincipal() instanceof String);

        if (isAuthenticated) {
            // Get user authorities/roles
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            logger.info("User roles: {}", authorities);

            // Redirect based on role, passing the token if available
            String redirectUrl;
            if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                logger.info("Redirecting to admin dashboard");
                redirectUrl = "/admin/dashboard";
            } else if (authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_SELLER"))) {
                logger.info("Redirecting to seller dashboard");
                redirectUrl = "/seller/dashboard";
            } else {
                // Regular user (buyer) should be redirected to marketplace
                logger.info("Redirecting regular user to marketplace");
                return "redirect-to-marketplace";
            }

            // Append token to redirect URL if available
            if (token != null && !token.isEmpty()) {
                return "redirect:" + redirectUrl + "?token=" + token;
            } else {
                return "redirect:" + redirectUrl;
            }
        }

        // If token is provided but authentication failed, show error message
        if (token != null) {
            logger.warn("Token provided but authentication failed");
            model.addAttribute("error", "Invalid or expired token. Please login again.");
        }

        // User is not authenticated, redirect to login
        logger.info("User not authenticated, redirecting to login");
        return "redirect:/login";
    }

    @GetMapping("/products")
    public String products() {
        return "products";
    }

    @GetMapping("/product")
    public String productDetail() {
        return "product-detail";
    }

    @GetMapping("/stores")
    public String stores() {
        return "stores";
    }

    @GetMapping("/store")
    public String storeDetail() {
        return "store-detail";
    }

    // Admin redirect method removed to avoid conflict with AdminRedirectController

    // Admin login page method removed to avoid conflict with AdminLoginController

}
