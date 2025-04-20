package com.example.agrifinpalestine.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.agrifinpalestine.config.StripeConfig;
import com.stripe.exception.StripeException;
import com.stripe.model.Charge;
import com.stripe.model.Customer;
import com.stripe.model.PaymentIntent;

/**
 * Service for Stripe payment processing
 */
@Service
public class StripeService {

    @Autowired
    private StripeConfig stripeConfig;

    /**
     * Create a payment intent
     * @param amount The amount to charge in cents
     * @param currency The currency to use
     * @return The created payment intent
     * @throws StripeException If there is an error creating the payment intent
     */
    public PaymentIntent createPaymentIntent(Long amount, String currency) throws StripeException {
        Map<String, Object> params = new HashMap<>();
        params.put("amount", amount);
        params.put("currency", currency);
        params.put("payment_method_types", new String[]{"card"});

        return PaymentIntent.create(params);
    }

    /**
     * Create a payment intent with metadata
     * @param amount The amount to charge in cents
     * @param currency The currency to use
     * @param metadata The metadata to add to the payment intent
     * @return The created payment intent
     * @throws StripeException If there is an error creating the payment intent
     */
    public PaymentIntent createPaymentIntent(Long amount, String currency, Map<String, String> metadata) throws StripeException {
        Map<String, Object> params = new HashMap<>();
        params.put("amount", amount);
        params.put("currency", currency);
        params.put("payment_method_types", new String[]{"card"});

        if (metadata != null && !metadata.isEmpty()) {
            params.put("metadata", metadata);
        }

        return PaymentIntent.create(params);
    }

    /**
     * Create a customer in Stripe
     * @param email The customer's email
     * @param name The customer's name
     * @return The created customer
     * @throws StripeException If there is an error creating the customer
     */
    public Customer createCustomer(String email, String name) throws StripeException {
        Map<String, Object> customerParams = new HashMap<>();
        customerParams.put("email", email);
        customerParams.put("name", name);

        return Customer.create(customerParams);
    }

    /**
     * Create a charge
     * @param amount The amount to charge in cents
     * @param currency The currency to use
     * @param description The description of the charge
     * @param token The token from Stripe.js
     * @return The created charge
     * @throws StripeException If there is an error creating the charge
     */
    public Charge createCharge(Long amount, String currency, String description, String token) throws StripeException {
        Map<String, Object> chargeParams = new HashMap<>();
        chargeParams.put("amount", amount);
        chargeParams.put("currency", currency);
        chargeParams.put("description", description);
        chargeParams.put("source", token);

        return Charge.create(chargeParams);
    }

    /**
     * Update a payment intent with metadata
     * @param paymentIntent The payment intent to update
     * @param metadata The metadata to add to the payment intent
     * @return The updated payment intent
     * @throws StripeException If there is an error updating the payment intent
     */
    public PaymentIntent updatePaymentIntentMetadata(PaymentIntent paymentIntent, Map<String, String> metadata) throws StripeException {
        Map<String, Object> updateParams = new HashMap<>();
        updateParams.put("metadata", metadata);

        return paymentIntent.update(updateParams);
    }

    /**
     * Get the Stripe public key
     * @return The Stripe public key
     */
    public String getPublicKey() {
        return stripeConfig.getStripePublicKey();
    }
}
