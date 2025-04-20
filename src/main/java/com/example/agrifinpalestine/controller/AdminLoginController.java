package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.LoginRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Controller for the admin login page
 */
@Controller
@RequestMapping("/admin")
public class AdminLoginController {

    /**
     * Show the admin login page
     * @param error Error flag from failed login attempts
     * @param model The model to add attributes to
     * @return The admin login page
     */
    @GetMapping("/login")
    public String showAdminLoginPage(@RequestParam(required = false) String error, Model model) {
        // Add login request object to model
        model.addAttribute("loginRequest", new LoginRequest());

        // Add error message if error parameter is present
        if (error != null) {
            model.addAttribute("error", "Invalid username or password");
        }

        return "admin/login";
    }
}
