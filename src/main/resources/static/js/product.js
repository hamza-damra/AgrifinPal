/**
 * Product Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Dynamically load cart-count.js if it doesn't exist
    if (typeof window.updateCartCount !== 'function') {
        console.log('Loading cart-count.js dynamically');
        const script = document.createElement('script');
        script.src = '/js/cart-count.js';
        script.onload = function() {
            console.log('cart-count.js loaded successfully');
            if (typeof window.updateCartCount === 'function') {
                window.updateCartCount(true);
            }
        };
        document.head.appendChild(script);
    }
    // Initialize product page
    initProductPage();
});

/**
 * Initialize the product page
 */
function initProductPage() {
    // Get product ID from URL
    const productId = getProductIdFromUrl();

    if (!productId) {
        showErrorState('Product ID is missing from the URL.');
        return;
    }

    // Load product data
    loadProductData(productId);

    // Initialize event listeners
    initEventListeners();
}

/**
 * Get product ID from URL
 */
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load product data from API
 */
async function loadProductData(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Product not found');
        }

        const productData = await response.json();

        // Display product data
        displayProductData(productData);

        // Load reviews for this product
        loadProductReviews(productId);

        // Check if user is authenticated to show/hide add review button
        checkAuthenticationForReview();

        // Show product content
        showProductContent();
    } catch (error) {
        console.error('Error loading product data:', error);
        showErrorState(error.message || 'Failed to load product data.');
    }
}

/**
 * Display product data in the UI
 */
function displayProductData(product) {
    // Update page title
    document.title = `${product.name} - AgriFinPal`;

    // Update product details
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = formatCurrency(product.price);
    document.getElementById('product-unit').textContent = `per ${product.unit}`;
    document.getElementById('product-availability').textContent = `${product.quantity} ${product.unit} available`;

    // Set max quantity
    const quantityInput = document.getElementById('quantity');
    quantityInput.max = product.quantity;

    // Update product image
    const productImage = document.getElementById('product-image');
    productImage.src = product.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
    productImage.alt = product.name;

    // Add badges
    const badgesContainer = document.getElementById('product-badges');
    badgesContainer.innerHTML = '';

    if (product.isOrganic) {
        const organicBadge = document.createElement('span');
        organicBadge.className = 'badge';
        organicBadge.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M2 22s4-2 8-2 8 2 8 2"></path><path d="M2 22V9a4 4 0 0 1 4-4h.5"></path><path d="M22 22V9a4 4 0 0 0-4-4h-.5"></path><path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M12 19v-4"></path><path d="M8 15h8"></path></svg>
            Organic
        `;
        badgesContainer.appendChild(organicBadge);
    }

    // Display rating stars
    displayRatingStars(product.averageRating || 0);

    // Update review count
    document.getElementById('review-count').textContent = `(${product.reviewCount || 0} reviews)`;

    // Update store information if available
    if (product.store) {
        const storeLink = document.getElementById('store-link');
        storeLink.href = `/store?id=${product.store.id}`;
        document.getElementById('store-name').textContent = product.store.name;
        document.getElementById('store-location').textContent = product.store.location || '';
    }
}

/**
 * Display rating stars based on rating value
 */
function displayRatingStars(rating) {
    const starsContainer = document.getElementById('rating-stars');
    starsContainer.innerHTML = '';

    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('div');
        star.className = i <= rating ? 'star filled' : 'star empty';
        star.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        `;
        starsContainer.appendChild(star);
    }
}

/**
 * Load product reviews
 */
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`/api/reviews/product/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load reviews');
        }

        const reviews = await response.json();
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        const reviewsContainer = document.getElementById('reviews-container');
        reviewsContainer.innerHTML = `
            <div class="loading-placeholder">
                <p>Failed to load reviews. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Display reviews in the UI
 */
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    reviewsContainer.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="no-reviews">
                <p>No reviews yet. Be the first to review this product!</p>
            </div>
        `;
        return;
    }

    // Sort reviews by date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Create review cards
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';

        const reviewStars = document.createElement('div');
        reviewStars.className = 'rating-stars';

        // Create stars based on rating
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('div');
            star.className = i <= review.rating ? 'star filled' : 'star empty';
            star.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            `;
            reviewStars.appendChild(star);
        }

        reviewCard.innerHTML = `
            <div class="review-header">
                <div class="review-author">
                    ${reviewStars.outerHTML}
                    <span class="review-author-name">${review.userName || 'Anonymous User'}</span>
                </div>
                <span class="review-date">${formatDate(review.createdAt)}</span>
            </div>
            <div class="review-content">
                <p>${review.comment}</p>
            </div>
        `;

        reviewsContainer.appendChild(reviewCard);
    });
}

/**
 * Check if user is authenticated to show/hide add review button
 */
async function checkAuthenticationForReview() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, user is not authenticated
        if (!token) {
            return;
        }

        const response = await fetch('/api/auth/check-auth', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                // Show add review button
                document.getElementById('add-review-container').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Quantity input buttons
    const decreaseBtn = document.getElementById('decrease-quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const quantityInput = document.getElementById('quantity');

    decreaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });

    increaseBtn.addEventListener('click', () => {
        const currentValue = parseInt(quantityInput.value);
        const maxValue = parseInt(quantityInput.max);
        if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
        }
    });

    // Quantity input validation
    quantityInput.addEventListener('change', () => {
        let value = parseInt(quantityInput.value);
        const maxValue = parseInt(quantityInput.max);

        if (isNaN(value) || value < 1) {
            quantityInput.value = 1;
        } else if (value > maxValue) {
            quantityInput.value = maxValue;
        }
    });

    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.addEventListener('click', handleAddToCart);

    // Add review button
    const addReviewBtn = document.getElementById('add-review-btn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', openReviewModal);
    }

    // Close modal buttons
    const closeModalButtons = document.querySelectorAll('.close-modal-btn');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });

    // Modal overlay click to close
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', closeModals);
    });

    // Review form submission
    const reviewForm = document.getElementById('review-form');
    reviewForm.addEventListener('submit', handleReviewSubmission);
}

/**
 * Handle adding product to cart
 */
async function handleAddToCart() {
    try {
        const productId = getProductIdFromUrl();
        const quantity = parseInt(document.getElementById('quantity').value);

        // Use our new addProductToCart function
        const result = await addProductToCart(productId, quantity);

        if (result.success) {
            // Show success notification
            showCartNotification();

            // Update cart count in header if the function exists
            if (typeof window.updateCartCount === 'function') {
                console.log('Updating cart count in header after adding product');
                window.updateCartCount(true);
            }
        } else {
            // Show error message
            alert(result.message || 'Failed to add product to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('An error occurred while adding the product to cart.');
    }
}

/**
 * Show cart notification
 */
function showCartNotification() {
    const notification = document.getElementById('cart-notification');
    notification.classList.add('show');

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Open review modal
 */
function openReviewModal() {
    document.getElementById('review-modal').classList.remove('hidden');

    // Reset form
    document.getElementById('review-form').reset();
}

/**
 * Close all modals
 */
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

/**
 * Handle review submission
 */
async function handleReviewSubmission(event) {
    event.preventDefault();

    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, redirect to login
        if (!token) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
            return;
        }

        // Check if token is valid by making a test request
        try {
            const testResponse = await fetch('/api/auth/check-auth', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!testResponse.ok) {
                // Token is invalid, redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.href);
                return;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        }

        const productId = getProductIdFromUrl();
        const rating = document.querySelector('input[name="rating"]:checked').value;
        const reviewText = document.getElementById('review-text').value;

        // Use 'comment' as the field name to match backend expectations
        const comment = reviewText;

        // Get CSRF token
        const csrf = getCsrfToken();

        // Submit review API call
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                [csrf.header]: csrf.value
            },
            body: JSON.stringify({
                productId: parseInt(productId),
                rating: parseInt(rating),
                comment: comment
            })
        });

        if (response.ok) {
            // Close modal
            closeModals();

            // Reload reviews
            loadProductReviews(productId);

            // Reload product data to update average rating
            loadProductData(productId);
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Failed to submit review.');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('An error occurred while submitting your review.');
    }
}

/**
 * Show the product content
 */
function showProductContent() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('product-content').classList.remove('hidden');
}

/**
 * Show error state
 */
function showErrorState(message) {
    document.getElementById('loading-state').classList.add('hidden');

    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    errorState.classList.remove('hidden');
}
