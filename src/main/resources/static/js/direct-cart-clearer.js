/**
 * Direct Cart Clearer - A simple utility to ensure cart is cleared after payment
 * This script uses the most direct approach possible to clear the cart
 */

// Execute immediately when loaded
(function() {
    console.log('Direct Cart Clearer loaded');
    
    // Only run on the payment success page
    if (window.location.pathname.includes('payment-success')) {
        console.log('Payment success page detected - Starting direct cart clearing process');
        
        // Clear cart data from local storage immediately
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
        localStorage.removeItem('cart_count');
        sessionStorage.removeItem('cart_items');
        sessionStorage.removeItem('cart_count');
        
        // Set flag to indicate cart should be cleared
        localStorage.setItem('cart_cleared', 'true');
        
        // Make multiple attempts to clear the cart
        directClearCart();
        setTimeout(directClearCart, 1000);  // Try again after 1 second
        setTimeout(directClearCart, 3000);  // Try again after 3 seconds
        setTimeout(directClearCart, 6000);  // Try again after 6 seconds
    }
})();

/**
 * Directly clear the cart using the simplest possible approach
 */
function directClearCart() {
    console.log('Attempting direct cart clear');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found');
        return;
    }
    
    // Make a direct call to the cart clear endpoint
    fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Failed to clear cart: ${response.status} ${response.statusText}`);
        }
    })
    .then(result => {
        console.log('Cart cleared successfully:', result);
        
        // Try the native SQL endpoint as well for extra reliability
        return fetch('/api/cart/clear-after-payment', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Failed to clear cart with native SQL: ${response.status} ${response.statusText}`);
        }
    })
    .then(result => {
        console.log('Cart cleared with native SQL successfully:', result);
    })
    .catch(error => {
        console.error('Error clearing cart:', error);
    });
}
