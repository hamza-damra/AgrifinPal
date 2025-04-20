package com.example.agrifinpalestine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collection;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private Collection<String> roles;
    private String token;
    private String tokenType;
    private String message;
    private boolean success;
}
