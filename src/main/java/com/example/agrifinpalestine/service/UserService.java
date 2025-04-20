package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.dto.LoginRequest;
import com.example.agrifinpalestine.dto.LoginResponse;
import com.example.agrifinpalestine.dto.RegistrationRequest;
import com.example.agrifinpalestine.dto.RegistrationResponse;

public interface UserService {
    /**
     * Authenticate a user with username and password
     * @param loginRequest containing username and password
     * @return LoginResponse with JWT token if authentication is successful
     */
    LoginResponse authenticateUser(LoginRequest loginRequest);

    /**
     * Register a new user
     * @param registrationRequest containing user details
     * @return RegistrationResponse with user details if registration is successful
     */
    RegistrationResponse registerUser(RegistrationRequest registrationRequest);
}
