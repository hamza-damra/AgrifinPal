/**
 * Global Cart Clearer
 * This script is included on all pages and checks if the cart should be cleared
 * It runs on every page load to ensure the cart is cleared after payment
 */

// Self-executing function to avoid polluting the global namespace
(function() {
    // Check if payment was completed
    const paymentCompleted = localStorage.getItem('payment_completed') === 'true';

    // If payment was completed, clear the cart
    if (paymentCompleted) {
        console.log('🌎 Payment was completed - Clearing cart globally');

        // Clear cart data from local storage
        clearLocalStorageCart();

        // Clear cart on the server
        clearServerCart();

        // Update the cart count in the UI
        updateCartCountUI();

        // Clear the payment completed flag after a delay
        setTimeout(() => {
            localStorage.removeItem('payment_completed');
            console.log('🌎 Cleared payment_completed flag');

            // Update the cart count again after a delay
            updateCartCountUI();
        }, 5000);
    }

    /**
     * Clear cart data from local storage
     */
    function clearLocalStorageCart() {
        console.log('🌎 Clearing cart data from local storage');

        // Clear all cart-related data from localStorage
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
        localStorage.removeItem('cart_count');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartCount');

        // Clear all cart-related data from sessionStorage
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('cart_items');
        sessionStorage.removeItem('cart_count');
        sessionStorage.removeItem('cartItems');
        sessionStorage.removeItem('cartCount');

        // Set force refresh flag
        sessionStorage.setItem('force_refresh', 'true');

        console.log('🌎 Cart data cleared from local storage');
    }

    /**
     * Clear cart on the server
     */
    function clearServerCart() {
        console.log('🌎 Clearing cart on the server');

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('🌎 No authentication token found');
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
            console.log('🌎 Cart cleared successfully on the server:', result);
        })
        .catch(error => {
            console.error('🌎 Error clearing cart on the server:', error);
        });
    }

    /**
     * Update the cart count in the UI
     */
    function updateCartCountUI() {
        console.log('🌎 Updating cart count in UI');

        // If there's a global updateCartCount function, call it with forceRefresh=true
        if (typeof window.updateCartCount === 'function') {
            console.log('🌎 Calling global updateCartCount function with forceRefresh=true');
            window.updateCartCount(true);
            return;
        }

        // Fallback if updateCartCount is not available
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) {
            console.log('🌎 Cart count element not found');
            return;
        }

        // Set the cart count to 0
        cartCountElement.textContent = '0';

        // Hide the cart count
        cartCountElement.classList.add('hidden');
    }
})();
