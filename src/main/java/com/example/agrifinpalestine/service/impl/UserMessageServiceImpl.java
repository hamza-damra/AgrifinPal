package com.example.agrifinpalestine.service.impl;

import com.example.agrifinpalestine.Entity.UserMessage;
import com.example.agrifinpalestine.Repository.UserMessageRepository;
import com.example.agrifinpalestine.dto.UserMessageRequest;
import com.example.agrifinpalestine.dto.UserMessageResponse;
import com.example.agrifinpalestine.service.UserMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserMessageServiceImpl implements UserMessageService {

    private static final Logger logger = LoggerFactory.getLogger(UserMessageServiceImpl.class);
    
    private final UserMessageRepository userMessageRepository;
    
    @Autowired
    public UserMessageServiceImpl(UserMessageRepository userMessageRepository) {
        this.userMessageRepository = userMessageRepository;
    }
    
    @Override
    @Transactional
    public UserMessageResponse saveMessage(UserMessageRequest messageRequest) {
        try {
            // Create new message
            UserMessage message = new UserMessage();
            message.setName(messageRequest.getName());
            message.setEmail(messageRequest.getEmail());
            message.setMessage(messageRequest.getMessage());
            message.setStatus("NEW"); // Default status for new messages
            message.setCreatedAt(LocalDateTime.now());
            message.setUpdatedAt(LocalDateTime.now());
            
            // Save message to database
            UserMessage savedMessage = userMessageRepository.save(message);
            
            // Return response
            return mapToUserMessageResponse(savedMessage);
        } catch (Exception e) {
            logger.error("Error saving message: {}", e.getMessage());
            throw new RuntimeException("Error saving message", e);
        }
    }
    
    @Override
    public UserMessageResponse getMessageById(Integer messageId) {
        UserMessage message = userMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found with id: " + messageId));
        
        return mapToUserMessageResponse(message);
    }
    
    @Override
    public List<UserMessageResponse> getAllMessages() {
        List<UserMessage> messages = userMessageRepository.findAllByOrderByCreatedAtDesc();
        
        return messages.stream()
                .map(this::mapToUserMessageResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserMessageResponse> getMessagesByStatus(String status) {
        List<UserMessage> messages = userMessageRepository.findByStatus(status);
        
        return messages.stream()
                .map(this::mapToUserMessageResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public UserMessageResponse updateMessageStatus(Integer messageId, String status) {
        UserMessage message = userMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found with id: " + messageId));
        
        message.setStatus(status);
        message.setUpdatedAt(LocalDateTime.now());
        
        UserMessage updatedMessage = userMessageRepository.save(message);
        
        return mapToUserMessageResponse(updatedMessage);
    }
    
    /**
     * Map UserMessage entity to UserMessageResponse DTO
     * @param message the UserMessage entity
     * @return UserMessageResponse DTO
     */
    private UserMessageResponse mapToUserMessageResponse(UserMessage message) {
        return UserMessageResponse.builder()
                .messageId(message.getMessageId())
                .name(message.getName())
                .email(message.getEmail())
                .message(message.getMessage())
                .status(message.getStatus())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}
