package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.Entity.Product;
import com.example.agrifinpalestine.Entity.Review;
import com.example.agrifinpalestine.Entity.User;
import com.example.agrifinpalestine.Repository.ProductRepository;
import com.example.agrifinpalestine.Repository.ReviewRepository;
import com.example.agrifinpalestine.Repository.UserRepository;
import com.example.agrifinpalestine.dto.ReviewRequest;
import com.example.agrifinpalestine.dto.ReviewResponse;
import com.example.agrifinpalestine.exception.auth.UnauthorizedAccessException;
import com.example.agrifinpalestine.security.RoleBasedAccessControl;
import com.example.agrifinpalestine.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@Validated
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Autowired
    public ReviewController(ReviewRepository reviewRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get all reviews for a specific product
     *
     * @param productId the ID of the product
     * @return list of reviews for the product
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByProduct(@PathVariable @Min(value = 1, message = "Product ID must be positive") Integer productId) {
        List<Review> reviews = reviewRepository.findByProduct_ProductId(productId);

        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(reviewResponses);
    }

    /**
     * Get all reviews by a specific user
     *
     * @param userId the ID of the user
     * @return list of reviews by the user
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(@PathVariable @Min(value = 1, message = "User ID must be positive") Integer userId) {
        List<Review> reviews = reviewRepository.findByUser_UserId(userId);

        List<ReviewResponse> reviewResponses = reviews.stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(reviewResponses);
    }

    /**
     * Create a new review
     *
     * @param reviewRequest the review request containing productId, rating, and comment
     * @return the created review
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createReview(@Valid @RequestBody ReviewRequest reviewRequest) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Check if product exists
            Optional<Product> productOptional = productRepository.findById(reviewRequest.getProductId());
            if (productOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Product not found with ID: " + reviewRequest.getProductId());
            }

            // Check if user exists
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found with ID: " + userId);
            }

            // Validate rating (additional validation as a safeguard)
            if (reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Rating must be between 1 and 5");
            }

            // Create new review
            Review review = new Review();
            review.setProduct(productOptional.get());
            review.setUser(userOptional.get());
            review.setRating(reviewRequest.getRating());
            review.setReviewText(reviewRequest.getComment());
            review.setCreatedAt(LocalDateTime.now());

            // Save review
            Review savedReview = reviewRepository.save(review);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(mapToReviewResponse(savedReview));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating review: " + e.getMessage());
        }
    }

    /**
     * Delete a review
     *
     * @param reviewId the ID of the review to delete
     * @return success message
     */
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteReview(@PathVariable @Min(value = 1, message = "Review ID must be positive") Integer reviewId) {
        try {
            // Get the authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            Integer userId = userDetails.getId();

            // Check if review exists
            Optional<Review> reviewOptional = reviewRepository.findById(reviewId);
            if (reviewOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Review not found with ID: " + reviewId);
            }

            // Check if user is the owner of the review or an admin
            Review review = reviewOptional.get();

            try {
                // Use our utility class to check if user is owner or admin
                RoleBasedAccessControl.requireOwnerOrAdmin(review.getUser().getUserId(), "review");
            } catch (UnauthorizedAccessException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(e.getMessage());
            }

            // Delete review
            reviewRepository.delete(review);

            return ResponseEntity.ok("Review deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting review: " + e.getMessage());
        }
    }

    /**
     * Map Review entity to ReviewResponse DTO
     *
     * @param review the Review entity
     * @return ReviewResponse DTO
     */
    private ReviewResponse mapToReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getReviewId())
                .productId(review.getProduct().getProductId())
                .userId(review.getUser().getUserId())
                .userName(review.getUser().getUsername())
                .rating(review.getRating())
                .comment(review.getReviewText())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
