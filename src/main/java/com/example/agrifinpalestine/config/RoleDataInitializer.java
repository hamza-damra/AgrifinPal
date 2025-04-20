package com.example.agrifinpalestine.config;

import com.example.agrifinpalestine.Entity.Role;
import com.example.agrifinpalestine.Entity.Role.ERole;
import com.example.agrifinpalestine.Repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

@Configuration
public class RoleDataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(RoleDataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Bean
    @Order(1) // Execute before other initializers
    public CommandLineRunner initRoles() {
        return args -> {
            logger.info("Initializing roles...");
            
            // Check if roles already exist
            if (roleRepository.count() == 0) {
                logger.info("No roles found, creating default roles");
                
                // Create default roles
                Role userRole = new Role(ERole.ROLE_USER);
                Role sellerRole = new Role(ERole.ROLE_SELLER);
                Role adminRole = new Role(ERole.ROLE_ADMIN);
                
                // Save roles
                roleRepository.save(userRole);
                roleRepository.save(sellerRole);
                roleRepository.save(adminRole);
                
                logger.info("Default roles created successfully");
            } else {
                logger.info("Roles already exist, skipping initialization");
            }
        };
    }
}
