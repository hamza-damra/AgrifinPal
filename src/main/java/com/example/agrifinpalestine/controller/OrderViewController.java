package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Order;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Optional;

/**
 * Controller for order view pages
 */
@Controller
@RequestMapping("/orders")
public class OrderViewController {

    private static final Logger logger = LoggerFactory.getLogger(OrderViewController.class);

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    /**
     * Display the orders page for the current user
     * @param model The model to add attributes to
     * @return The orders page view name
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public String ordersPage(Model model) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Integer userId = userDetails.getId();

        logger.info("Displaying orders page for user ID: {}", userId);

        // Get user details
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            logger.warn("User not found with ID: {}", userId);
            return "redirect:/login";
        }
        User user = userOptional.get();

        // Get user's orders
        List<Order> orders = orderService.getUserOrders(userId);
        logger.info("Found {} orders for user ID: {}", orders.size(), userId);

        // Add user and orders to model
        model.addAttribute("user", user);
        model.addAttribute("orders", orders);

        return "orders";
    }
}
