package com.example.agrifinpalestine.Repository;

import com.example.agrifinpalestine.Entity.UserMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMessageRepository extends JpaRepository<UserMessage, Integer> {
    
    // Find messages by status
    List<UserMessage> findByStatus(String status);
    
    // Find messages ordered by creation date (newest first)
    List<UserMessage> findAllByOrderByCreatedAtDesc();
}
