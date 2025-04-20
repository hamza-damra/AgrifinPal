package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartItem;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Controller
public class CheckoutViewController {

    @Autowired
    private StripeService stripeService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/checkout-page")
    @PreAuthorize("hasRole('USER')")
    public String checkout(Model model) {
        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Integer userId = userDetails.getId();

        // Get user details
        Optional<User> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            return "redirect:/login";
        }
        User user = userOptional.get();

        // Get active cart
        Optional<Cart> cartOptional = cartRepository.findActiveCartByUserId(userId);
        if (!cartOptional.isPresent() || cartOptional.get().getCartItems().isEmpty()) {
            return "redirect:/cart?error=empty";
        }
        Cart cart = cartOptional.get();
        List<CartItem> cartItems = cart.getCartItems();

        // Calculate total
        BigDecimal total = cartItems.stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Add data to model
        model.addAttribute("cartItems", cartItems);
        model.addAttribute("total", total);
        model.addAttribute("user", user);
        model.addAttribute("stripePublicKey", stripeService.getPublicKey());

        return "checkout";
    }
}
