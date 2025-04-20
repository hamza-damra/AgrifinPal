/**
 * Admin Main JavaScript
 * Main entry point for the admin panel
 */

// Initialize all modules when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin main module loaded');
    
    // Check if adminApp is available
    if (typeof window.adminApp !== 'undefined') {
        console.log('Admin app is available');
    } else {
        console.warn('Admin app is not available');
    }
});
