/**
 * Emergency Cart Clearer
 * This is a standalone script that focuses solely on clearing the cart after payment
 * It uses the most direct approach possible and includes detailed logging
 */

// Self-executing function to avoid polluting the global namespace
(function() {
    console.log('🚨 Emergency Cart Clearer loaded');

    // Only run on payment success page
    if (window.location.pathname.includes('payment-success')) {
        console.log('🚨 Payment success page detected - Starting emergency cart clearing');

        // Clear cart data from local storage immediately
        clearLocalStorageCart();

        // Make multiple attempts to clear the cart with the server
        emergencyClearCart();
        setTimeout(emergencyClearCart, 1000);  // Try again after 1 second
        setTimeout(emergencyClearCart, 3000);  // Try again after 3 seconds
        setTimeout(emergencyClearCart, 6000);  // Try again after 6 seconds

        // Add event listeners to buttons
        addEventListeners();
    }

    /**
     * Clear cart data from local storage
     */
    function clearLocalStorageCart() {
        console.log('🚨 Clearing cart data from local storage');

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

        // Set flags to indicate cart should be cleared
        localStorage.setItem('cart_cleared', 'true');
        localStorage.setItem('payment_completed', 'true');
        sessionStorage.setItem('force_refresh', 'true');

        // Update cart count in UI
        updateCartCountUI();

        console.log('🚨 Cart data cleared from local storage');
    }

    /**
     * Emergency cart clear - uses the most direct approach possible
     */
    function emergencyClearCart() {
        console.log('🚨 Attempting emergency cart clear');

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('🚨 No authentication token found');
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
            console.log('🚨 Cart cleared successfully:', result);

            // Clear local storage again to be sure
            clearLocalStorageCart();

            // Update cart count in UI
            updateCartCountUI();
        })
        .catch(error => {
            console.error('🚨 Error clearing cart:', error);
        });
    }

    /**
     * Add event listeners to buttons
     */
    function addEventListeners() {
        console.log('🚨 Adding event listeners to buttons');

        // Add event listener for "Continue Shopping" button
        const continueShoppingBtn = document.getElementById('continue-shopping');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function(event) {
                // Prevent default action
                event.preventDefault();

                // Clear cart one more time before redirecting
                emergencyClearCart();

                // Wait a moment to ensure the request is sent
                setTimeout(() => {
                    window.location.href = '/marketplace';
                }, 500);
            });
        }

        // Add event listener for "View Orders" button
        const viewOrdersBtn = document.getElementById('view-orders');
        if (viewOrdersBtn) {
            viewOrdersBtn.addEventListener('click', function(event) {
                // Prevent default action
                event.preventDefault();

                // Clear cart one more time before redirecting
                emergencyClearCart();

                // Wait a moment to ensure the request is sent
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            });
        }
    }

    /**
     * Update the cart count in the UI
     */
    function updateCartCountUI() {
        console.log('🚨 Updating cart count in UI');

        // If there's a global updateCartCount function, call it with forceRefresh=true
        if (typeof window.updateCartCount === 'function') {
            console.log('🚨 Calling global updateCartCount function with forceRefresh=true');
            window.updateCartCount(true);
            return;
        }

        // Fallback if updateCartCount is not available
        const cartCountElement = document.getElementById('cart-count');
        if (!cartCountElement) {
            console.log('🚨 Cart count element not found');
            return;
        }

        // Set the cart count to 0
        cartCountElement.textContent = '0';

        // Hide the cart count
        cartCountElement.classList.add('hidden');
    }
})();
