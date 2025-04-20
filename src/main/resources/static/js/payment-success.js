/**
 * Payment Success Page JavaScript
 * Handles UI updates for the payment success page
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment success page loaded');

    // Get order ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const paymentIntentId = urlParams.get('paymentIntentId');

    console.log('Order ID from URL:', orderId);
    console.log('Payment Intent ID from URL:', paymentIntentId);

    // Update UI with order details if available
    if (orderId) {
        const orderIdElement = document.getElementById('order-id');
        if (orderIdElement) {
            orderIdElement.textContent = orderId;
        }
    }

    // Store the order ID in localStorage for future reference
    if (orderId) {
        localStorage.setItem('last_order_id', orderId);
    }

    // Set payment completed flag
    localStorage.setItem('payment_completed', 'true');

    // Update cart count in UI
    updateCartCountUI();
});

/**
 * Update the cart count in the UI
 */
function updateCartCountUI() {
    console.log('Updating cart count in UI');

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
