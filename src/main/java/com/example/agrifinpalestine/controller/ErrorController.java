package com.example.agrifinpalestine.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for handling custom error pages
 */
@Controller
@RequestMapping("/error")
public class ErrorController {

    /**
     * Display the unauthorized access page
     * @return The name of the unauthorized template
     */
    @GetMapping("/unauthorized")
    public String unauthorized() {
        return "error/unauthorized";
    }


}
