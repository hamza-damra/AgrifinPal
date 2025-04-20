package com.example.agrifinpalestine.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for JWT
 */
@Configuration
public class JwtConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expirationMs}")
    private int jwtExpirationMs;

    /**
     * Get the JWT secret
     * @return The JWT secret
     */
    public String getJwtSecret() {
        return jwtSecret;
    }

    /**
     * Get the JWT expiration time in milliseconds
     * @return The JWT expiration time in milliseconds
     */
    public int getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
