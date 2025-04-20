package com.example.agrifinpalestine.security;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    private RoleManager roleManager;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());

        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecretKey jwtSigningKey() {
        // Use the JWT secret from application.properties
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return new SecretKeySpec(keyBytes, SignatureAlgorithm.HS512.getJcaName());
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**")
            )
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(unauthorizedHandler)
                .accessDeniedPage("/error/unauthorized")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            // Configure form login
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/process-login")
                .defaultSuccessUrl("/dashboard", true) // Force redirect to dashboard which will then redirect based on role
                .failureUrl("/login?error=true")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .permitAll()
            )
            .authorizeHttpRequests(auth ->
                // Public API endpoints
                auth.requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/test/**").permitAll()
                    .requestMatchers("/api/auth-test/public").permitAll()
                    .requestMatchers("/api/products/**").permitAll()
                    .requestMatchers("/api/categories/**").permitAll()
                    .requestMatchers("/api/stores/public/**").permitAll()
                    .requestMatchers("/api/reviews/product/**").permitAll()
                    .requestMatchers("/api/regions/**").permitAll()
                    .requestMatchers("/api/messages").permitAll()
                    .requestMatchers("/api/cart/test").permitAll()
                    .requestMatchers("/api/admin/create-admin").permitAll() // Allow admin creation without authentication

                    // Role-specific API endpoints
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/seller/**").hasAnyRole("SELLER", "ADMIN")
                    .requestMatchers("/api/stores/manage/**").hasAnyRole("SELLER", "ADMIN")
                    .requestMatchers("/api/products/manage/**").hasAnyRole("SELLER", "ADMIN")
                    .requestMatchers("/api/cart/**").hasRole("USER")

                    // Allow access to static resources
                    .requestMatchers("/css/**").permitAll()
                    .requestMatchers("/js/**").permitAll()
                    .requestMatchers("/images/**").permitAll()
                    .requestMatchers("/webjars/**").permitAll()
                    // Removed favicon.ico to prevent 404 errors

                    // Public pages
                    .requestMatchers("/", "/login", "/register", "/process-login").permitAll()
                    .requestMatchers("/products", "/product/**", "/marketplace").permitAll()
                    .requestMatchers("/cart-test").permitAll()
                    .requestMatchers("/admin").permitAll() // Allow access to admin redirect endpoint
                    .requestMatchers("/admin/login").permitAll() // Allow access to admin login page
                    .requestMatchers("/admin/dashboard").permitAll() // Allow access to admin dashboard with token

                    // Role-specific pages
                    .requestMatchers("/admin/**").hasRole("ADMIN")
                    .requestMatchers("/seller/**").hasAnyRole("SELLER", "ADMIN")
                    .requestMatchers("/dashboard").authenticated()
                    .requestMatchers("/cart", "/checkout", "/checkout-page").hasRole("USER")
                    .requestMatchers("/stores", "/store/**").permitAll()

                    // Allow access to error pages
                    .requestMatchers("/error", "/error/**", "/error.html").permitAll()

                    // Any other request requires authentication
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
