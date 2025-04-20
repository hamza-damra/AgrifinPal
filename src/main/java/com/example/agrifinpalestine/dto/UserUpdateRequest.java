package com.example.agrifinpalestine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateRequest {
    
    @Size(max = 100, message = "Full name must be less than 100 characters")
    private String fullName;
    
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must be less than 100 characters")
    private String email;
    
    @Size(max = 20, message = "Phone number must be less than 20 characters")
    private String phone;
    
    @Size(max = 100, message = "Region must be less than 100 characters")
    private String region;
    
    @Size(max = 100, message = "Agriculture type must be less than 100 characters")
    private String agricultureType;
    
    @Size(max = 500, message = "Bio must be less than 500 characters")
    private String bio;
    
    @Size(max = 500, message = "Profile image URL must be less than 500 characters")
    private String profileImage;
}
