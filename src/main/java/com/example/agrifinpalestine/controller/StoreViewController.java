package com.example.agrifinpalestine.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;

@Controller
public class StoreViewController {

    /**
     * Display the create store page
     * @return the create-store template
     */
    @GetMapping("/create-store")
    public String createStorePage() {
        return "create-store";
    }

    /**
     * Display the edit store page with path variable
     * @param storeId The ID of the store to edit
     * @return the edit-store template or redirect to dashboard if ID is invalid
     */
    @GetMapping("/edit-store/{storeId}")
    public String editStorePageWithPathVariable(@PathVariable(required = false) String storeId) {
        return validateAndReturnEditStorePage(storeId);
    }

    /**
     * Display the edit store page with query parameter
     * @param id The ID of the store to edit
     * @return the edit-store template or redirect to dashboard if ID is invalid
     */
    @GetMapping("/edit-store")
    public String editStorePageWithQueryParam(@RequestParam(required = false) String id) {
        return validateAndReturnEditStorePage(id);
    }

    /**
     * Helper method to validate store ID and return appropriate view
     */
    private String validateAndReturnEditStorePage(String storeId) {
        // Check if storeId is valid
        if (storeId == null || storeId.equals("undefined") || !storeId.matches("\\d+")) {
            // Invalid store ID, redirect to dashboard
            return "redirect:/dashboard";
        }

        try {
            // Try to parse the store ID as an integer
            Integer.parseInt(storeId);
            return "edit-store";
        } catch (NumberFormatException e) {
            // Invalid store ID, redirect to dashboard
            return "redirect:/dashboard";
        }
    }

    /**
     * Display the add product page
     * @return the add-product template
     */
    @GetMapping("/add-product")
    public String addProductPage() {
        return "add-product";
    }

    /**
     * Display the edit product page with query parameter
     * @param id The ID of the product to edit
     * @return the edit-product template or redirect to dashboard if ID is invalid
     */
    @GetMapping("/edit-product")
    public String editProductPageWithQueryParam(@RequestParam(required = false) String id) {
        // Check if id is valid
        if (id == null || id.equals("undefined") || !id.matches("\\d+")) {
            // Invalid product ID, redirect to dashboard
            return "redirect:/dashboard";
        }

        try {
            // Try to parse the product ID as an integer
            Integer.parseInt(id);
            return "edit-product";
        } catch (NumberFormatException e) {
            // Invalid product ID, redirect to dashboard
            return "redirect:/dashboard";
        }
    }

    /**
     * Display the category management page for sellers
     * @return the category-management template
     */
    @GetMapping("/category-management")
    public String categoryManagementPage() {
        return "category-management";
    }
}
