/**
 * Store Page JavaScript
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let productsPerPage = 8;
let storeId = null;
let currentFilters = {
    category: '',
    organic: false
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize store page
    initStorePage();
});

/**
 * Initialize the store page
 */
function initStorePage() {
    // Get store ID from URL
    storeId = getStoreIdFromUrl();

    if (!storeId) {
        showErrorState('Store ID is missing from the URL.');
        return;
    }

    // Load store data
    loadStoreData(storeId);

    // Initialize event listeners
    initEventListeners();
}

/**
 * Get store ID from URL
 */
function getStoreIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load store data from API
 */
async function loadStoreData(storeId) {
    try {
        const response = await fetch(`/api/stores/${storeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Store not found');
        }

        const storeData = await response.json();

        // Display store data
        displayStoreData(storeData);

        // Load categories for filter
        loadCategories();

        // Load products for this store
        loadStoreProducts(storeId);

        // Show store content
        showStoreContent();
    } catch (error) {
        console.error('Error loading store data:', error);
        showErrorState(error.message || 'Failed to load store data.');
    }
}

/**
 * Display store data in the UI
 */
function displayStoreData(store) {
    // Update page title
    document.title = `${store.name} - AgriFinPal`;

    // Update store banner
    const storeBanner = document.getElementById('store-banner');
    if (store.banner) {
        storeBanner.style.backgroundImage = `url('${store.banner}')`;
    } else {
        storeBanner.style.backgroundImage = `url('https://via.placeholder.com/1200x400?text=No+Banner')`;
    }

    // Update store name
    document.getElementById('store-name').textContent = store.name;
    document.getElementById('store-sidebar-name').textContent = store.name;

    // Update store details
    if (store.location) {
        document.getElementById('store-location').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${store.location}</span>
        `;
    } else {
        document.getElementById('store-location').classList.add('hidden');
    }

    if (store.contactInfo) {
        document.getElementById('store-contact').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>${store.contactInfo}</span>
        `;
    } else {
        document.getElementById('store-contact').classList.add('hidden');
    }

    // For email, we'll use a placeholder since it's not in the store model
    document.getElementById('store-email').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
        <span>contact@${store.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
    `;

    // Update store logo
    const storeLogoImg = document.getElementById('store-logo-img');
    if (store.logo) {
        storeLogoImg.src = store.logo;
    } else {
        storeLogoImg.src = 'https://via.placeholder.com/200?text=No+Logo';
    }
    storeLogoImg.alt = store.name;

    // Update store description
    if (store.description) {
        document.getElementById('store-description').textContent = store.description;
    } else {
        document.getElementById('store-description').textContent = 'No description available.';
    }

    // Display rating stars (using a placeholder rating for now)
    const rating = 4.5; // Placeholder rating
    displayRatingStars(rating);
    document.getElementById('store-rating-count').textContent = `(${Math.floor(Math.random() * 100) + 10})`; // Random number of reviews
}

/**
 * Display rating stars based on rating value
 */
function displayRatingStars(rating) {
    const starsContainer = document.getElementById('store-rating-stars');
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
 * Load categories for the filter dropdown
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load categories');
        }

        const categories = await response.json();

        // Populate category filter dropdown
        const categoryFilter = document.getElementById('category-filter');

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Load products for the store with current filters and pagination
 */
async function loadStoreProducts(storeId) {
    try {
        // Show loading state
        document.getElementById('products-grid').innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner small"></div>
                <p>Loading products...</p>
            </div>
        `;

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage - 1); // API uses 0-based indexing
        queryParams.append('size', productsPerPage);
        queryParams.append('storeId', storeId);

        if (currentFilters.category) {
            queryParams.append('categoryId', currentFilters.category);
        }

        if (currentFilters.organic) {
            queryParams.append('organic', true);
        }

        // Fetch products
        const response = await fetch(`/api/products?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load products');
        }

        const data = await response.json();

        // Update pagination info
        totalPages = data.totalPages || 1;
        updatePagination();

        // Update products count
        const totalProducts = data.totalElements || 0;
        document.getElementById('products-count').textContent = `Products (${totalProducts})`;

        // Display products
        displayProducts(data.content || []);

        // Show/hide no products message
        if (data.content && data.content.length === 0) {
            document.getElementById('no-products').classList.remove('hidden');
            document.getElementById('pagination').classList.add('hidden');
        } else {
            document.getElementById('no-products').classList.add('hidden');
            if (totalPages > 1) {
                document.getElementById('pagination').classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading store products:', error);
        document.getElementById('products-grid').innerHTML = `
            <div class="loading-placeholder">
                <p>Failed to load products. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Display products in the grid
 */
function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';

    if (!products || products.length === 0) {
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('a');
        productCard.href = `/product/${product.productId || product.id}`;
        productCard.className = 'product-card';

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image-container';

        // Create product image
        const productImage = document.createElement('img');
        productImage.className = 'product-image';
        productImage.src = product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';
        productImage.alt = product.name;
        productImage.loading = 'lazy';
        imageContainer.appendChild(productImage);
        productCard.appendChild(imageContainer);

        // Create product details
        const productDetails = document.createElement('div');
        productDetails.className = 'product-details';

        // Product header (title and badge)
        const productHeader = document.createElement('div');
        productHeader.className = 'product-header';

        const productTitle = document.createElement('h3');
        productTitle.className = 'product-title';
        productTitle.textContent = product.name;
        productHeader.appendChild(productTitle);

        if (product.isOrganic) {
            const organicBadge = document.createElement('span');
            organicBadge.className = 'product-badge';
            organicBadge.textContent = 'Organic';
            productHeader.appendChild(organicBadge);
        }

        productDetails.appendChild(productHeader);

        // Product description
        const productDescription = document.createElement('p');
        productDescription.className = 'product-description';
        productDescription.textContent = product.description || 'No description available.';
        productDetails.appendChild(productDescription);

        // Product footer (price and unit)
        const productFooter = document.createElement('div');
        productFooter.className = 'product-footer';

        const productPrice = document.createElement('span');
        productPrice.className = 'product-price';
        productPrice.textContent = formatCurrency(product.price);
        productFooter.appendChild(productPrice);

        const productUnit = document.createElement('span');
        productUnit.className = 'product-unit';
        productUnit.textContent = `per ${product.unit}`;
        productFooter.appendChild(productUnit);

        productDetails.appendChild(productFooter);

        productCard.appendChild(productDetails);
        productsGrid.appendChild(productCard);
    });
}

/**
 * Update pagination controls
 */
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');

    // Update page info
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    // Update button states
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    // Show pagination if there are multiple pages
    if (totalPages > 1) {
        pagination.classList.remove('hidden');
    } else {
        pagination.classList.add('hidden');
    }
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Category filter
    document.getElementById('category-filter').addEventListener('change', function(e) {
        currentFilters.category = e.target.value;
        currentPage = 1;
        loadStoreProducts(storeId);
    });

    // Organic filter
    document.getElementById('organic-filter').addEventListener('change', function(e) {
        currentFilters.organic = e.target.checked;
        currentPage = 1;
        loadStoreProducts(storeId);
    });

    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadStoreProducts(storeId);
            // Scroll to top of products
            document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadStoreProducts(storeId);
            // Scroll to top of products
            document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Clear filters button
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
}

/**
 * Clear all filters
 */
function clearFilters() {
    // Reset filter values
    document.getElementById('category-filter').value = '';
    document.getElementById('organic-filter').checked = false;

    // Reset filter state
    currentFilters = {
        category: '',
        organic: false
    };

    // Reset pagination
    currentPage = 1;

    // Reload products
    loadStoreProducts(storeId);
}

/**
 * Show the store content
 */
function showStoreContent() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('store-content').classList.remove('hidden');
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
