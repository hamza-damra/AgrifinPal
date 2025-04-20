/**
 * Cart Clearer - A dedicated utility to ensure cart is cleared after payment
 * This script focuses solely on clearing the cart with multiple retries
 */

// Execute immediately when loaded
(function() {
    console.log('Cart Clearer loaded - Will check if cart clearing is needed');

    // Only run on the payment success page, not on the checkout page
    const isPaymentSuccessPage = window.location.pathname.includes('payment-success');
    const isCheckoutPage = window.location.pathname.includes('checkout');

    // Don't run on checkout page to avoid interfering with payment process
    if (isCheckoutPage) {
        console.log('On checkout page - Not clearing cart to avoid interfering with payment');
        return;
    }

    // Only clear cart on payment success page
    if (isPaymentSuccessPage) {
        console.log('Payment success detected - Starting cart clearing process');
        clearCartAfterPayment();
    }
})();

/**
 * Clear the cart after payment with multiple retries
 */
async function clearCartAfterPayment() {
    // Clear cart data from local storage immediately
    localStorage.removeItem('cart');
    localStorage.removeItem('cart_items');
    localStorage.removeItem('cart_count');
    sessionStorage.removeItem('cart_items');
    sessionStorage.removeItem('cart_count');

    // Set flag to indicate cart should be cleared
    localStorage.setItem('cart_cleared', 'true');

    // Get order ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
        localStorage.setItem('last_order_id', orderId);
    }

    // Make multiple attempts to clear the cart
    await attemptClearCart();

    // Schedule additional attempts with delays
    setTimeout(attemptClearCart, 2000);  // Try again after 2 seconds
    setTimeout(attemptClearCart, 5000);  // Try again after 5 seconds
    setTimeout(attemptClearCart, 10000); // Try again after 10 seconds
}

/**
 * Attempt to clear the cart with the simplest possible approach
 */
async function attemptClearCart() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No authentication token found');
            return;
        }

        console.log('Attempting to clear cart');

        // Make a direct call to the cart clear endpoint
        const response = await fetch('/api/cart/clear', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Cart cleared successfully:', result);
            return true;
        } else {
            console.warn('Failed to clear cart:', response.status, response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        return false;
    }
}
