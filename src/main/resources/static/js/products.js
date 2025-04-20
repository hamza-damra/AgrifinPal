/**
 * Products Page JavaScript
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let productsPerPage = 9;
let currentFilters = {
    search: '',
    category: '',
    sort: 'name_asc',
    organic: false
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize products page
    initProductsPage();
});

/**
 * Initialize the products page
 */
function initProductsPage() {
    // Load categories for filter
    loadCategories();

    // Load initial products
    loadProducts();

    // Initialize event listeners
    initEventListeners();
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
 * Load products with current filters and pagination
 */
async function loadProducts() {
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

        if (currentFilters.search) {
            queryParams.append('search', currentFilters.search);
        }

        if (currentFilters.category) {
            queryParams.append('categoryId', currentFilters.category);
        }

        if (currentFilters.organic) {
            queryParams.append('organic', true);
        }

        // Handle sorting
        if (currentFilters.sort) {
            const [field, direction] = currentFilters.sort.split('_');
            queryParams.append('sort', `${field},${direction}`);
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

        // Display products
        displayProducts(data.content || []);

        // Show content
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('products-content').classList.remove('hidden');

        // Show/hide no results message
        if (data.content && data.content.length === 0) {
            document.getElementById('no-results').classList.remove('hidden');
        } else {
            document.getElementById('no-results').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showErrorState('Failed to load products. Please try again.');
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
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image-container';

        // Create product image
        const productImage = document.createElement('img');
        productImage.className = 'product-image';
        productImage.src = product.imageUrl || 'https://via.placeholder.com/300x225?text=No+Image';
        productImage.alt = product.name;
        productImage.loading = 'lazy';
        imageContainer.appendChild(productImage);

        // Add organic badge if applicable
        if (product.isOrganic) {
            const organicBadge = document.createElement('div');
            organicBadge.className = 'product-badge';
            organicBadge.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M2 22s4-2 8-2 8 2 8 2"></path><path d="M2 22V9a4 4 0 0 1 4-4h.5"></path><path d="M22 22V9a4 4 0 0 0-4-4h-.5"></path><path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M12 19v-4"></path><path d="M8 15h8"></path></svg>
                Organic
            `;
            imageContainer.appendChild(organicBadge);
        }

        productCard.appendChild(imageContainer);

        // Create product info
        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';

        // Product name
        const productName = document.createElement('h3');
        productName.className = 'product-name';
        productName.textContent = product.name;
        productInfo.appendChild(productName);

        // Product price
        const productPrice = document.createElement('div');
        productPrice.className = 'product-price';
        productPrice.innerHTML = `
            ${formatCurrency(product.price)}
            <span class="product-unit">per ${product.unit}</span>
        `;
        productInfo.appendChild(productPrice);

        // Product rating
        const productRating = document.createElement('div');
        productRating.className = 'product-rating';

        const ratingStars = document.createElement('div');
        ratingStars.className = 'rating-stars';

        // Create stars based on rating
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('div');
            star.className = i <= (product.averageRating || 0) ? 'star filled' : 'star empty';
            star.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            `;
            ratingStars.appendChild(star);
        }

        productRating.appendChild(ratingStars);

        const reviewCount = document.createElement('span');
        reviewCount.className = 'review-count';
        reviewCount.textContent = `(${product.reviewCount || 0})`;
        productRating.appendChild(reviewCount);

        productInfo.appendChild(productRating);

        // Product footer
        const productFooter = document.createElement('div');
        productFooter.className = 'product-footer';

        // Store info
        const productStore = document.createElement('div');
        productStore.className = 'product-store';
        productStore.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            ${product.store ? product.store.name : 'Unknown Store'}
        `;
        productFooter.appendChild(productStore);

        // View product button
        const viewProductBtn = document.createElement('a');
        viewProductBtn.className = 'view-product-btn';
        viewProductBtn.href = `/product/${product.productId || product.id}`;
        viewProductBtn.textContent = 'View';
        productFooter.appendChild(viewProductBtn);

        productInfo.appendChild(productFooter);

        productCard.appendChild(productInfo);

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
    // Search input
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchBtn.addEventListener('click', handleSearch);

    // Category filter
    document.getElementById('category-filter').addEventListener('change', function(e) {
        currentFilters.category = e.target.value;
        currentPage = 1;
        loadProducts();
    });

    // Sort filter
    document.getElementById('sort-filter').addEventListener('change', function(e) {
        currentFilters.sort = e.target.value;
        loadProducts();
    });

    // Organic filter
    document.getElementById('organic-filter').addEventListener('change', function(e) {
        currentFilters.organic = e.target.checked;
        currentPage = 1;
        loadProducts();
    });

    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
            // Scroll to top of products
            document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts();
            // Scroll to top of products
            document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Clear filters button
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', function() {
        document.getElementById('error-state').classList.add('hidden');
        document.getElementById('loading-state').classList.remove('hidden');
        loadProducts();
    });
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    currentFilters.search = searchInput.value.trim();
    currentPage = 1;
    loadProducts();
}

/**
 * Clear all filters
 */
function clearFilters() {
    // Reset filter values
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('sort-filter').value = 'name_asc';
    document.getElementById('organic-filter').checked = false;

    // Reset filter state
    currentFilters = {
        search: '',
        category: '',
        sort: 'name_asc',
        organic: false
    };

    // Reset pagination
    currentPage = 1;

    // Reload products
    loadProducts();
}

/**
 * Show error state
 */
function showErrorState(message) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('products-content').classList.add('hidden');

    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    errorState.classList.remove('hidden');
}
