/**
 * Checkout Page JavaScript
 * Handles Stripe payment integration
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize checkout page
    initCheckout();

    // Check for success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success') && urlParams.get('success') === 'true') {
        // Show success message if redirected back with success parameter
        console.log('Success parameter detected in URL');
        showSuccess({
            orderId: urlParams.get('orderId') || 'N/A',
            orderDate: urlParams.get('date') || new Date().toISOString(),
            totalAmount: urlParams.get('amount') || 0
        });
    }

    // Add event listener for page unload to clean up overlays
    window.addEventListener('beforeunload', function() {
        // Remove any processing overlays before leaving the page
        hideProcessingOverlay();

        // Remove any success overlays
        const successOverlay = document.getElementById('success-overlay');
        if (successOverlay && successOverlay.parentNode) {
            successOverlay.parentNode.removeChild(successOverlay);
        }
    });
});

/**
 * Initialize the checkout page
 */
function initCheckout() {
    // Get Stripe public key from the page
    const stripePublicKey = document.getElementById('stripe-public-key').value;

    // Initialize Stripe
    const stripe = Stripe(stripePublicKey);
    const elements = stripe.elements();

    // Create card element
    const cardElement = elements.create('card', {
        style: {
            base: {
                color: '#32325d',
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
    });

    // Mount the card element
    cardElement.mount('#card-element');

    // Handle real-time validation errors
    cardElement.on('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Disable the submit button to prevent multiple submissions
        setLoading(true);

        // Create payment intent on the server
        createPaymentIntent()
            .then(function(result) {
                if (result.error) {
                    throw new Error(result.error);
                }

                // Confirm the card payment with the client secret
                return stripe.confirmCardPayment(result.clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            // You can add billing details here if needed
                        }
                    }
                });
            })
            .then(function(result) {
                if (result.error) {
                    // Show error to customer
                    showError(result.error.message);
                } else {
                    // Payment succeeded
                    if (result.paymentIntent.status === 'succeeded') {
                        console.log('Payment intent succeeded:', result.paymentIntent);

                        // IMMEDIATELY CHANGE UI TO SHOW SUCCESS
                        // Remove any existing overlays
                        hideProcessingOverlay(true);

                        // Show success UI immediately with better animation and marketplace redirect
                        document.body.innerHTML = `
                            <div class="fixed inset-0 bg-green-50 flex items-center justify-center z-50">
                                <div class="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                                    <div class="text-green-500 mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h1 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
                                    <p class="text-gray-600 mb-4">Your order has been placed successfully.</p>

                                    <!-- Animated loading bar -->
                                    <div class="relative pt-1 mb-6">
                                        <div class="flex mb-2 items-center justify-between">
                                            <div>
                                                <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                                    Processing Order
                                                </span>
                                            </div>
                                            <div class="text-right">
                                                <span class="text-xs font-semibold inline-block text-green-600" id="progress-percentage">0%</span>
                                            </div>
                                        </div>
                                        <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                                            <div id="progress-bar" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500" style="width: 0%"></div>
                                        </div>
                                    </div>

                                    <p class="text-sm text-gray-500 mb-4">Redirecting to marketplace in <span id="redirect-countdown">3</span> seconds...</p>

                                    <div class="flex space-x-4 justify-center">
                                        <a href="/marketplace" class="inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                                            Return to Marketplace
                                        </a>
                                        <a href="/dashboard" class="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors">
                                            View Orders
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Animate the progress bar
                        const progressBar = document.getElementById('progress-bar');
                        const progressPercentage = document.getElementById('progress-percentage');
                        let progress = 0;

                        const progressInterval = setInterval(() => {
                            progress += 5;
                            if (progress > 100) {
                                clearInterval(progressInterval);
                            } else {
                                if (progressBar) progressBar.style.width = `${progress}%`;
                                if (progressPercentage) progressPercentage.textContent = `${progress}%`;
                            }
                        }, 100);

                        // Start countdown for redirect
                        let countdown = 3;
                        const countdownEl = document.getElementById('redirect-countdown');

                        const countdownInterval = setInterval(() => {
                            countdown--;
                            if (countdownEl) countdownEl.textContent = countdown;

                            if (countdown <= 0) {
                                clearInterval(countdownInterval);
                                window.location.href = '/marketplace';
                            }
                        }, 1000);

                        // Set flags in localStorage to indicate payment is complete and cart should be cleared
                        localStorage.setItem('payment_completed', 'true');
                        localStorage.setItem('cart_cleared', 'true');
                        localStorage.removeItem('payment_processing');

                        // Clear any cached cart data
                        try {
                            localStorage.removeItem('cart_items');
                            localStorage.removeItem('cart_count');
                            sessionStorage.removeItem('cart_items');
                            sessionStorage.removeItem('cart_count');
                        } catch (e) {
                            console.error('Error clearing cart data from storage:', e);
                        }

                        // Send success to server
                        return notifyPaymentSuccess(result.paymentIntent.id);
                    }
                }
            })
            .then(function(result) {
                console.log('Payment success notification result:', result);
                if (result && result.success) {
                    // Update the progress bar to 100% to indicate completion
                    try {
                        const progressBar = document.getElementById('progress-bar');
                        const progressPercentage = document.getElementById('progress-percentage');

                        if (progressBar) progressBar.style.width = '100%';
                        if (progressPercentage) progressPercentage.textContent = '100%';

                        // Update order ID if available
                        if (result.orderId) {
                            const processingLabel = document.querySelector('.text-xs.font-semibold.inline-block.py-1.px-2.uppercase.rounded-full.text-green-600');
                            if (processingLabel) {
                                processingLabel.textContent = 'Order Complete';
                            }
                        }
                    } catch (e) {
                        console.error('Error updating progress bar:', e);
                    }

                    // Don't interfere with the redirect that's already set up
                } else if (result && result.error) {
                    // Show error but don't interfere with the redirect
                    console.error('Error from server:', result.error);
                    try {
                        // Just update the progress bar to show an error state
                        const progressBar = document.getElementById('progress-bar');
                        if (progressBar) {
                            progressBar.style.width = '100%';
                            progressBar.classList.remove('bg-green-500');
                            progressBar.classList.add('bg-red-500');
                        }

                        const processingLabel = document.querySelector('.text-xs.font-semibold.inline-block.py-1.px-2.uppercase.rounded-full.text-green-600');
                        if (processingLabel) {
                            processingLabel.textContent = 'Warning: Check Order Status';
                            processingLabel.classList.remove('text-green-600', 'bg-green-200');
                            processingLabel.classList.add('text-red-600', 'bg-red-200');
                        }
                    } catch (e) {
                        console.error('Error updating UI with error state:', e);
                    }
                }
            })
            .catch(function(error) {
                console.error('Error in payment process:', error);

                // Check if we already showed the success UI
                if (localStorage.getItem('payment_completed') === 'true') {
                    // Just update the progress bar to show an error state
                    try {
                        const progressBar = document.getElementById('progress-bar');
                        if (progressBar) {
                            progressBar.style.width = '100%';
                            progressBar.classList.remove('bg-green-500');
                            progressBar.classList.add('bg-red-500');
                        }

                        const processingLabel = document.querySelector('.text-xs.font-semibold.inline-block.py-1.px-2.uppercase.rounded-full.text-green-600');
                        if (processingLabel) {
                            processingLabel.textContent = 'Error: Check Order Status';
                            processingLabel.classList.remove('text-green-600', 'bg-green-200');
                            processingLabel.classList.add('text-red-600', 'bg-red-200');
                        }

                        // Don't interfere with the redirect that's already set up
                    } catch (e) {
                        console.error('Error updating progress bar with error state:', e);
                    }
                } else {
                    // Remove processing overlay
                    hideProcessingOverlay();
                    // Show error message
                    showError(error.message || 'An unexpected error occurred');
                }
            })
            .finally(function() {
                setLoading(false);
            });
    });

    // Try again button
    document.getElementById('try-again').addEventListener('click', function() {
        hideError();
    });
}

/**
 * Create a payment intent on the server
 */
async function createPaymentIntent() {
    try {
        // Get CSRF token
        const csrfToken = document.getElementById('csrf-token')?.value;
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add CSRF token if available
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch('/api/checkout/create-payment-intent', {
            method: 'POST',
            headers: headers
        });

        return await response.json();
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return { error: error.message || 'Failed to create payment intent' };
    }
}

/**
 * Notify the server that payment was successful
 */
async function notifyPaymentSuccess(paymentIntentId) {
    console.log('Notifying server of payment success with ID:', paymentIntentId);
    try {
        // Clear cart data from local storage immediately
        localStorage.removeItem('cart');

        // Store payment success in localStorage to prevent duplicate processing
        localStorage.setItem('payment_completed', 'true');
        localStorage.setItem('last_payment_intent', paymentIntentId);
        localStorage.setItem('payment_timestamp', new Date().toISOString());

        // First, try to clear the cart directly with multiple retries
        let cartCleared = false;
        const maxRetries = 3;

        // Get the order ID if available from the response
        let orderId = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempting to clear cart before payment notification (attempt ${attempt} of ${maxRetries})`);

                // Try force mode first
                console.log(`Using force mode for cart clearing (attempt ${attempt})`);
                try {
                    const forceResponse = await fetch('/api/cart/force-clear', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (forceResponse.ok) {
                        const forceResult = await forceResponse.json();
                        console.log(`Force mode cart clearing successful (attempt ${attempt}):`, forceResult);
                        cartCleared = true;
                        break; // Exit the retry loop if successful
                    } else {
                        console.warn(`Force mode cart clearing failed (attempt ${attempt}): ${forceResponse.status}`);
                    }
                } catch (forceError) {
                    console.error(`Error with force mode cart clearing (attempt ${attempt}):`, forceError);
                }

                // Try the comprehensive endpoint if we have an order ID
                if (orderId) {
                    console.log(`Using comprehensive cart clearing with orderId: ${orderId}`);
                    try {
                        const comprehensiveResponse = await fetch(`/api/cart/clear-after-payment?orderId=${orderId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (comprehensiveResponse.ok) {
                            const comprehensiveResult = await comprehensiveResponse.json();
                            console.log(`Comprehensive cart clearing successful (attempt ${attempt}):`, comprehensiveResult);
                            cartCleared = true;
                            break; // Exit the retry loop if successful
                        } else {
                            console.warn(`Comprehensive cart clearing failed (attempt ${attempt}): ${comprehensiveResponse.status}`);
                        }
                    } catch (comprehensiveError) {
                        console.error(`Error with comprehensive cart clearing (attempt ${attempt}):`, comprehensiveError);
                    }
                }

                // Fall back to the regular clear endpoint
                const clearResponse = await fetch('/api/cart/clear', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (clearResponse.ok) {
                    const clearResult = await clearResponse.json();
                    console.log(`Cart cleared from database (attempt ${attempt}):`, clearResult);
                    cartCleared = true;
                    break; // Exit the retry loop if successful
                } else {
                    console.warn(`Cart clear request failed with status: ${clearResponse.status}`);
                }
            } catch (clearError) {
                console.error(`Error clearing cart (attempt ${attempt}):`, clearError);
                // Wait a short time before retrying
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                }
            }
        }

        if (!cartCleared) {
            console.warn('Failed to clear cart after multiple attempts. Continuing with payment notification.');
        }

        // Get CSRF token
        const csrfToken = document.getElementById('csrf-token')?.value;
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add CSRF token if available
        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        console.log('Sending payment success notification to server');
        const response = await fetch('/api/checkout/payment-success', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ paymentIntentId: paymentIntentId })
        });

        console.log('Payment success notification response status:', response.status);
        const responseData = await response.json();
        console.log('Payment success notification response data:', responseData);

        // Try to clear the cart again after payment notification with multiple retries
        if (!cartCleared) {
            // Get the order ID from the response if available
            if (responseData && responseData.orderId) {
                orderId = responseData.orderId;
                console.log(`Order ID from response: ${orderId}`);

                // Try force mode first
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`Attempting force mode cart clearing after payment (attempt ${attempt} of ${maxRetries})`);
                        const forceResponse = await fetch('/api/cart/force-clear', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (forceResponse.ok) {
                            const forceResult = await forceResponse.json();
                            console.log(`Force mode cart clearing successful after payment (attempt ${attempt}):`, forceResult);
                            cartCleared = true;
                            // Store the order ID in localStorage for use in the success page
                            if (orderId) localStorage.setItem('last_order_id', orderId);
                            break; // Exit the retry loop if successful
                        } else {
                            console.warn(`Force mode cart clearing failed after payment (attempt ${attempt}): ${forceResponse.status}`);
                        }
                    } catch (forceError) {
                        console.error(`Error with force mode cart clearing after payment (attempt ${attempt}):`, forceError);
                        // Wait a short time before retrying
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                        }
                    }
                }

                // If force mode didn't work, try the comprehensive endpoint with the order ID
                if (!cartCleared) {
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            console.log(`Attempting comprehensive cart clearing after payment (attempt ${attempt} of ${maxRetries})`);
                            const comprehensiveResponse = await fetch(`/api/cart/clear-after-payment?orderId=${orderId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (comprehensiveResponse.ok) {
                                const comprehensiveResult = await comprehensiveResponse.json();
                                console.log(`Comprehensive cart clearing successful after payment (attempt ${attempt}):`, comprehensiveResult);
                                cartCleared = true;
                                // Store the order ID in localStorage for use in the success page
                                localStorage.setItem('last_order_id', orderId);
                                break; // Exit the retry loop if successful
                            } else {
                                console.warn(`Comprehensive cart clearing failed after payment (attempt ${attempt}): ${comprehensiveResponse.status}`);
                            }
                        } catch (comprehensiveError) {
                            console.error(`Error with comprehensive cart clearing after payment (attempt ${attempt}):`, comprehensiveError);
                            // Wait a short time before retrying
                            if (attempt < maxRetries) {
                                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                            }
                        }
                    }
                }
            }

            // If still not cleared, try the regular endpoint
            if (!cartCleared) {
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        console.log(`Attempting to clear cart after payment notification (attempt ${attempt} of ${maxRetries})`);
                        const clearResponse = await fetch('/api/cart/clear', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (clearResponse.ok) {
                            const clearResult = await clearResponse.json();
                            console.log(`Cart cleared from database after payment notification (attempt ${attempt}):`, clearResult);
                            cartCleared = true;
                            break; // Exit the retry loop if successful
                        } else {
                            console.warn(`Cart clear request after payment failed with status: ${clearResponse.status}`);
                        }
                    } catch (clearError) {
                        console.error(`Error clearing cart after payment (attempt ${attempt}):`, clearError);
                        // Wait a short time before retrying
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                        }
                    }
                }
            }

            if (!cartCleared) {
                console.warn('Failed to clear cart after payment notification and multiple attempts.');
                // As a last resort, schedule a final attempt after a delay
                setTimeout(() => {
                    fetch('/api/cart/clear', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => response.json())
                    .then(result => console.log('Final delayed cart clear attempt result:', result))
                    .catch(error => console.error('Error in final delayed cart clear attempt:', error));
                }, 3000); // Try one more time after 3 seconds
            }
        }

        return responseData;
    } catch (error) {
        console.error('Error notifying payment success:', error);
        return { error: error.message || 'Failed to process order' };
    }
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
    const submitButton = document.getElementById('submit-payment');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    if (isLoading) {
        submitButton.disabled = true;
        buttonText.textContent = 'Processing...';
        spinner.classList.remove('hidden');
    } else {
        submitButton.disabled = false;
        buttonText.textContent = 'Pay Now';
        spinner.classList.add('hidden');
    }
}

/**
 * Show success message
 * @param {Object} result - The result from the payment success notification
 */
function showSuccess(result) {
    console.log('Payment successful, redirecting to success page with result:', result);

    try {
        // Remove any existing processing overlay
        hideProcessingOverlay();

        // Show success overlay
        const successOverlay = document.createElement('div');
        successOverlay.id = 'success-overlay';
        successOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successOverlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg text-center">
                <div class="text-green-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p class="text-lg font-medium text-gray-900">Payment successful!</p>
                <p class="text-sm text-gray-600 mb-4">Redirecting to order confirmation...</p>
                <div class="animate-pulse bg-green-100 h-1 w-full rounded-full overflow-hidden">
                    <div class="bg-green-500 h-full w-1/3 rounded-full"></div>
                </div>
            </div>
        `;
        document.body.appendChild(successOverlay);

        // Clear cart data from local storage
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
        localStorage.removeItem('cart_count');
        sessionStorage.removeItem('cart_items');
        sessionStorage.removeItem('cart_count');

        // Store success info in localStorage
        if (result && result.orderId) {
            localStorage.setItem('last_order_id', result.orderId.toString());
        }
        if (result && result.paymentIntentId) {
            localStorage.setItem('last_payment_intent', result.paymentIntentId);
        }
        localStorage.setItem('checkout_success', 'true');
        localStorage.setItem('checkout_timestamp', new Date().toISOString());

        // Call the API to clear the cart in the database with multiple retries
        const maxRetries = 3;
        let attempt = 0;

        function attemptClearCart() {
            attempt++;
            console.log(`Attempting to clear cart in showSuccess (attempt ${attempt} of ${maxRetries})`);

            return fetch('/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(clearResult => {
                console.log(`Cart cleared from database (attempt ${attempt}):`, clearResult);
                return clearResult;
            })
            .catch(error => {
                console.error(`Error clearing cart (attempt ${attempt}):`, error);
                if (attempt < maxRetries) {
                    // Wait longer between each retry
                    const delay = 500 * attempt;
                    console.log(`Retrying after ${delay}ms...`);
                    return new Promise(resolve => setTimeout(() => resolve(attemptClearCart()), delay));
                } else {
                    console.warn('Failed to clear cart after maximum retries');
                    // Schedule one final attempt with a longer delay
                    setTimeout(() => {
                        console.log('Making final delayed cart clear attempt');

                        // Try to get the order ID from localStorage or result
                        const orderId = localStorage.getItem('last_order_id') ||
                                      (result && result.orderId ? result.orderId : null);

                        // Try force mode first
                        console.log('Using force mode for cart clearing');
                        fetch('/api/cart/force-clear', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(result => console.log('Final delayed force mode cart clear attempt result:', result))
                        .catch(error => console.error('Error in final delayed force mode cart clear attempt:', error));

                        // Try the comprehensive endpoint if we have an order ID
                        if (orderId) {
                            console.log(`Using comprehensive cart clearing with orderId: ${orderId}`);
                            fetch(`/api/cart/clear-after-payment?orderId=${orderId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then(response => response.json())
                            .then(result => console.log('Final delayed comprehensive cart clear attempt result:', result))
                            .catch(error => console.error('Error in final delayed comprehensive cart clear attempt:', error));
                        }

                        // Also try the regular endpoint as a fallback
                        fetch('/api/cart/clear', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(result => console.log('Final delayed cart clear attempt result:', result))
                        .catch(error => console.error('Error in final delayed cart clear attempt:', error));
                    }, 3000); // Try one more time after 3 seconds
                    return Promise.resolve({ success: false, error: error.message });
                }
            });
        }

        // Start the cart clearing process
        attemptClearCart()
        .finally(() => {
            // Redirect to the payment success page with order details after a short delay
            setTimeout(() => {
                if (result && result.orderId) {
                    // Redirect with order details
                    window.location.href = `/payment-success?orderId=${result.orderId}`;
                } else {
                    // Redirect with payment intent ID if available
                    const paymentIntentId = result && result.paymentIntentId ? result.paymentIntentId : '';
                    window.location.href = `/payment-success?paymentIntentId=${paymentIntentId}`;
                }
            }, 1500); // 1.5 second delay to show the success message and allow cart clearing to complete
        });
    } catch (error) {
        console.error('Error redirecting to success page:', error);
        // Fallback to direct redirect
        window.location.href = '/payment-success';
    }
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
 * Show processing overlay
 */
function showProcessingOverlay() {
    // Set a flag in localStorage to indicate processing is happening
    localStorage.setItem('payment_processing', 'true');

    // Remove any existing overlay first
    hideProcessingOverlay(false);

    // Create overlay if it doesn't exist
    if (!document.getElementById('processing-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'processing-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '9999';
        overlay.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg text-center" style="min-width: 300px;">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p class="text-lg font-medium">Processing Payment</p>
                <p class="text-sm text-gray-600">Please wait while we process your payment...</p>
                <button id="cancel-processing" class="mt-4 text-sm text-red-600 hover:text-red-800">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Add event listener to cancel button
        document.getElementById('cancel-processing').addEventListener('click', function() {
            hideProcessingOverlay(true);
            showError('Payment processing was cancelled.');
        });
    }
}

/**
 * Hide processing overlay
 * @param {boolean} clearFlag - Whether to clear the processing flag in localStorage
 */
function hideProcessingOverlay(clearFlag = true) {
    // Clear the processing flag if requested
    if (clearFlag) {
        localStorage.removeItem('payment_processing');
    }

    // Remove overlay if it exists
    const overlay = document.getElementById('processing-overlay');
    if (overlay) {
        // Remove immediately
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    // Also check for any elements with the processing-overlay class
    document.querySelectorAll('.processing-overlay').forEach(el => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Show error message
    document.getElementById('payment-error').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;

    // Scroll to error message
    document.getElementById('payment-error').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide error message
 */
function hideError() {
    document.getElementById('payment-error').classList.add('hidden');
}
