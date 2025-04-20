package com.example.agrifinpalestine.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * @deprecated This class is deprecated and will be removed in a future version.
 * Use {@link TokenManager} instead.
 */
@Component
@Deprecated
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    private final TokenManager tokenManager;

    @Autowired
    public JwtUtils(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     * @deprecated Use {@link TokenManager#generateToken(Authentication)} instead.
     */
    @Deprecated
    public String generateJwtToken(Authentication authentication) {
        return tokenManager.generateToken(authentication);
    }

    /**
     * @deprecated Use {@link TokenManager#generateTokenFromUsername(String)} instead.
     */
    @Deprecated
    public String generateTokenFromUsername(String username) {
        return tokenManager.generateTokenFromUsername(username);
    }

    /**
     * @deprecated Use {@link TokenManager#getUsernameFromToken(String)} instead.
     */
    @Deprecated
    public String getUsernameFromJwtToken(String token) {
        return tokenManager.getUsernameFromToken(token);
    }

    /**
     * @deprecated Use {@link TokenManager#validateToken(String)} instead.
     */
    @Deprecated
    public boolean validateJwtToken(String authToken) {
        return tokenManager.validateToken(authToken);
    }
}
