package com.example.agrifinpalestine.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.agrifinpalestine.service.StripeService;

/**
 * Controller for Stripe-related endpoints
 */
@RestController
@RequestMapping("/api/stripe")
public class StripeController {

    @Autowired
    private StripeService stripeService;

    /**
     * Get the Stripe public key
     * @return The Stripe public key
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, String>> getStripeConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("publicKey", stripeService.getPublicKey());
        return ResponseEntity.ok(config);
    }
}
