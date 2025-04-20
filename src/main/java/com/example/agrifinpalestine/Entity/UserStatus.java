package com.example.agrifinpalestine.Entity;

/**
 * Enum representing the status of a user in the system
 */
public enum UserStatus {
    /**
     * Active user with full access to their account
     */
    ACTIVE,
    
    /**
     * Pending user who has registered but not yet verified their account
     */
    PENDING,
    
    /**
     * Suspended user who has temporarily lost access to their account
     */
    SUSPENDED,
    
    /**
     * Inactive user who has been deactivated but not deleted
     */
    INACTIVE,
    
    /**
     * Banned user who has permanently lost access to their account
     */
    BANNED
}
