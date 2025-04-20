package com.example.agrifinpalestine.service;

import com.example.agrifinpalestine.Entity.UserMessage;
import com.example.agrifinpalestine.dto.UserMessageRequest;
import com.example.agrifinpalestine.dto.UserMessageResponse;

import java.util.List;

public interface UserMessageService {
    
    /**
     * Save a new message from a user
     * @param messageRequest containing message details
     * @return UserMessageResponse with message details
     */
    UserMessageResponse saveMessage(UserMessageRequest messageRequest);
    
    /**
     * Get a message by its ID
     * @param messageId the ID of the message
     * @return UserMessageResponse with message details
     */
    UserMessageResponse getMessageById(Integer messageId);
    
    /**
     * Get all messages
     * @return List of UserMessageResponse objects
     */
    List<UserMessageResponse> getAllMessages();
    
    /**
     * Get messages by status
     * @param status the status to filter by
     * @return List of UserMessageResponse objects
     */
    List<UserMessageResponse> getMessagesByStatus(String status);
    
    /**
     * Update the status of a message
     * @param messageId the ID of the message
     * @param status the new status
     * @return UserMessageResponse with updated message details
     */
    UserMessageResponse updateMessageStatus(Integer messageId, String status);
}
