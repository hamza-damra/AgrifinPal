/**
 * Product Details Page JavaScript
 */

// State variables
let productId = null;
let product = null;
let reviews = [];
let relatedProducts = [];
let selectedRating = 0;
let cartItem = null; // Store cart item if product is already in cart

document.addEventListener('DOMContentLoaded', function() {
    // Initialize product details page
    initProductDetailsPage();

    // Listen for language changes
    document.addEventListener('translationComplete', function(e) {
        // Update dynamic content that might not have data-i18n attributes
        if (product) {
            updateProductAvailabilityText();
        }
    });

    // Add direct language switching functionality
    const languageSelector = document.getElementById('language-selector');
    if (languageSelector) {
        console.log('Setting up language selector in product-details.js');
        languageSelector.addEventListener('change', function() {
            console.log('Language changed in product-details.js to:', this.value);
            // Call the global changeLanguage function
            if (typeof window.changeLanguage === 'function') {
                window.changeLanguage(this.value);
            } else {
                console.error('Global changeLanguage function not found');
            }
        });
    }
});

/**
 * Initialize the product details page
 */
function initProductDetailsPage() {
    // Get product ID from URL
    productId = getProductIdFromUrl();

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
    // Get the path from the URL
    const path = window.location.pathname;
    // Extract the product ID from the path (assuming format: /product/{id})
    const matches = path.match(/\/product\/(\d+)/);

    if (matches && matches.length > 1) {
        console.log('Found product ID in URL:', matches[1]);
        return matches[1];
    }

    console.warn('No product ID found in URL path:', path);
    return null;
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked tab
            this.classList.add('active');

            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });

            // Show corresponding tab content
            const tabId = this.id.replace('tab-', 'content-');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.remove('hidden');
                tabContent.classList.add('active');
            }
        });
    });

    // Add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        // Check if product is already in cart
        if (cartItem) {
            // If product is already in cart, set up the button to go directly to cart
            setupViewCartButton();
        } else {
            // If product is not in cart, set up normal add to cart functionality
            addToCartBtn.addEventListener('click', addToCart);
        }
    }

    // Write review button
    const writeReviewBtn = document.getElementById('write-review-btn');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', openReviewModal);
    }

    // Cancel review button
    const cancelReviewBtn = document.getElementById('cancel-review-btn');
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', closeReviewModal);
    }

    // Submit review button
    const submitReviewBtn = document.getElementById('submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }

    // Rating stars in review form
    document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            setSelectedRating(rating);
        });

        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });

        star.addEventListener('mouseout', function() {
            highlightStars(selectedRating);
        });
    });

    // Quantity input validation
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            validateQuantity(this);
        });
    }
}

/**
 * Load product data from API
 */
async function loadProductData(productId) {
    try {
        console.log('Fetching product data for ID:', productId);
        const response = await fetch(`/api/products/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('API returned error status:', response.status);
            throw new Error('Product not found');
        }

        product = await response.json();
        console.log('Product data:', product);

        // Check if product is already in cart
        await checkIfProductInCart(productId);
        console.log('Cart item check complete, cartItem:', cartItem);

        // Display product data
        displayProductData(product);

        // Load reviews for this product
        loadProductReviews(productId);

        // Load related products
        loadRelatedProducts(product.categoryId);

        // Show product content
        showProductContent();
    } catch (error) {
        console.error('Error loading product data:', error);
        showErrorState(error.message || 'Failed to load product data.');
    }
}

/**
 * Check if the product is already in the cart
 */
async function checkIfProductInCart(productId) {
    try {
        // Check if product is in cart
        const result = await checkProductInCart(parseInt(productId));

        if (result.success && result.inCart) {
            cartItem = result.cartItem;
            console.log('Product is already in cart:', cartItem);
        } else {
            cartItem = null;
        }
    } catch (error) {
        console.error('Error checking if product is in cart:', error);
        cartItem = null;
    }
}

/**
 * Check if a product is already in the cart
 * @param {number} productId - The ID of the product to check
 * @returns {Promise<Object>} - The response with cart item details if found
 */
async function checkProductInCart(productId) {
    try {
        console.log(`Checking if product ${productId} is in cart`);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, return false (not in cart)
        if (!token) {
            return { success: false, inCart: false, message: 'Authentication required' };
        }

        // Make API call to get cart items
        const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        // Parse response
        if (response.ok) {
            const cartItems = await response.json();

            // Find the product in the cart
            const cartItem = cartItems.find(item => item.productId === productId);

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
        } else {
            return {
                success: false,
                inCart: false,
                message: 'Failed to check cart'
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
 * Display product data in the UI
 */
function displayProductData(product) {
    // Update page title
    document.title = `${product.productName || product.name} - AgriFinPal`;

    // Update product details
    document.getElementById('product-name').textContent = product.productName || product.name;
    document.getElementById('product-description').textContent = product.productDescription || product.description;
    document.getElementById('product-price').textContent = formatCurrency(product.price);
    document.getElementById('product-unit').textContent = `per ${product.unit}`;
    updateProductAvailabilityText();

    // Set product image
    const productImage = document.getElementById('product-image');
    productImage.src = product.productImage || product.imageUrl || 'https://picsum.photos/800/600?random=1';
    productImage.alt = product.productName || product.name;

    // Show organic badge if applicable
    if (product.isOrganic) {
        document.getElementById('organic-badge').classList.remove('hidden');
    }

    // Update availability badge
    const availabilityBadge = document.getElementById('availability-badge');
    if (product.isAvailable && product.quantity > 0) {
        availabilityBadge.textContent = 'In Stock';
        availabilityBadge.classList.add('text-green-600');
    } else {
        availabilityBadge.textContent = 'Out of Stock';
        availabilityBadge.classList.add('text-red-600');
    }

    // Set max quantity
    const quantityInput = document.getElementById('quantity');
    quantityInput.max = product.quantity;
    quantityInput.disabled = !product.isAvailable || product.quantity <= 0;

    // Update add to cart button
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    if (!product.isAvailable || product.quantity <= 0) {
        // Product is not available
        addToCartBtn.disabled = true;
        addToCartBtn.classList.add('bg-gray-400');
        addToCartBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        addToCartBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            <span data-i18n="product.outOfStock">Out of Stock</span>
        `;
    } else if (cartItem) {
        // Product is already in cart - set up the View Cart button
        setupViewCartButton();
    }

    // Update product details tab
    document.getElementById('product-category').textContent = product.categoryName;
    document.getElementById('product-organic').textContent = product.isOrganic ? 'Yes' : 'No';
    document.getElementById('product-unit-detail').textContent = product.unit;

    // Update seller tab
    document.getElementById('store-name').textContent = product.storeName;
    document.getElementById('store-link').href = `/store/${product.storeId}`;

    // Format dates
    if (product.createdAt) {
        document.getElementById('product-created-at').textContent = formatDate(product.createdAt);
    }
    if (product.updatedAt) {
        document.getElementById('product-updated-at').textContent = formatDate(product.updatedAt);
    }

    // Display rating stars
    displayRatingStars(product.averageRating || 0, 'rating-stars');
    const reviewsText = getTranslation('product.reviews', 'reviews');
    document.getElementById('review-count').textContent = `(${product.reviewCount || 0} ${reviewsText})`;
}

/**
 * Update product availability text with proper translation
 */
function updateProductAvailabilityText() {
    if (!product) return;

    const availableText = getTranslation('product.available', 'available');
    document.getElementById('product-availability').textContent = `${product.quantity} ${product.unit} ${availableText}`;
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

        reviews = await response.json();
        console.log('Reviews:', reviews);

        // Display reviews
        displayReviews(reviews);
    } catch (error) {
        console.error('Error loading reviews:', error);
        // Show empty reviews state
        document.getElementById('reviews-list').innerHTML = `
            <div class="text-center py-8 text-gray-500">
                No reviews yet. Be the first to review this product!
            </div>
        `;
    }
}

/**
 * Display reviews in the UI
 */
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');

    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                No reviews yet. Be the first to review this product!
            </div>
        `;
        return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Update average rating display
    document.getElementById('average-rating').textContent = averageRating.toFixed(1);
    document.getElementById('total-reviews').textContent = `${reviews.length} reviews`;
    displayRatingStars(averageRating, 'average-rating-stars');

    // Display reviews
    reviewsList.innerHTML = '';
    reviews.forEach(review => {
        const reviewDate = new Date(review.createdAt);
        const formattedDate = reviewDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="review-author">${review.userName || 'Anonymous'}</span>
                <span class="review-date">${formattedDate}</span>
            </div>
            <div class="review-rating">
                ${generateStarRating(review.rating)}
            </div>
            <p class="review-content">${review.comment || ''}</p>
        `;

        reviewsList.appendChild(reviewItem);
    });
}

/**
 * Load related products
 */
async function loadRelatedProducts(categoryId) {
    if (!categoryId) return;

    try {
        const response = await fetch(`/api/products/category/${categoryId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load related products');
        }

        let products = await response.json();

        // Filter out current product and limit to 4 products
        products = products
            .filter(p => p.productId !== parseInt(productId))
            .slice(0, 4);

        relatedProducts = products;
        console.log('Related products:', relatedProducts);

        // Display related products
        displayRelatedProducts(relatedProducts);
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

/**
 * Display related products
 */
function displayRelatedProducts(products) {
    const relatedProductsContainer = document.getElementById('related-products');

    if (!products || products.length === 0) {
        relatedProductsContainer.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                No related products found.
            </div>
        `;
        return;
    }

    relatedProductsContainer.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('a');
        productCard.href = `/product/${product.productId}`;
        productCard.className = 'related-product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';

        productCard.innerHTML = `
            <div class="h-48 overflow-hidden">
                <img src="${product.productImage || product.imageUrl || 'https://picsum.photos/400/300?random=' + product.productId}"
                     alt="${product.productName || product.name}"
                     class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">${product.productName || product.name}</h3>
                    ${product.isOrganic ? '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Organic</span>' : ''}
                </div>
                <p class="text-gray-600 text-sm line-clamp-2 mb-2">${product.productDescription || product.description || ''}</p>
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-gray-900">${formatCurrency(product.price)}</span>
                    <span class="text-sm text-gray-500">per ${product.unit}</span>
                </div>
            </div>
        `;

        relatedProductsContainer.appendChild(productCard);
    });
}

/**
 * Add product to cart
 */
function addToCart() {
    if (!product) return;

    const quantity = parseInt(document.getElementById('quantity').value);
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    // Create cart item
    const cartItem = {
        productId: product.productId,
        name: product.productName || product.name,
        price: product.price,
        quantity: quantity,
        unit: product.unit,
        imageUrl: product.productImage || product.imageUrl
    };

    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.productId === cartItem.productId);
    if (existingItemIndex !== -1) {
        // Update quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        cart.push(cartItem);
    }

    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Show notification
    showCartNotification();
}

/**
 * Show cart notification
 */
function showCartNotification() {
    const notification = document.getElementById('cart-notification');
    notification.classList.remove('translate-y-full', 'opacity-0');
    notification.classList.add('notification-show');

    // Hide notification after animation completes
    setTimeout(() => {
        notification.classList.remove('notification-show');
        notification.classList.add('translate-y-full', 'opacity-0');
    }, 3000);
}

/**
 * Open review modal
 */
function openReviewModal() {
    document.getElementById('review-modal').classList.remove('hidden');
    resetReviewForm();
}

/**
 * Close review modal
 */
function closeReviewModal() {
    document.getElementById('review-modal').classList.add('hidden');
}

/**
 * Reset review form
 */
function resetReviewForm() {
    document.getElementById('review-form').reset();
    setSelectedRating(0);
    document.getElementById('rating-text').textContent = 'Select a rating';
}

/**
 * Set selected rating
 */
function setSelectedRating(rating) {
    selectedRating = rating;
    document.getElementById('rating').value = rating;

    // Update rating text
    const ratingText = document.getElementById('rating-text');
    if (rating === 0) {
        ratingText.textContent = 'Select a rating';
    } else {
        ratingText.textContent = `${rating} star${rating !== 1 ? 's' : ''}`;
    }

    // Highlight stars
    highlightStars(rating);
}

/**
 * Highlight rating stars
 */
function highlightStars(rating) {
    document.querySelectorAll('.rating-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

/**
 * Submit review
 */
async function submitReview() {
    const rating = parseInt(document.getElementById('rating').value);
    const title = document.getElementById('review-title').value.trim();
    const content = document.getElementById('review-content').value.trim();

    // Validate input
    if (rating === 0) {
        alert('Please select a rating');
        return;
    }

    if (!content) {
        alert('Please enter a review');
        return;
    }

    // Create review object
    const review = {
        productId: productId,
        rating: rating,
        comment: content // Changed from 'content' to 'comment' to match backend expectations
    };

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

        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(review)
        });

        if (!response.ok) {
            throw new Error('Failed to submit review');
        }

        // Close modal
        closeReviewModal();

        // Reload reviews
        loadProductReviews(productId);

        // Show success message
        alert('Review submitted successfully!');
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again later.');
    }
}

/**
 * Validate quantity input
 */
function validateQuantity(input) {
    const value = parseInt(input.value);
    const max = parseInt(input.max);

    if (isNaN(value) || value < 1) {
        input.value = 1;
    } else if (value > max) {
        input.value = max;
    }
}

/**
 * Display rating stars
 */
function displayRatingStars(rating, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('div');

        if (i <= Math.floor(rating)) {
            // Full star
            star.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            // Half star
            star.innerHTML = `
                <div class="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div class="absolute top-0 left-0 w-1/2 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 fill-current" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                </div>
            `;
        } else {
            // Empty star
            star.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        }

        container.appendChild(star);
    }
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    let starsHtml = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            // Full star
            starsHtml += `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
            // Half star
            starsHtml += `
                <div class="relative inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div class="absolute top-0 left-0 w-1/2 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                </div>
            `;
        } else {
            // Empty star
            starsHtml += `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 inline" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            `;
        }
    }

    return starsHtml;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Show product content
 */
function showProductContent() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('product-content').classList.remove('hidden');
}

/**
 * Set up the View Cart button when product is already in cart
 */
function setupViewCartButton() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (!addToCartBtn) return;

    // Update button style and text
    addToCartBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
    addToCartBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
    addToCartBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>View Cart</span>
    `;

    // Remove all existing event listeners
    const newButton = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newButton, addToCartBtn);

    // Add direct navigation to cart
    newButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/cart';
    });
}

/**
 * Show error state
 */
function showErrorState(message) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').textContent = message || 'We couldn\'t find the product you\'re looking for.';
}

/**
 * Add product to cart or view cart
 */
async function addToCart() {
    try {
        console.log(`Adding product ${productId} to cart`);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, show login modal and return
        if (!token) {
            console.log('No token found, showing login required notification');
            showCartNotification('Please log in to add products to your cart', 'error');
            return;
        }

        // Check if product is already in cart
        const checkResult = await checkProductInCart(productId);

        if (checkResult.success && checkResult.inCart) {
            console.log(`Product ${productId} is already in cart, redirecting to cart page`);

            // Show notification
            showCartNotification('Product is already in your cart. Redirecting to cart page...');

            // Update button to show it's redirecting
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Going to Cart...</span>
            `;

            // Redirect to cart page after a short delay
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1000);

            return;
        }

        // Get quantity
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value, 10);

        if (isNaN(quantity) || quantity < 1) {
            alert('Please enter a valid quantity');
            return;
        }

        // Disable button during API call
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const originalButtonText = addToCartBtn.innerHTML;
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Adding...</span>
        `;

        // Make API call
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

        // Parse response
        if (response.ok) {
            console.log('Product added to cart successfully');

            // Show success notification
            showCartNotification('Product added to cart successfully!');

            // Set up the View Cart button
            setupViewCartButton();

            // After a short delay, redirect to cart page
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1500);

            // Reset quantity
            quantityInput.value = '1';
        } else {
            console.log('Failed to add product to cart, status:', response.status);

            // Handle unauthorized (401) responses
            if (response.status === 401) {
                console.log('Unauthorized access, user needs to login');
                showCartNotification('Please log in to add products to your cart', 'error');

                // Reset button
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = originalButtonText;
                return;
            }

            // Show error notification for other errors
            try {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                showCartNotification(errorData.message || 'Failed to add product to cart', 'error');
            } catch (jsonError) {
                console.log('Error parsing JSON response:', jsonError);
                showCartNotification(`Failed to add product to cart (Status: ${response.status})`, 'error');
            }

            // Reset button
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = originalButtonText;
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showCartNotification('Error adding product to cart: ' + error.message, 'error');

        // Reset button
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span>Add to Cart</span>
            `;
        }
    }
}

// We're now using the cart-api.js functions instead of direct fetch calls

/**
 * Show cart notification
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (success or error)
 */
function showCartNotification(message = 'Added to cart!', type = 'success') {
    const notification = document.getElementById('cart-notification');
    if (notification) {
        // Update notification message if provided
        const messageElement = notification.querySelector('span');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // Set color based on type
        if (type === 'error') {
            notification.classList.remove('bg-green-600');
            notification.classList.add('bg-red-600');
        } else {
            notification.classList.remove('bg-red-600');
            notification.classList.add('bg-green-600');
        }

        // Show notification
        notification.classList.remove('hidden');

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}
