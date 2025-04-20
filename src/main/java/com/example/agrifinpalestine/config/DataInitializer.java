package com.example.agrifinpalestine.config;

import com.example.agrifinpalestine.Entity.ProductCategory;
import com.example.agrifinpalestine.Repository.ProductCategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private ProductCategoryRepository categoryRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            // Initialize categories if they don't exist
            if (categoryRepository.count() == 0) {
                logger.info("Initializing product categories...");

                List<ProductCategory> categories = Arrays.asList(
                    createCategory("Fruits", "Fruits", "Fresh fruits from local farms", "fruits.jpg"),
                    createCategory("Vegetables", "Vegetables", "Fresh vegetables from local farms", "vegetables.jpg"),
                    createCategory("Herbs", "Herbs", "Fresh herbs and spices", "herbs.jpg"),
                    createCategory("Dairy", "Dairy", "Fresh dairy products", "dairy.jpg"),
                    createCategory("Honey", "Honey", "Pure natural honey", "honey.jpg"),
                    createCategory("Nuts", "Nuts", "Fresh nuts and dried fruits", "nuts.jpg"),
                    createCategory("Olive Oil", "Olive Oil", "Pure Palestinian olive oil", "olive-oil.jpg"),
                    createCategory("Seeds", "Seeds", "Seeds for planting", "seeds.jpg")
                );

                categoryRepository.saveAll(categories);
                logger.info("Product categories initialized successfully!");
            }
        };
    }

    private ProductCategory createCategory(String nameEn, String nameAr, String description, String image) {
        ProductCategory category = new ProductCategory();
        category.setCategoryNameEn(nameEn);
        category.setCategoryNameAr(nameAr);
        category.setCategoryDescription(description);
        category.setCategoryImage(image);
        return category;
    }
}
