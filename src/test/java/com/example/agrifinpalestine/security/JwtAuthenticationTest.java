package com.example.agrifinpalestine.security;

import com.example.agrifinpalestine.dto.LoginRequest;
import com.example.agrifinpalestine.dto.LoginResponse;
import com.example.agrifinpalestine.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class JwtAuthenticationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    public void testPublicEndpoint() throws Exception {
        mockMvc.perform(get("/api/test/all"))
                .andExpect(status().isOk());
    }

    @Test
    public void testProtectedEndpointWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/test/user"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLoginSuccess() throws Exception {
        // Mock the authentication service
        LoginResponse mockResponse = LoginResponse.builder()
                .userId(1)
                .username("testuser")
                .email("test@example.com")
                .fullName("Test User")
                .roles(Collections.singletonList("ROLE_USER"))
                .token("test-jwt-token")
                .tokenType("Bearer")
                .message("Login successful")
                .success(true)
                .build();

        when(userService.authenticateUser(any(LoginRequest.class))).thenReturn(mockResponse);

        // Perform login request
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testuser\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.token").value("test-jwt-token"));
    }

    @Test
    public void testLoginFailure() throws Exception {
        // Mock the authentication service
        LoginResponse mockResponse = LoginResponse.builder()
                .message("Invalid username or password")
                .success(false)
                .build();

        when(userService.authenticateUser(any(LoginRequest.class))).thenReturn(mockResponse);

        // Perform login request
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"wronguser\",\"password\":\"wrongpass\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
