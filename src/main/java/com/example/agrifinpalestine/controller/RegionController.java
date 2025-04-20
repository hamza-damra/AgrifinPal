package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/regions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RegionController {

    private final UserRepository userRepository;

    @Autowired
    public RegionController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Get all distinct regions from users who have stores
     * 
     * @return List of regions
     */
    @GetMapping("/stores")
    public ResponseEntity<List<Map<String, String>>> getRegionsWithStores() {
        List<String> regions = userRepository.findDistinctRegionsWithStores();
        
        // Convert to a format that matches what the frontend expects
        List<Map<String, String>> formattedRegions = regions.stream()
                .map(region -> Map.of(
                        "id", region.toLowerCase().replace(" ", "-"),
                        "name", region
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(formattedRegions);
    }

    /**
     * Get all distinct regions from all users
     * 
     * @return List of regions
     */
    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getAllRegions() {
        List<String> regions = userRepository.findDistinctRegions();
        
        // Convert to a format that matches what the frontend expects
        List<Map<String, String>> formattedRegions = regions.stream()
                .map(region -> Map.of(
                        "id", region.toLowerCase().replace(" ", "-"),
                        "name", region
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(formattedRegions);
    }
}
