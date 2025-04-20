package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.exception.auth.InvalidTokenException;
import com.example.agrifinpalestine.exception.auth.TokenExpiredException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired
    private TokenManager tokenManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Check if user is already authenticated
            if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().isAuthenticated() &&
                !(SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof String)) {

                // User is already authenticated, continue with filter chain
                logger.debug("User is already authenticated: {}",
                    SecurityContextHolder.getContext().getAuthentication().getName());
            } else {
                // First, check for token in URL parameters (for dashboard redirect)
                String jwt = request.getParameter("token");

                // If no token in URL, check Authorization header
                if (jwt == null) {
                    jwt = tokenManager.parseTokenFromRequest(request);
                }

                // If we have a token, try to validate and authenticate
                if (jwt != null) {
                    logger.info("Found JWT token: {}", jwt.substring(0, Math.min(10, jwt.length())) + "...");

                    try {
                        // Validate token
                        if (tokenManager.validateToken(jwt)) {
                            String username = tokenManager.getUsernameFromToken(jwt);
                            logger.info("Valid token for user: {}", username);

                            // Load user details and set authentication
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            // Check if user is enabled (active)
                            if (userDetails.isEnabled()) {
                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                logger.info("User authenticated via JWT token: {}", username);
                            } else {
                                logger.warn("User {} is not active, denying authentication", username);
                                // Don't set authentication in security context
                                // This will cause the request to be treated as unauthenticated
                            }

                            // Store token in session for subsequent requests
                            request.getSession().setAttribute("token", jwt);
                        } else {
                            logger.warn("Token validation failed");
                        }
                    } catch (UsernameNotFoundException e) {
                        logger.error("User not found: {}", e.getMessage());
                    } catch (TokenExpiredException e) {
                        logger.error("JWT token expired: {}", e.getMessage());
                    } catch (InvalidTokenException e) {
                        logger.error("Invalid JWT token: {}", e.getMessage());
                    } catch (Exception e) {
                        logger.error("Token validation error: {}", e.getMessage());
                    }
                } else {
                    // Check if token is stored in session
                    String sessionToken = (String) request.getSession().getAttribute("token");
                    if (sessionToken != null) {
                        logger.info("Found token in session");

                        try {
                            // Validate token
                            if (tokenManager.validateToken(sessionToken)) {
                                String username = tokenManager.getUsernameFromToken(sessionToken);
                                logger.info("Valid session token for user: {}", username);

                                // Load user details and set authentication
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                                // Check if user is enabled (active)
                                if (userDetails.isEnabled()) {
                                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                            userDetails, null, userDetails.getAuthorities());
                                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                                    SecurityContextHolder.getContext().setAuthentication(authentication);
                                    logger.info("User authenticated via session token: {}", username);
                                } else {
                                    logger.warn("User {} is not active, denying authentication", username);
                                    // Remove token from session since user is not active
                                    request.getSession().removeAttribute("token");
                                }
                            } else {
                                logger.warn("Session token validation failed");
                                request.getSession().removeAttribute("token");
                            }
                        } catch (Exception e) {
                            logger.error("Session token validation error: {}", e.getMessage());
                            request.getSession().removeAttribute("token");
                        }
                    } else {
                        logger.debug("No JWT token found in request or session");
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    // This method is no longer needed as we use TokenManager.parseTokenFromRequest
    @Deprecated
    private String parseJwt(HttpServletRequest request) {
        return tokenManager.parseTokenFromRequest(request);
    }
}
