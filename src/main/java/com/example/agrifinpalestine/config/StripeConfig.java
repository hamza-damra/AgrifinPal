package com.example.agrifinpalestine.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.stripe.Stripe;

import jakarta.annotation.PostConstruct;

/**
 * Configuration class for Stripe API
 */
@Getter
@Configuration
public class StripeConfig {

    /**
     * -- GETTER --
     *  Get the Stripe API key
     */
    @Value("${stripe.api.key}")
    private String stripeApiKey;

    /**
     * -- GETTER --
     *  Get the Stripe public key
     */
    @Value("${stripe.public.key}")
    private String stripePublicKey;

    /**
     * Initialize Stripe with the API key
     */
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }

}
