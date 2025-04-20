/**
 * Cart API functions
 * This file contains functions for interacting with the cart API
 */

/**
 * Add a product to the cart
 * @param {number} productId - The ID of the product to add
 * @param {number} quantity - The quantity to add
 * @returns {Promise<Object>} - The response from the API
 */
async function addProductToCart(productId, quantity) {
    try {
        console.log(`Adding product ${productId} to cart with quantity ${quantity}`);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, show login required modal if available, otherwise redirect to login
        if (!token) {
            console.log('No token found, showing login modal or redirecting');

            // Check if we're on a page with the login modal
            if (window.showLoginRequiredModal && typeof window.showLoginRequiredModal === 'function') {
                window.showLoginRequiredModal();
            } else {
                // Fallback to redirect
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            }

            return { success: false, message: 'Authentication required' };
        }

        // First try the force-add endpoint
        try {
            console.log('Making API call to /api/cart/force-add');
            const forceResponse = await fetch('/api/cart/force-add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity
                })
            });

            if (forceResponse.ok) {
                const forceData = await forceResponse.json();
                console.log('Force add successful:', forceData);
                return {
                    success: true,
                    data: forceData
                };
            } else {
                console.warn('Force add failed, falling back to regular add');
            }
        } catch (forceError) {
            console.error('Error with force add:', forceError);
        }

        // Fall back to the regular add endpoint
        console.log('Making API call to /api/cart/add');
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                productId: productId,
                quantity: quantity
            })
        });

        console.log('API response status:', response.status);

        // Parse response
        if (response.ok) {
            const data = await response.json();
            console.log('Product added to cart successfully:', data);
            return {
                success: true,
                data: data
            };
        } else {
            console.log('Failed to add product to cart, status:', response.status);

            // Handle unauthorized (401) responses
            if (response.status === 401) {
                console.log('Unauthorized access, user needs to login');

                // Check if we're on a page with the login modal
                if (window.showLoginRequiredModal && typeof window.showLoginRequiredModal === 'function') {
                    window.showLoginRequiredModal();
                } else {
                    // Fallback to redirect
                    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                }

                return {
                    success: false,
                    status: 401,
                    message: 'Authentication required'
                };
            }

            try {
                const errorData = await response.json();
                console.log('Error data:', errorData);

                // Check if this is a ProductAlreadyInCartException
                if (response.status === 400 && errorData.message && errorData.message.includes('already in cart')) {
                    console.log('Product already in cart, returning existing item data');

                    return {
                        success: false,
                        status: response.status,
                        message: errorData.message || 'Product already in cart',
                        errorData: errorData,
                        productAlreadyInCart: true,
                        existingItem: errorData.data
                    };
                }

                return {
                    success: false,
                    status: response.status,
                    message: errorData.message || 'Failed to add product to cart',
                    errorData: errorData
                };
            } catch (jsonError) {
                console.log('Error parsing JSON response:', jsonError);
                return {
                    success: false,
                    status: response.status,
                    message: `Failed to add product to cart (Status: ${response.status})`
                };
            }
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return {
            success: false,
            message: 'An error occurred while adding the product to cart: ' + error.message
        };
    }
}

/**
 * Update the quantity of a cart item
 * @param {number} cartItemId - The ID of the cart item to update
 * @param {number} quantity - The new quantity
 * @returns {Promise<Object>} - The response from the API
 */
async function updateCartItemQuantity(cartItemId, quantity) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, redirect to login
        if (!token) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            return { success: false, message: 'Authentication required' };
        }

        // Make API call
        const response = await fetch(`/api/cart/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                quantity: quantity
            })
        });

        // Parse response
        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json();
            return {
                success: false,
                message: errorData.message || 'Failed to update cart item'
            };
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        return {
            success: false,
            message: 'An error occurred while updating the cart item'
        };
    }
}

/**
 * Remove a cart item
 * @param {number} cartItemId - The ID of the cart item to remove
 * @returns {Promise<Object>} - The response from the API
 */
async function removeCartItem(cartItemId) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, redirect to login
        if (!token) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            return { success: false, message: 'Authentication required' };
        }

        // Make API call
        const response = await fetch(`/api/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // Parse response
        if (response.ok) {
            return { success: true };
        } else {
            const errorData = await response.json();
            return {
                success: false,
                message: errorData.message || 'Failed to remove cart item'
            };
        }
    } catch (error) {
        console.error('Error removing cart item:', error);
        return {
            success: false,
            message: 'An error occurred while removing the cart item'
        };
    }
}

/**
 * Get cart items
 * @param {boolean} forceRefresh - Whether to force a refresh by bypassing cache
 * @returns {Promise<Object>} - The response from the API
 */
async function getCartItems(forceRefresh = false) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, show login modal if available, otherwise redirect to login
        if (!token) {
            // Check if we're on a page with the login modal
            if (window.showLoginRequiredModal && typeof window.showLoginRequiredModal === 'function') {
                window.showLoginRequiredModal();
            } else {
                // Fallback to redirect
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            }
            return { success: false, message: 'Authentication required' };
        }

        // Set up headers
        const headers = {
            'Authorization': 'Bearer ' + token
        };

        // Add cache control headers if forcing refresh
        if (forceRefresh) {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = '0';
        }

        // Add cache-busting parameter if forcing refresh
        const url = forceRefresh ?
            `/api/cart?_=${new Date().getTime()}` :
            '/api/cart';

        console.log(`Getting cart items${forceRefresh ? ' (forced refresh)' : ''}`);

        // Make API call
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        // Parse response
        if (response.ok) {
            const data = await response.json();
            return { success: true, data: data };
        } else {
            const errorData = await response.json();
            return {
                success: false,
                message: errorData.message || 'Failed to get cart items'
            };
        }
    } catch (error) {
        console.error('Error getting cart items:', error);
        return {
            success: false,
            message: 'An error occurred while getting cart items'
        };
    }
}

/**
 * Check if a product is already in the cart
 * @param {number} productId - The ID of the product to check
 * @param {boolean} forceRefresh - Whether to force a refresh by bypassing cache
 * @returns {Promise<Object>} - The response with cart item details if found
 */
async function checkProductInCart(productId, forceRefresh = false) {
    try {
        console.log(`Checking if product ${productId} is in cart${forceRefresh ? ' (forced refresh)' : ''}`);

        // Get all cart items
        const cartResult = await getCartItems(forceRefresh);

        if (!cartResult.success) {
            return {
                success: false,
                inCart: false,
                message: cartResult.message || 'Failed to check cart'
            };
        }

        // Find the product in the cart - ensure we're comparing numbers, not strings
        const productIdNum = parseInt(productId, 10);
        const cartItem = cartResult.data.find(item => {
            const itemProductId = parseInt(item.productId, 10);
            return itemProductId === productIdNum;
        });

        if (cartItem) {
            console.log(`Product ${productId} found in cart with quantity ${cartItem.quantity}`);
            return {
                success: true,
                inCart: true,
                cartItem: cartItem
            };
        } else {
            console.log(`Product ${productId} not found in cart`);
            return {
                success: true,
                inCart: false
            };
        }
    } catch (error) {
        console.error('Error checking product in cart:', error);
        return {
            success: false,
            inCart: false,
            message: 'An error occurred while checking the product in cart: ' + error.message
        };
    }
}

/**
 * Clear all items from the cart
 * @param {number} orderId - Optional order ID for comprehensive cart clearing
 * @param {boolean} forceMode - Whether to use force mode for clearing
 * @returns {Promise<Object>} - The response from the API
 */
async function clearCart(orderId = null, forceMode = false) {
    try {
        console.log('Clearing cart' + (orderId ? ` with orderId: ${orderId}` : ''));

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, show login modal if available, otherwise redirect to login
        if (!token) {
            console.log('No token found, showing login modal or redirecting');

            // Check if we're on a page with the login modal
            if (window.showLoginRequiredModal && typeof window.showLoginRequiredModal === 'function') {
                window.showLoginRequiredModal();
            } else {
                // Fallback to redirect
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            }

            return { success: false, message: 'Authentication required' };
        }

        // Try force mode first if enabled
        if (forceMode) {
            try {
                console.log('Using force mode for cart clearing');
                const forceResponse = await fetch('/api/cart/force-clear', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (forceResponse.ok) {
                    const forceResult = await forceResponse.json();
                    console.log('Force mode cart clearing successful:', forceResult);

                    // Clear cart count in localStorage
                    localStorage.removeItem('cart_count');
                    localStorage.removeItem('cartCount');

                    // Update cart count in UI if possible
                    updateCartCountInUI();

                    return {
                        success: true,
                        data: forceResult,
                        forceMode: true
                    };
                } else {
                    console.warn(`Force mode cart clearing failed: ${forceResponse.status}`);
                }
            } catch (forceError) {
                console.error('Error with force mode cart clearing:', forceError);
            }
        }

        // Try the comprehensive endpoint if we have an order ID
        if (orderId) {
            try {
                console.log(`Using comprehensive cart clearing with orderId: ${orderId}`);
                const comprehensiveResponse = await fetch(`/api/cart/clear-after-payment?orderId=${orderId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                });

                if (comprehensiveResponse.ok) {
                    const comprehensiveResult = await comprehensiveResponse.json();
                    console.log('Comprehensive cart clearing successful:', comprehensiveResult);

                    // Clear cart count in localStorage
                    localStorage.removeItem('cart_count');
                    localStorage.removeItem('cartCount');

                    // Update cart count in UI if possible
                    updateCartCountInUI();

                    return {
                        success: true,
                        data: comprehensiveResult,
                        comprehensive: true
                    };
                } else {
                    console.warn(`Comprehensive cart clearing failed: ${comprehensiveResponse.status}`);
                }
            } catch (comprehensiveError) {
                console.error('Error with comprehensive cart clearing:', comprehensiveError);
            }
        }

        // Fall back to the regular clear endpoint
        const response = await fetch('/api/cart/clear', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // Parse response
        if (response.ok) {
            console.log('Cart cleared successfully');

            // Clear cart count in localStorage
            localStorage.removeItem('cart_count');
            localStorage.removeItem('cartCount');

            // Update cart count in UI if possible
            updateCartCountInUI();

            return { success: true };
        } else {
            console.log('Failed to clear cart, status:', response.status);
            try {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                return {
                    success: false,
                    status: response.status,
                    message: errorData.message || 'Failed to clear cart',
                    errorData: errorData
                };
            } catch (jsonError) {
                console.log('Error parsing JSON response:', jsonError);
                return {
                    success: false,
                    status: response.status,
                    message: `Failed to clear cart (Status: ${response.status})`
                };
            }
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        return {
            success: false,
            message: 'An error occurred while clearing the cart: ' + error.message
        };
    }
}

/**
 * Update the cart count in the UI
 */
function updateCartCountInUI() {
    console.log('Updating cart count in UI from cart-api.js');

    // If there's a global updateCartCount function, call it with forceRefresh=true
    if (typeof window.updateCartCount === 'function') {
        console.log('Calling global updateCartCount function with forceRefresh=true');
        window.updateCartCount(true);
        return;
    }

    // Fallback if updateCartCount is not available
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) {
        console.log('Cart count element not found');
        return;
    }

    // Set the cart count to 0
    cartCountElement.textContent = '0';

    // Hide the cart count
    cartCountElement.classList.add('hidden');
}