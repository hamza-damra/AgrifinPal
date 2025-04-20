package com.example.agrifinpalestine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private Integer id;
    private Integer userId;
    private String name;
    private String description;
    private String logo;
    private String banner;
    private String location;
    private String contactInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
