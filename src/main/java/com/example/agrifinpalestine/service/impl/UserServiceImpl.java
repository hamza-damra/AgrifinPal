package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartStatus;
import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Entity.UserStatus;
import com.example.agrifinpalestine.Repository.CartRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.LoginRequest;
import com.example.agrifinpalestine.dto.LoginResponse;
import com.example.agrifinpalestine.dto.RegistrationRequest;
import com.example.agrifinpalestine.dto.RegistrationResponse;
import com.example.agrifinpalestine.security.TokenManager;
import com.example.agrifinpalestine.security.RoleManager;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import com.example.agrifinpalestine.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenManager tokenManager;
    private final RoleManager roleManager;
    private final CartRepository cartRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager,
                           TokenManager tokenManager, RoleManager roleManager, CartRepository cartRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenManager = tokenManager;
        this.roleManager = roleManager;
        this.cartRepository = cartRepository;
    }

    @Override
    public LoginResponse authenticateUser(LoginRequest loginRequest) {
        try {
            // First check if the user exists and is active
            Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
            if (userOptional.isPresent()) {
                User user = userOptional.get();

                // Check if user is active
                if (!user.isActive()) {
                    String statusMessage = user.getStatus() != null 
                        ? "Your account is " + user.getStatus().toString().toLowerCase() + ". Please contact support."
                        : "Your account is inactive. Please contact support.";

                    logger.warn("Login attempt for inactive user: {}, status: {}", user.getUsername(), user.getStatus());
                    return LoginResponse.builder()
                            .message(statusMessage)
                            .success(false)
                            .build();
                }
            }

            // Authenticate the user using Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            // Set the authentication in the security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT token
            String jwt = tokenManager.generateToken(authentication);

            // Get user details from the authentication object
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            // Double-check that the user is enabled
            if (!userDetails.isEnabled()) {
                logger.warn("User {} is authenticated but not enabled", userDetails.getUsername());
                return LoginResponse.builder()
                        .message("Your account is not active. Please contact support.")
                        .success(false)
                        .build();
            }

            // Get user roles
            Collection<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // Get full user details from the database
            User user = userRepository.findById(userDetails.getId()).orElseThrow();

            // Return successful login response with JWT token
            return LoginResponse.builder()
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .email(userDetails.getEmail())
                    .fullName(user.getFullName())
                    .roles(roles)
                    .token(jwt)
                    .tokenType("Bearer")
                    .message("Login successful")
                    .success(true)
                    .build();

        } catch (AuthenticationException e) {
            logger.error("Authentication failed: {}", e.getMessage());
            return LoginResponse.builder()
                    .message("Invalid username or password")
                    .success(false)
                    .build();
        } catch (Exception e) {
            logger.error("Error during authentication: {}", e.getMessage());
            return LoginResponse.builder()
                    .message("An error occurred during authentication")
                    .success(false)
                    .build();
        }
    }

    @Override
    public RegistrationResponse registerUser(RegistrationRequest registrationRequest) {
        try {
            // Check if username already exists
            if (userRepository.findByUsername(registrationRequest.getUsername()).isPresent()) {
                return RegistrationResponse.builder()
                        .message("Username already exists")
                        .success(false)
                        .build();
            }

            // Check if email already exists
            if (userRepository.findDistinctByEmail(registrationRequest.getEmail()).isPresent()) {
                return RegistrationResponse.builder()
                        .message("Email already exists")
                        .success(false)
                        .build();
            }

            // Create new user
            User user = new User();
            user.setUsername(registrationRequest.getUsername());
            user.setEmail(registrationRequest.getEmail());
            // Encode the password before saving
            user.setPasswordHash(passwordEncoder.encode(registrationRequest.getPassword()));
            user.setFullName(registrationRequest.getFullName());
            user.setPhone(registrationRequest.getPhone());
            user.setRegion(registrationRequest.getRegion());
            user.setAgricultureType(registrationRequest.getAgricultureType());
            user.setBio(registrationRequest.getBio());
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setIsActive(true);

            // Set user roles using RoleManager
            // Convert Set<String> to List<String> if needed
            Set<String> roleSet = registrationRequest.getRoles();
            List<String> roleList = (roleSet != null) ? new ArrayList<>(roleSet) : null;
            roleManager.assignRolesToUser(user, roleList);

            // Save user to database
            User savedUser = userRepository.save(user);

            // Create a cart for the user if they have the ROLE_USER (buyer) role
            if (savedUser.hasRole("ROLE_USER")) {
                logger.info("Creating cart for new buyer user: {}", savedUser.getUserId());
                Cart cart = createCartForUser(savedUser);

                // Verify cart was created and linked properly
                if (cart != null && cart.getCartId() != null) {
                    logger.info("Successfully created cart {} for user {}", cart.getCartId(), savedUser.getUserId());

                    // Ensure the user has the cart reference using the bidirectional helper method
                    if (savedUser.getCart() == null || !savedUser.getCart().getCartId().equals(cart.getCartId())) {
                        savedUser.setCartWithBidirectional(cart);
                        savedUser = userRepository.save(savedUser);
                        logger.info("Updated user {} with cart reference {}", savedUser.getUserId(), cart.getCartId());
                    }
                } else {
                    logger.error("Failed to create cart for user {}", savedUser.getUserId());
                }
            }

            // Extract role names for response
            Collection<String> roleNames = savedUser.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());

            // Return response
            return RegistrationResponse.builder()
                    .userId(savedUser.getUserId())
                    .username(savedUser.getUsername())
                    .email(savedUser.getEmail())
                    .roles(roleNames)
                    .message("Registration successful")
                    .success(true)
                    .build();
        } catch (Exception e) {
            logger.error("Error during registration: {}", e.getMessage());
            return RegistrationResponse.builder()
                    .message("An error occurred during registration")
                    .success(false)
                    .build();
        }
    }


    /**
     * Create a new cart for a user with the buyer role
     * @param user The user to create a cart for
     * @return The created cart
     */
    private Cart createCartForUser(User user) {
        try {
            logger.info("Creating cart for user ID: {}", user.getUserId());

            // Check if user already has a cart
            if (user.getCart() != null && user.getCart().getCartId() != null) {
                logger.info("User {} already has cart {} in memory", user.getUserId(), user.getCart().getCartId());
                return user.getCart();
            }

            // Check if there's an active cart for this user in the database
            Optional<Cart> existingCart = cartRepository.findActiveCartByUserId(user.getUserId());
            if (existingCart.isPresent()) {
                Cart cart = existingCart.get();
                logger.info("Found existing active cart {} for user {}", cart.getCartId(), user.getUserId());

                // Ensure bidirectional relationship
                user.setCart(cart);
                userRepository.save(user);
                logger.info("Updated user {} with existing cart reference {}", user.getUserId(), cart.getCartId());
                return cart;
            }

            // Create a new cart
            Cart cart = new Cart();
            cart.setUserWithBidirectional(user); // Use the bidirectional helper method
            cart.setTotalPrice(BigDecimal.ZERO);
            cart.setTotalQuantity(0);
            cart.setStatus(CartStatus.ACTIVE);
            cart.setCreatedAt(LocalDateTime.now());
            cart.setUpdatedAt(LocalDateTime.now());

            // Save the cart
            Cart savedCart = cartRepository.save(cart);
            logger.info("Created new cart with ID {} for user {}", savedCart.getCartId(), user.getUserId());

            // The bidirectional relationship should already be set by setUserWithBidirectional,
            // but let's make sure the user entity has the correct reference
            if (user.getCart() == null || !user.getCart().getCartId().equals(savedCart.getCartId())) {
                user.setCartWithBidirectional(savedCart);
            }
            User updatedUser = userRepository.save(user);
            logger.info("Updated user {} with new cart reference {}", updatedUser.getUserId(), savedCart.getCartId());

            // Verify the cart was saved correctly
            Optional<Cart> verifyCart = cartRepository.findById(savedCart.getCartId());
            if (verifyCart.isPresent()) {
                logger.info("Successfully verified cart {} exists in database", savedCart.getCartId());
            } else {
                logger.error("Failed to verify cart {} exists in database", savedCart.getCartId());
            }

            return savedCart;
        } catch (Exception e) {
            logger.error("Error creating cart for user {}: {}", user.getUserId(), e.getMessage(), e);
            throw e;
        }
    }
}
