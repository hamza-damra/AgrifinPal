package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.exception.auth.InvalidTokenException;
import com.example.agrifinpalestine.exception.auth.TokenExpiredException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;  // ← use the non‑deprecated exception
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Manages JWT token operations in the application
 */
@Component
public class TokenManager {
    private static final Logger logger = LoggerFactory.getLogger(TokenManager.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String CART_TOKEN_HEADER = "X-Cart-Token";

    @Value("${jwt.expirationMs:86400000}") // 24 hours by default
    private int jwtExpirationMs;

    private final SecretKey jwtSigningKey;

    public TokenManager(SecretKey jwtSigningKey) {
        this.jwtSigningKey = jwtSigningKey;
    }

    /**
     * Parse the token from the request
     * @param request the HTTP request
     * @return the token, or null if not found
     */
    public String parseTokenFromRequest(HttpServletRequest request) {
        // First, try to get the token from the Authorization header
        String headerAuth = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith(BEARER_PREFIX)) {
            return headerAuth.substring(BEARER_PREFIX.length());
        }

        // If not found, try to get it from the X-Cart-Token header
        String cartToken = request.getHeader(CART_TOKEN_HEADER);
        if (StringUtils.hasText(cartToken)) {
            return cartToken;
        }

        return null;
    }

    /**
     * Get the signing key for JWT tokens
     * @return The signing key
     */
    private Key getSigningKey() {
        return jwtSigningKey;
    }

    /**
     * Generate a JWT token from an authentication object
     * @param authentication The authentication object
     * @return The generated JWT token
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateTokenFromUsername(userPrincipal.getUsername());
    }

    /**
     * Generate a JWT token from a username
     * @param username The username
     * @return The generated JWT token
     */
    public String generateTokenFromUsername(String username) {
        Map<String, Object> claims = new HashMap<>();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), io.jsonwebtoken.SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Extract the username from a JWT token
     * @param token The JWT token
     * @return The username
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Extract a claim from a JWT token
     * @param token The JWT token
     * @param claimsResolver Function to extract a specific claim
     * @return The extracted claim
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from a JWT token
     * @param token The JWT token
     * @return All claims from the token
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if a JWT token is expired
     * @param token The JWT token
     * @return true if the token is expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        try {
            final Date expiration = getExpirationDateFromToken(token);
            return expiration.before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Get the expiration date from a JWT token
     * @param token The JWT token
     * @return The expiration date
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * Validate a JWT token
     * @param token The JWT token to validate
     * @return true if the token is valid, false otherwise
     * @throws InvalidTokenException if the token is invalid
     * @throws TokenExpiredException if the token is expired
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
            throw new InvalidTokenException("Invalid JWT signature");
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
            throw new InvalidTokenException("Malformed JWT token");
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
            throw new TokenExpiredException();
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
            throw new InvalidTokenException("Unsupported JWT token");
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
            throw new InvalidTokenException("JWT claims string is empty");
        }
    }

    /**
     * Refresh a JWT token
     * @param token The JWT token to refresh
     * @return The refreshed JWT token
     */
    public String refreshToken(String token) {
        final String username = getUsernameFromToken(token);
        return generateTokenFromUsername(username);
    }
}
