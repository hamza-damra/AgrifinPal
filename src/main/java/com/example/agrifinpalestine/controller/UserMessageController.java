package com.example.agrifinpalestine.controller;

import com.example.agrifinpalestine.dto.UserMessageRequest;
import com.example.agrifinpalestine.dto.UserMessageResponse;
import com.example.agrifinpalestine.service.UserMessageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserMessageController {

    private final UserMessageService userMessageService;

    @Autowired
    public UserMessageController(UserMessageService userMessageService) {
        this.userMessageService = userMessageService;
    }

    /**
     * Submit a new message from the contact form
     * 
     * @param messageRequest the message details
     * @return response with success message
     */
    @PostMapping
    public ResponseEntity<?> submitMessage(@Valid @RequestBody UserMessageRequest messageRequest) {
        try {
            UserMessageResponse savedMessage = userMessageService.saveMessage(messageRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Your message has been sent successfully!");
            response.put("messageId", savedMessage.getMessageId());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error sending message: " + e.getMessage());
            
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Get all messages (admin only)
     * 
     * @return list of all messages
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserMessageResponse>> getAllMessages() {
        List<UserMessageResponse> messages = userMessageService.getAllMessages();
        return ResponseEntity.ok(messages);
    }

    /**
     * Get messages by status (admin only)
     * 
     * @param status the status to filter by
     * @return list of messages with the specified status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserMessageResponse>> getMessagesByStatus(@PathVariable String status) {
        List<UserMessageResponse> messages = userMessageService.getMessagesByStatus(status);
        return ResponseEntity.ok(messages);
    }

    /**
     * Get a message by ID (admin only)
     * 
     * @param messageId the ID of the message
     * @return the message with the specified ID
     */
    @GetMapping("/{messageId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserMessageResponse> getMessageById(@PathVariable Integer messageId) {
        try {
            UserMessageResponse message = userMessageService.getMessageById(messageId);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Update the status of a message (admin only)
     * 
     * @param messageId the ID of the message
     * @param status the new status
     * @return the updated message
     */
    @PutMapping("/{messageId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateMessageStatus(
            @PathVariable Integer messageId,
            @RequestParam String status) {
        try {
            UserMessageResponse updatedMessage = userMessageService.updateMessageStatus(messageId, status);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Message status updated successfully");
            response.put("data", updatedMessage);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating message status: " + e.getMessage());
            
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }
}
