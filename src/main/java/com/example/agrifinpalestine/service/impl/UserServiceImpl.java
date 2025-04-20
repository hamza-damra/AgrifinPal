package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.Cart;
import com.example.agrifinpalestine.Entity.CartStatus;
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
import java.util.*;
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
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           TokenManager tokenManager,
                           RoleManager roleManager,
                           CartRepository cartRepository) {
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
            Optional<User> userOptional = userRepository.findDistinctByUsername(loginRequest.getUsername());
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                if (user.getStatus() != UserStatus.ACTIVE || (user.getIsActive() != null && !user.getIsActive())) {
                    return LoginResponse.builder()
                            .message("Your account is inactive. Please contact support.")
                            .success(false)
                            .build();
                }
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenManager.generateToken(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            if (!userDetails.isEnabled()) {
                return LoginResponse.builder()
                        .message("Your account is not active. Please contact support.")
                        .success(false)
                        .build();
            }

            Collection<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            User user = userRepository.findById(userDetails.getId()).orElseThrow();

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
            return LoginResponse.builder().message("Invalid username or password").success(false).build();
        } catch (Exception e) {
            logger.error("Error during authentication: {}", e.getMessage());
            return LoginResponse.builder().message("An error occurred during authentication").success(false).build();
        }
    }

    @Override
    public RegistrationResponse registerUser(RegistrationRequest registrationRequest) {
        try {
            if (userRepository.findDistinctByUsername(registrationRequest.getUsername()).isPresent()) {
                return RegistrationResponse.builder().message("Username already exists").success(false).build();
            }

            if (userRepository.findDistinctByEmail(registrationRequest.getEmail()).isPresent()) {
                return RegistrationResponse.builder().message("Email already exists").success(false).build();
            }

            User user = new User();
            user.setUsername(registrationRequest.getUsername());
            user.setEmail(registrationRequest.getEmail());
            user.setPasswordHash(passwordEncoder.encode(registrationRequest.getPassword()));
            user.setFullName(registrationRequest.getFullName());
            user.setPhone(registrationRequest.getPhone());
            user.setRegion(registrationRequest.getRegion());
            user.setAgricultureType(registrationRequest.getAgricultureType());
            user.setBio(registrationRequest.getBio());
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            user.setIsActive(true);

            Set<String> roleSet = registrationRequest.getRoles();
            List<String> roleList = roleSet != null ? new ArrayList<>(roleSet) : null;
            roleManager.assignRolesToUser(user, roleList);

            User savedUser = userRepository.save(user);

            if (savedUser.hasRole("ROLE_USER")) {
                Cart cart = createCartForUser(savedUser);
                if (cart != null && cart.getCartId() != null) {
                    savedUser.setCartWithBidirectional(cart);
                    savedUser = userRepository.save(savedUser);
                }
            }

            Collection<String> roleNames = savedUser.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toSet());

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
            return RegistrationResponse.builder().message("An error occurred during registration").success(false).build();
        }
    }

    private Cart createCartForUser(User user) {
        Optional<Cart> existingCart = cartRepository.findActiveCartByUserId(user.getUserId());
        if (existingCart.isPresent()) {
            Cart cart = existingCart.get();
            user.setCart(cart);
            userRepository.save(user);
            return cart;
        }

        Cart cart = new Cart();
        cart.setUserWithBidirectional(user);
        cart.setTotalPrice(BigDecimal.ZERO);
        cart.setTotalQuantity(0);
        cart.setStatus(CartStatus.ACTIVE);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        Cart savedCart = cartRepository.save(cart);
        user.setCartWithBidirectional(savedCart);
        userRepository.save(user);
        return savedCart;
    }
}
