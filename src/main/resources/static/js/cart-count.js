/**
 * Cart Count Updater
 * This file contains the updateCartCount function extracted from marketplace.js
 * to make it available on all pages that need cart functionality.
 */

/**
 * Update the cart count in the header
 * @param {boolean} forceRefresh - Whether to force a refresh by bypassing cache
 */
async function updateCartCount(forceRefresh = false) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, hide cart count
        if (!token) {
            document.getElementById('cart-count').classList.add('hidden');
            return;
        }

        try {
            // Make API call to get cart items
            const headers = {
                'Authorization': 'Bearer ' + token
            };

            // Add cache-busting parameter if forcing refresh
            const url = forceRefresh ?
                `/api/cart?_=${new Date().getTime()}` :
                '/api/cart';

            // If forcing refresh, add cache control headers
            if (forceRefresh) {
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
                headers['Expires'] = '0';
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            // Parse response
            if (response.ok) {
                const data = await response.json();
                const cartCount = Array.isArray(data) ? data.length : 0;

                console.log(`Cart count: ${cartCount}${forceRefresh ? ' (forced refresh)' : ''}`);

                // Update cart count
                const cartCountElement = document.getElementById('cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = cartCount;

                    // Show/hide cart count
                    if (cartCount > 0) {
                        cartCountElement.classList.remove('hidden');
                    } else {
                        cartCountElement.classList.add('hidden');
                    }
                }

                // Update any in-cart buttons if we have product cards on the page
                if (forceRefresh && typeof updateProductButtonsAfterCartChange === 'function') {
                    updateProductButtonsAfterCartChange(data);
                }
            } else {
                console.log(`Failed to get cart count, status: ${response.status}`);
                // Hide cart count on error
                const cartCountElement = document.getElementById('cart-count');
                if (cartCountElement) {
                    cartCountElement.classList.add('hidden');
                }
            }
        } catch (fetchError) {
            console.error('Error fetching cart count:', fetchError);
            // Hide cart count on error
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                cartCountElement.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        // Hide cart count on error
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.classList.add('hidden');
        }
    }
}

// Make the function globally accessible
window.updateCartCount = updateCartCount;