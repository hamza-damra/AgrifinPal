/**
 * Enhanced Cart Page Functionality
 *
 * This script handles all cart-related functionality including:
 * - Loading and displaying cart items
 * - Updating item quantities
 * - Removing items from the cart
 * - Clearing the entire cart
 * - Calculating totals
 * - Handling user interactions
 *
 * UPDATED: Added direct SQL approach to ensure cart items are properly saved to the database
 */

// Global variables
let cartItems = [];
let currentItemId = null;
let isUpdating = false;
let updateQueue = {};
let updateTimeout = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're coming from a successful payment
    const cartCleared = localStorage.getItem('cart_cleared');
    if (cartCleared === 'true') {
        console.log('Cart was cleared after payment, refreshing cart data');
        // Clear the flag
        localStorage.removeItem('cart_cleared');
        // Force refresh cart data
        loadCart(true);
    }

    // Initialize tooltips
    initTooltips();

    // Load cart items
    loadCart();

    // Set up event listeners for the confirmation modals
    document.getElementById('cancel-remove').addEventListener('click', closeRemoveModal);
    document.getElementById('confirm-remove').addEventListener('click', confirmRemoveItem);

    document.getElementById('cancel-clear').addEventListener('click', closeClearModal);
    document.getElementById('confirm-clear').addEventListener('click', confirmClearCart);

    // Set up event listeners for cart actions
    document.getElementById('update-cart-btn').addEventListener('click', updateAllCartItems);
    document.getElementById('clear-cart-btn').addEventListener('click', showClearCartConfirmation);

    // Add scroll animation for "Back to top" button
    window.addEventListener('scroll', toggleBackToTopButton);

    // Check if back-to-top button exists before adding event listener
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTop);
    }

    // Add animation class to Tailwind
    if (!document.getElementById('animation-styles')) {
        const style = document.createElement('style');
        style.id = 'animation-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
                animation: fadeIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
});

/**
 * Load cart items from the API
 * @param {boolean} showLoading - Whether to show the loading indicator
 * @param {boolean} forceRefresh - Whether to force a refresh by bypassing cache
 */
async function loadCart(showLoading = true, forceRefresh = false) {
    try {
        // Only show loading state if requested (skip during quantity updates)
        if (showLoading) {
            document.getElementById('cart-loading').classList.remove('hidden');
            document.getElementById('cart-empty').classList.add('hidden');
            document.getElementById('cart-items').classList.add('hidden');
        }

        // Get cart items with force refresh option
        const result = await getCartItems(forceRefresh);

        // Hide loading state
        document.getElementById('cart-loading').classList.add('hidden');

        if (!result.success) {
            throw new Error(result.message || 'Failed to load cart');
        }

        // Store cart items globally
        cartItems = result.data;
        console.log(`Loaded ${cartItems.length} cart items${forceRefresh ? ' (forced refresh)' : ''}`);

        if (!cartItems || cartItems.length === 0) {
            // Show empty cart message
            document.getElementById('cart-empty').classList.remove('hidden');
            document.getElementById('cart-items').classList.add('hidden');

            // If this was a forced refresh and cart is empty, show a notification
            if (forceRefresh) {
                showNotification('Your cart is empty');
            }
        } else {
            // Show cart items
            document.getElementById('cart-empty').classList.add('hidden');
            document.getElementById('cart-items').classList.remove('hidden');
            renderCartItems(cartItems);

            // If this was a forced refresh, show a notification
            if (forceRefresh) {
                showNotification('Cart refreshed successfully');
            }
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('cart-loading').classList.add('hidden');
        document.getElementById('cart-empty').classList.remove('hidden');

        // Show error notification
        showNotification('Error loading cart: ' + error.message, 'error');
    }
}

/**
 * Render cart items in the table with enhanced UI
 */
function renderCartItems(items) {
    const cartTableBody = document.getElementById('cart-table-body');
    cartTableBody.innerHTML = '';

    let total = 0;
    let totalItems = 0;

    items.forEach(item => {
        const subtotal = item.productPrice * item.quantity;
        total += subtotal;
        totalItems += item.quantity;

        const row = document.createElement('tr');
        row.className = 'cart-item-row hover:bg-gray-50 transition-colors';
        row.dataset.itemId = item.id;
        row.innerHTML = `
            <td class="py-4 px-6 border-b border-gray-200">
                <div class="flex items-center">
                    <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-4 relative group">
                        <img
                            src="${item.productImage || '/images/placeholder.jpg'}"
                            alt="${item.productName}"
                            class="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110">
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
                    </div>
                    <div>
                        <a href="/product/${item.productId}" class="text-base font-medium text-gray-900 hover:text-green-600 transition-colors">${item.productName}</a>
                        <p class="mt-1 text-sm text-gray-500">${item.productDescription ? item.productDescription.substring(0, 60) + (item.productDescription.length > 60 ? '...' : '') : ''}</p>
                        <div class="mt-2 flex items-center text-xs text-gray-500">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                <i class="fas fa-check-circle mr-1"></i> In Stock
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6 border-b border-gray-200 text-center">
                <span class="text-base font-medium text-gray-900">${formatCurrency(item.productPrice)}</span>
            </td>
            <td class="py-4 px-6 border-b border-gray-200">
                <div class="quantity-control">
                    <button
                        class="quantity-btn decrease-btn"
                        onclick="updateQuantity(${item.id}, ${Math.max(1, item.quantity - 1)})"
                        ${item.quantity <= 1 ? 'disabled' : ''}
                        title="Decrease quantity"
                    >
                        <i class="fas fa-minus"></i>
                    </button>
                    <input
                        type="number"
                        value="${item.quantity}"
                        min="1"
                        max="${item.availableQuantity || 99}"
                        class="quantity-input"
                        onchange="updateQuantity(${item.id}, parseInt(this.value) || 1)"
                        title="Enter quantity"
                    >
                    <button
                        class="quantity-btn increase-btn"
                        onclick="updateQuantity(${item.id}, ${item.quantity + 1})"
                        ${item.quantity >= (item.availableQuantity || 99) ? 'disabled' : ''}
                        title="Increase quantity"
                    >
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                ${item.availableQuantity ? `
                <div class="text-xs text-gray-500 mt-1 flex items-center justify-center">
                    <i class="fas fa-info-circle mr-1"></i> ${item.availableQuantity} available
                </div>` : ''}
            </td>
            <td class="py-4 px-6 border-b border-gray-200 text-center">
                <span class="text-base font-medium text-gray-900">${formatCurrency(subtotal)}</span>
            </td>
            <td class="py-4 px-6 border-b border-gray-200 text-center">
                <button
                    class="remove-item-btn"
                    onclick="showRemoveConfirmation(${item.id}, '${item.productName}')"
                    title="Remove item"
                >
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });

    // Update total
    document.getElementById('cart-subtotal').textContent = formatCurrency(total);
    document.getElementById('cart-total').textContent = formatCurrency(total);
}

/**
 * Update the quantity of a cart item with debouncing and improved UI feedback
 */
async function updateQuantity(cartItemId, newQuantity) {
    // Validate quantity
    if (newQuantity < 1) {
        newQuantity = 1;
    }

    // Find the cart item
    const cartItem = cartItems.find(item => item.id === cartItemId);
    if (cartItem && cartItem.availableQuantity && newQuantity > cartItem.availableQuantity) {
        newQuantity = cartItem.availableQuantity;
        showNotification(`Maximum available quantity is ${cartItem.availableQuantity}`, 'warning');
    }

    // Find UI elements
    const row = document.querySelector(`tr[data-item-id="${cartItemId}"]`);
    const inputElement = row ? row.querySelector('.quantity-input') : null;
    const decreaseBtn = row ? row.querySelector('.decrease-btn') : null;
    const increaseBtn = row ? row.querySelector('.increase-btn') : null;

    // Update UI immediately for better responsiveness
    if (inputElement) {
        inputElement.value = newQuantity;
        inputElement.disabled = true;
    }

    // Update subtotal display immediately for better UX
    if (cartItem && row) {
        const subtotalElement = row.querySelector('td:nth-child(4) span');
        if (subtotalElement) {
            const newSubtotal = cartItem.productPrice * newQuantity;
            subtotalElement.textContent = formatCurrency(newSubtotal);
            // Add a subtle highlight effect to show the change
            subtotalElement.classList.add('bg-yellow-100');
            setTimeout(() => {
                subtotalElement.classList.remove('bg-yellow-100');
            }, 1000);
        }
    }

    // Disable buttons during update
    if (decreaseBtn) {
        decreaseBtn.disabled = true;
        decreaseBtn.classList.add('opacity-50');
    }

    if (increaseBtn) {
        increaseBtn.disabled = true;
        increaseBtn.classList.add('opacity-50');
        increaseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    // Clear any existing timeout for this item
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    // Add to update queue
    updateQueue[cartItemId] = newQuantity;

    // Set a timeout to process the update
    updateTimeout = setTimeout(async () => {
        try {
            // Process all queued updates
            const updates = {...updateQueue};
            updateQueue = {}; // Clear the queue

            // If this is the only item being updated, show a notification
            const singleUpdate = Object.keys(updates).length === 1;

            // Process each update
            for (const [itemId, qty] of Object.entries(updates)) {
                const result = await updateCartItemQuantity(parseInt(itemId), qty);

                if (!result.success) {
                    // Show error notification
                    showNotification(result.message || 'Failed to update quantity', 'error');

                    // Re-enable UI elements for this item
                    const itemRow = document.querySelector(`tr[data-item-id="${itemId}"]`);
                    const itemInput = itemRow ? itemRow.querySelector('.quantity-input') : null;
                    const itemDecreaseBtn = itemRow ? itemRow.querySelector('.decrease-btn') : null;
                    const itemIncreaseBtn = itemRow ? itemRow.querySelector('.increase-btn') : null;

                    if (itemInput) itemInput.disabled = false;
                    if (itemDecreaseBtn) {
                        itemDecreaseBtn.disabled = false;
                        itemDecreaseBtn.classList.remove('opacity-50');
                    }
                    if (itemIncreaseBtn) {
                        itemIncreaseBtn.disabled = false;
                        itemIncreaseBtn.classList.remove('opacity-50');
                        itemIncreaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
                    }
                }
            }

            // Reload cart once for all updates without showing the loading indicator
            await loadCart(false);

            // Show success notification if this was a single update
            if (singleUpdate) {
                showNotification('Quantity updated successfully');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);

            // Show error notification
            showNotification('Error updating quantity: ' + error.message, 'error');

            // Re-enable all inputs and buttons
            document.querySelectorAll('.quantity-input').forEach(input => input.disabled = false);
            document.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('opacity-50');
                if (btn.classList.contains('increase-btn')) {
                    btn.innerHTML = '<i class="fas fa-plus"></i>';
                }
            });
        }
    }, 500); // 500ms debounce delay
}

/**
 * Update all cart items (refresh cart)
 */
async function updateAllCartItems() {
    if (isUpdating) return; // Prevent multiple simultaneous updates

    try {
        isUpdating = true;

        // Show loading state
        const updateBtn = document.getElementById('update-cart-btn');
        const originalText = updateBtn.innerHTML;
        updateBtn.disabled = true;
        updateBtn.classList.add('opacity-90');
        updateBtn.classList.remove('hover:from-green-100', 'hover:to-green-200', 'hover:-translate-y-0.5', 'hover:shadow-md');
        updateBtn.innerHTML = `
            <div class="spinner inline-block w-4 h-4 mr-2 border-2 border-t-green-600"></div>
            <span>Updating...</span>
        `;

        // Reload cart with loading indicator
        await loadCart(true);

        // Show success animation on the button
        updateBtn.classList.remove('opacity-90');
        updateBtn.classList.add('from-green-200', 'to-green-300', 'text-green-800', 'border-green-400');
        updateBtn.innerHTML = `
            <i class="fas fa-check mr-2"></i>
            <span>Updated!</span>
        `;

        // Show success notification
        showNotification('Cart updated successfully');

        // Reset button after a delay
        setTimeout(() => {
            updateBtn.classList.remove('from-green-200', 'to-green-300', 'text-green-800', 'border-green-400');
            updateBtn.classList.add('from-green-50', 'to-green-100', 'hover:from-green-100', 'hover:to-green-200', 'hover:-translate-y-0.5', 'hover:shadow-md');
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }, 1500);
    } catch (error) {
        console.error('Error updating cart:', error);

        // Show error animation on the button
        updateBtn.classList.remove('opacity-90');
        updateBtn.classList.add('from-red-100', 'to-red-200', 'text-red-800', 'border-red-400');
        updateBtn.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>Failed</span>
        `;

        // Show error notification
        showNotification('Error updating cart: ' + error.message, 'error');

        // Reset button after a delay
        setTimeout(() => {
            updateBtn.classList.remove('from-red-100', 'to-red-200', 'text-red-800', 'border-red-400');
            updateBtn.classList.add('from-green-50', 'to-green-100', 'hover:from-green-100', 'hover:to-green-200', 'hover:-translate-y-0.5', 'hover:shadow-md');
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }, 1500);
    } finally {
        // Reset the updating flag
        setTimeout(() => {
            isUpdating = false;
        }, 1500);
    }
}

/**
 * Show confirmation modal for removing an item
 */
function showRemoveConfirmation(cartItemId, productName) {
    currentItemId = cartItemId;

    // Update modal message with product name
    const modalMessage = document.getElementById('remove-modal-message');
    modalMessage.textContent = `Are you sure you want to remove "${productName}" from your cart?`;

    // Show modal
    document.getElementById('remove-confirmation-modal').classList.remove('hidden');
}

/**
 * Close the remove confirmation modal
 */
function closeRemoveModal() {
    document.getElementById('remove-confirmation-modal').classList.add('hidden');

    // Reset the confirm button state
    const confirmBtn = document.getElementById('confirm-remove');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
            <i class="fas fa-trash-alt mr-2"></i>
            Remove
        `;
    }

    currentItemId = null;
}

/**
 * Confirm and remove the item
 */
async function confirmRemoveItem() {
    if (currentItemId === null) {
        closeRemoveModal();
        return;
    }

    try {
        // Disable button during API call
        const confirmBtn = document.getElementById('confirm-remove');
        const originalText = confirmBtn.textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `
            <svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Removing...
        `;

        // Remove item
        const result = await removeCartItem(currentItemId);

        // Close modal
        closeRemoveModal();

        if (result.success) {
            // Find the cart item row and animate its removal
            const cartItemRow = document.querySelector(`tr[data-item-id="${currentItemId}"]`);

            if (cartItemRow) {
                // Add slide-out and fade-out animation
                cartItemRow.style.transition = 'all 0.5s ease';
                cartItemRow.style.maxHeight = cartItemRow.scrollHeight + 'px';
                cartItemRow.style.opacity = '1';

                // Start animation
                setTimeout(() => {
                    cartItemRow.style.maxHeight = '0';
                    cartItemRow.style.opacity = '0';
                    cartItemRow.style.paddingTop = '0';
                    cartItemRow.style.paddingBottom = '0';
                    cartItemRow.style.marginTop = '0';
                    cartItemRow.style.marginBottom = '0';
                    cartItemRow.style.borderWidth = '0';

                    // After animation completes, update the cart data
                    setTimeout(async () => {
                        // Remove the item from the cartItems array
                        cartItems = cartItems.filter(item => item.id !== currentItemId);

                        // If cart is now empty, show empty state
                        if (cartItems.length === 0) {
                            document.getElementById('cart-items').classList.add('hidden');
                            document.getElementById('cart-empty').classList.remove('hidden');
                        } else {
                            // Otherwise, update the cart totals
                            updateCartTotals();
                        }

                        // Show success notification
                        showNotification('Item removed from cart');
                    }, 500); // Wait for animation to complete
                }, 10); // Small delay to ensure the transition starts properly
            } else {
                // Fallback if row not found
                await loadCart(false);
                showNotification('Item removed from cart');
            }
        } else {
            // Show error notification
            showNotification(result.message || 'Failed to remove item', 'error');
        }
    } catch (error) {
        console.error('Error removing item:', error);
        closeRemoveModal();

        // Show error notification
        showNotification('Error removing item: ' + error.message, 'error');
    }
}

/**
 * Show confirmation modal for clearing the cart
 */
function showClearCartConfirmation() {
    document.getElementById('clear-confirmation-modal').classList.remove('hidden');
}

/**
 * Close the clear confirmation modal
 */
function closeClearModal() {
    document.getElementById('clear-confirmation-modal').classList.add('hidden');

    // Reset the confirm button state
    const confirmBtn = document.getElementById('confirm-clear');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `
            <i class="fas fa-trash-alt mr-2"></i>
            <span>Clear Cart</span>
        `;
    }
}

/**
 * Confirm and clear the cart
 */
async function confirmClearCart() {
    try {
        // Disable button during API call
        const confirmBtn = document.getElementById('confirm-clear');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-90');
        confirmBtn.innerHTML = `
            <div class="spinner inline-block w-4 h-4 mr-2 border-2 border-t-white"></div>
            <span>Clearing...</span>
        `;

        // Clear cart
        const result = await clearCart();

        // Get the modal content for animations
        const modalContent = document.querySelector('#clear-confirmation-modal .bg-white');

        if (result.success) {
            // Add success animation
            modalContent.classList.add('bg-green-50', 'border-green-200');

            // Add success animation to the button
            confirmBtn.classList.remove('opacity-90');
            confirmBtn.classList.add('bg-green-600');
            confirmBtn.innerHTML = `
                <i class="fas fa-check mr-2"></i>
                <span>Cleared!</span>
            `;

            // Close modal after a short delay
            setTimeout(() => {
                modalContent.classList.remove('bg-green-50', 'border-green-200');
                closeClearModal();

                // Reload cart with loading indicator
                loadCart(true);

                // Show success notification
                showNotification('Cart cleared successfully');
            }, 800);
        } else {
            // Add error animation to the button
            confirmBtn.classList.remove('opacity-90');
            confirmBtn.classList.add('bg-red-800');
            confirmBtn.innerHTML = `
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>Failed</span>
            `;

            // Close modal after a short delay
            setTimeout(() => {
                closeClearModal();

                // Show error notification
                showNotification(result.message || 'Failed to clear cart', 'error');
            }, 800);
        }
    } catch (error) {
        console.error('Error clearing cart:', error);

        // Add error animation to the button and modal
        modalContent.classList.add('bg-red-50', 'border-red-200');
        confirmBtn.classList.remove('opacity-75', 'bg-red-700');
        confirmBtn.classList.add('bg-red-800');
        confirmBtn.innerHTML = `
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>Error!</span>
        `;

        // Close modal after a short delay
        setTimeout(() => {
            modalContent.classList.remove('bg-red-50', 'border-red-200');
            closeClearModal();

            // Show error notification
            showNotification('Error clearing cart: ' + error.message, 'error');
        }, 800);
    }
}

/**
 * Show a notification
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // Set message
    notificationMessage.textContent = message;

    // Set color based on type
    notification.classList.remove('bg-green-600', 'bg-red-600', 'bg-yellow-500');

    if (type === 'error') {
        notification.classList.add('bg-red-600');
    } else if (type === 'warning') {
        notification.classList.add('bg-yellow-500');
    } else {
        notification.classList.add('bg-green-600');
    }

    // Show notification
    notification.classList.remove('hidden');

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Initialize tooltips for interactive elements
 */
function initTooltips() {
    // This is a simple implementation - in a production app, you might use a tooltip library
    document.querySelectorAll('[title]').forEach(element => {
        element.classList.add('tooltip-trigger');
    });
}

/**
 * Animate cart items with a subtle fade-in effect
 */
function animateCartItems() {
    const rows = document.querySelectorAll('.cart-item-row');
    rows.forEach((row, index) => {
        // Add a slight delay for each row to create a cascade effect
        setTimeout(() => {
            row.classList.add('fade-in');
        }, index * 50);
    });
}

/**
 * Toggle the back to top button visibility based on scroll position
 */
function toggleBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    if (window.scrollY > 300) {
        backToTopBtn.classList.remove('hidden');
    } else {
        backToTopBtn.classList.add('hidden');
    }
}

/**
 * Scroll to the top of the page with smooth animation
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Update cart totals without reloading the entire cart
 */
function updateCartTotals() {
    let total = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
        const subtotal = item.productPrice * item.quantity;
        total += subtotal;
        totalItems += item.quantity;
    });

    // Update the cart totals in the UI
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartTotalElement = document.getElementById('cart-total');

    if (cartSubtotalElement) {
        cartSubtotalElement.textContent = formatCurrency(total);
        // Add a subtle highlight effect
        cartSubtotalElement.classList.add('bg-yellow-100');
        setTimeout(() => {
            cartSubtotalElement.classList.remove('bg-yellow-100');
        }, 1000);
    }

    if (cartTotalElement) {
        cartTotalElement.textContent = formatCurrency(total);
        // Add a subtle highlight effect
        cartTotalElement.classList.add('bg-yellow-100');
        setTimeout(() => {
            cartTotalElement.classList.remove('bg-yellow-100');
        }, 1000);
    }
}
