package com.example.agrifinpalestine.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;

@Configuration
public class DatabaseMigrationConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationConfig.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Bean
    public CommandLineRunner executeMigrationScripts() {
        return args -> {
            logger.info("Executing database migration scripts...");

            try {
                // Execute the SQL script to alter product_image column
                Resource resource = new ClassPathResource("db/migration/V1__alter_product_image_column.sql");
                String sql = asString(resource);

                logger.info("Executing SQL: {}", sql);
                executeScript(sql);
                logger.info("Database migration V1 completed successfully");

                // Execute the SQL script to clear cart items
                try {
                    Resource cartClearResource = new ClassPathResource("db/migration/V3__clear_cart_items.sql");
                    String cartClearSql = asString(cartClearResource);

                    logger.info("Executing SQL to clear cart items: {}", cartClearSql);
                    executeScript(cartClearSql);
                    logger.info("Cart items cleared successfully");
                } catch (Exception e) {
                    logger.error("Error clearing cart items: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to fix cart constraints
                try {
                    Resource fixCartConstraintsResource = new ClassPathResource("db/migration/V4__fix_cart_constraints.sql");
                    String fixCartConstraintsSql = asString(fixCartConstraintsResource);

                    logger.info("Executing SQL to fix cart constraints: {}", fixCartConstraintsSql);
                    executeScript(fixCartConstraintsSql);
                    logger.info("Cart constraints fixed successfully");
                } catch (Exception e) {
                    logger.error("Error fixing cart constraints: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to fix cart data
                try {
                    Resource fixCartDataResource = new ClassPathResource("db/migration/V5__fix_cart_data.sql");
                    String fixCartDataSql = asString(fixCartDataResource);

                    logger.info("Executing SQL to fix cart data: {}", fixCartDataSql);
                    executeScript(fixCartDataSql);
                    logger.info("Cart data fixed successfully");
                } catch (Exception e) {
                    logger.error("Error fixing cart data: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to fix cart issues
                try {
                    Resource fixCartIssuesResource = new ClassPathResource("db/migration/V6__fix_cart_issues.sql");
                    String fixCartIssuesSql = asString(fixCartIssuesResource);

                    logger.info("Executing SQL to fix cart issues: {}", fixCartIssuesSql);
                    executeScript(fixCartIssuesSql);
                    logger.info("Cart issues fixed successfully");
                } catch (Exception e) {
                    logger.error("Error fixing cart issues: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to create carts table
                try {
                    Resource createCartsTableResource = new ClassPathResource("db/migration/V7__create_carts_table.sql");
                    String createCartsTableSql = asString(createCartsTableResource);

                    logger.info("Executing SQL to create carts table: {}", createCartsTableSql);
                    executeScript(createCartsTableSql);
                    logger.info("Carts table created successfully");
                } catch (Exception e) {
                    logger.error("Error creating carts table: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to create cart_items table
                try {
                    Resource createCartItemsTableResource = new ClassPathResource("db/migration/V8__create_cart_items_table.sql");
                    String createCartItemsTableSql = asString(createCartItemsTableResource);

                    logger.info("Executing SQL to create cart_items table: {}", createCartItemsTableSql);
                    executeScript(createCartItemsTableSql);
                    logger.info("Cart_items table created successfully");
                } catch (Exception e) {
                    logger.error("Error creating cart_items table: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to reset cart tables
                try {
                    Resource resetCartTablesResource = new ClassPathResource("db/migration/V9__reset_cart_tables.sql");
                    String resetCartTablesSql = asString(resetCartTablesResource);

                    logger.info("Executing SQL to reset cart tables: {}", resetCartTablesSql);
                    executeScript(resetCartTablesSql);
                    logger.info("Cart tables reset successfully");
                } catch (Exception e) {
                    logger.error("Error resetting cart tables: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }

                // Execute the SQL script to update cart_items table
                try {
                    Resource updateCartItemsTableResource = new ClassPathResource("db/migration/V10__update_cart_items_table.sql");
                    String updateCartItemsTableSql = asString(updateCartItemsTableResource);

                    logger.info("Executing SQL to update cart_items table: {}", updateCartItemsTableSql);
                    executeScript(updateCartItemsTableSql);
                    logger.info("Cart_items table updated successfully");
                } catch (Exception e) {
                    logger.error("Error updating cart_items table: {}", e.getMessage(), e);
                    // Don't fail the application startup if this fails
                }
            } catch (Exception e) {
                logger.error("Error executing database migration: {}", e.getMessage(), e);
                // Don't fail the application startup if migration fails
                // The column might already be altered
            }
        };
    }

    private String asString(Resource resource) throws IOException {
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        }
    }

    /**
     * Execute each SQL statement separately
     * @param sql the SQL script containing multiple statements
     */
    private void executeScript(String sql) {
        // Split the script by semicolons, but ignore semicolons inside comments
        String[] statements = sql.split("(;\\s*\\n|;\\s*$)");

        for (String statement : statements) {
            // Skip empty statements and comments
            String trimmedStatement = statement.trim();
            if (!trimmedStatement.isEmpty() && !trimmedStatement.startsWith("--")) {
                try {
                    logger.info("Executing SQL statement: {}", trimmedStatement);
                    jdbcTemplate.execute(trimmedStatement);
                } catch (Exception e) {
                    logger.error("Error executing SQL statement: {}", e.getMessage());
                    // Continue with the next statement
                }
            }
        }
    }
}
