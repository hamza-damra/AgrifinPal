package com.example.agrifinpalestine.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ProfileViewController {

    /**
     * Display the edit profile page
     * @return the edit-profile template
     */
    @GetMapping("/edit-profile")
    public String editProfilePage() {
        return "edit-profile";
    }
}
