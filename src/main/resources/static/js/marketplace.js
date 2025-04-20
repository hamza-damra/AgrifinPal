/**
 * Marketplace page functionality
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let productsPerPage = 12;
let currentFilters = {
    search: '',
    category: '',
    organic: false
};

document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters for refresh flag
    const urlParams = new URLSearchParams(window.location.search);
    const refreshParam = urlParams.get('refresh');

    // Check sessionStorage for force refresh flag
    const forceRefresh = sessionStorage.getItem('force_refresh');

    // If either flag is set, refresh the page
    if (refreshParam === 'true' || forceRefresh === 'true') {
        console.log('Force refresh flag detected, refreshing page');

        // Remove the flags
        sessionStorage.removeItem('force_refresh');

        // Remove the refresh parameter from the URL
        if (refreshParam === 'true') {
            urlParams.delete('refresh');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, document.title, newUrl);
        }

        // Refresh the page
        window.location.reload();
        return;
    }

    // Check if we're coming from a successful payment
    const cartCleared = localStorage.getItem('cart_cleared');
    if (cartCleared === 'true') {
        console.log('Cart was cleared after payment, refreshing cart data');
        // Clear the flag
        localStorage.removeItem('cart_cleared');
        // Force refresh cart data
        updateCartCount(true);
    }

    // Initialize marketplace page
    initMarketplace();

    // Initialize cart count
    updateCartCount();

    // Set up user menu toggle
    setupUserMenu();

    // Set up mobile menu toggle
    setupMobileMenu();
});

/**
 * Initialize the marketplace page
 */
async function initMarketplace() {
    // Load categories for filter
    await loadCategories();

    // Set up event listeners
    setupEventListeners();

    // Check URL parameters for initial filters
    checkUrlParameters();

    // Update search status display
    updateSearchStatus();

    // Load initial products
    loadProducts();
}

/**
 * Check URL parameters for initial filters
 */
function checkUrlParameters() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check for search parameter
    const searchParam = urlParams.get('search');
    if (searchParam) {
        // Set search input value
        document.getElementById('search-input').value = searchParam;
        currentFilters.search = searchParam;
    }

    // Check for category parameter
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        // Set category filter value
        document.getElementById('category-filter').value = categoryParam;
        currentFilters.category = categoryParam;
    }

    // Check for organic parameter
    const organicParam = urlParams.get('organic');
    if (organicParam === 'true') {
        // Set organic filter checked
        document.getElementById('organic-filter').checked = true;
        currentFilters.organic = true;
    }
}

/**
 * Load categories for the filter dropdown
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const categories = await response.json();

        // Populate category dropdown
        const categoryFilter = document.getElementById('category-filter');

        // Clear existing options except the first one
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }

        if (categories && categories.length > 0) {
            categories.forEach(category => {
                const option = document.createElement('option');
                // Handle different API response formats
                option.value = category.categoryId || category.id;
                option.textContent = category.categoryNameEn || category.nameEn || category.name;
                categoryFilter.appendChild(option);
            });
        } else {
            // Add fallback categories if API returns empty
            addFallbackCategories(categoryFilter);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Add fallback categories if API fails
        const categoryFilter = document.getElementById('category-filter');
        addFallbackCategories(categoryFilter);
    }
}

/**
 * Add fallback categories to the dropdown
 * @param {HTMLSelectElement} categoryFilter - The category dropdown element
 */
function addFallbackCategories(categoryFilter) {
    const fallbackCategories = [
        { id: 1, name: 'Fruits' },
        { id: 2, name: 'Vegetables' },
        { id: 3, name: 'Dairy' },
        { id: 4, name: 'Meat' },
        { id: 5, name: 'Grains' },
        { id: 6, name: 'Herbs & Spices' },
        { id: 7, name: 'Nuts & Seeds' },
        { id: 8, name: 'Other' }
    ];

    fallbackCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        applyFilters();
    });

    // Search input
    const searchInput = document.getElementById('search-input');

    // Search on Enter key (redundant with form submit, but kept for compatibility)
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });

    // Add input event for search suggestions (optional)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout to avoid too many requests
        searchTimeout = setTimeout(function() {
            // If search input has at least 3 characters, we could show suggestions
            // or apply the filter automatically
            if (searchInput.value.trim().length >= 3) {
                // Uncomment the next line for auto-search
                // applyFilters();
            }
        }, 500);
    });

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', function() {
        applyFilters();
    });

    // Organic filter
    const organicFilter = document.getElementById('organic-filter');
    organicFilter.addEventListener('change', function() {
        applyFilters();
    });

    // Filter button (redundant with form submit, but kept for compatibility)
    const filterButton = document.getElementById('filter-button');
    filterButton.addEventListener('click', function(e) {
        e.preventDefault();
        applyFilters();
    });

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    clearFiltersBtn.addEventListener('click', function() {
        // Reset filters
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('organic-filter').checked = false;

        // Reset filter state
        currentFilters = {
            search: '',
            category: '',
            organic: false
        };

        // Reset pagination
        currentPage = 1;

        // Hide search status
        document.getElementById('search-status').classList.add('hidden');

        // Reload products
        loadProducts();

        // Focus on search input
        document.getElementById('search-input').focus();
    });

    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadProducts();
            // Scroll to top of products
            window.scrollTo({ top: document.getElementById('products-grid').offsetTop - 100, behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadProducts();
            // Scroll to top of products
            window.scrollTo({ top: document.getElementById('products-grid').offsetTop - 100, behavior: 'smooth' });
        }
    });
}

/**
 * Apply filters from form inputs
 */
function applyFilters() {
    // Get values from form inputs
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const organicFilter = document.getElementById('organic-filter');

    // Update filter state
    currentFilters.search = searchInput.value.trim();
    currentFilters.category = categoryFilter.value;
    currentFilters.organic = organicFilter.checked;

    // Reset to first page
    currentPage = 1;

    // Show loading indicator on filter button
    const filterButton = document.getElementById('filter-button');
    const originalButtonHtml = filterButton.innerHTML;
    filterButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Filtering...';
    filterButton.disabled = true;

    // Update search status
    updateSearchStatus();

    // Load products with new filters
    loadProducts().finally(() => {
        // Restore filter button
        filterButton.innerHTML = originalButtonHtml;
        filterButton.disabled = false;
    });
}

/**
 * Update search status display
 */
function updateSearchStatus() {
    const searchStatus = document.getElementById('search-status');
    const searchTerm = document.getElementById('search-term');

    if (currentFilters.search && currentFilters.search.trim() !== '') {
        // Show search status with current search term
        searchTerm.textContent = currentFilters.search;
        searchStatus.classList.remove('hidden');
    } else {
        // Hide search status if no search term
        searchStatus.classList.add('hidden');
    }

    // Set up clear search button
    const clearSearchBtn = document.getElementById('clear-search');
    clearSearchBtn.addEventListener('click', function() {
        // Clear search input
        document.getElementById('search-input').value = '';

        // Update filter state
        currentFilters.search = '';

        // Hide search status
        searchStatus.classList.add('hidden');

        // Reload products
        loadProducts();
    }, { once: true }); // Use once: true to prevent multiple event listeners
}

/**
 * Load products with current filters and pagination
 * @returns {Promise} A promise that resolves when products are loaded
 */
async function loadProducts() {
    // Show loading state
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('products-grid').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
    document.getElementById('no-results').classList.add('hidden');

    // Record start time to ensure minimum loading time
    const startTime = Date.now();

    try {
        // Log current filters for debugging
        console.log('Loading products with filters:', currentFilters);

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage - 1); // API uses 0-based indexing
        queryParams.append('size', productsPerPage);

        // Add search parameter if not empty
        if (currentFilters.search && currentFilters.search.trim() !== '') {
            // Use the correct parameter names expected by the backend
            queryParams.append('search', currentFilters.search.trim());
            queryParams.append('keyword', currentFilters.search.trim());
        }

        // Add category parameter if selected
        if (currentFilters.category && currentFilters.category !== '') {
            queryParams.append('categoryId', currentFilters.category);
        }

        // Add organic parameter if checked
        if (currentFilters.organic === true) {
            queryParams.append('organic', 'true');
        }

        // Default sort by name ascending
        queryParams.append('sort', 'name,asc');

        // Determine whether to use GET or POST based on search complexity
        let response;

        // For simple searches or when no search term is provided, use GET endpoint
        if (!currentFilters.search || currentFilters.search.trim().length < 3) {
            const apiUrl = `/api/products?${queryParams.toString()}`;
            console.log('Using GET endpoint for simple search:', apiUrl);
            response = await fetch(apiUrl);
        }
        // For more complex searches, use POST endpoint with request body
        else {
            console.log('Using POST endpoint for complex search');
            const searchBody = {
                keyword: currentFilters.search.trim(),
                searchTerm: currentFilters.search.trim(),
                categoryId: currentFilters.category || null,
                isOrganic: currentFilters.organic || null,
                page: currentPage - 1,
                size: productsPerPage,
                sortBy: 'productName',
                sortDirection: 'asc'
            };

            console.log('Search request body:', searchBody);

            // Get CSRF token
            const csrfToken = document.getElementById('csrf-token')?.value;
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add CSRF token if available
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            response = await fetch('/api/products/search', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(searchBody)
            });
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        // Handle different response formats from GET and POST endpoints
        let products = [];
        let totalPagesValue = 1;

        console.log('API response data:', data);

        if (data.content) {
            // Standard Spring Data response format from GET endpoint
            products = data.content;
            totalPagesValue = data.totalPages || 1;
        } else if (data.products) {
            // Custom response format from POST endpoint
            products = data.products;
            totalPagesValue = data.totalPages || 1;
        } else if (Array.isArray(data)) {
            // Direct array response
            products = data;
            totalPagesValue = 1;
        }

        console.log('Extracted products:', products);

        // Update pagination info
        totalPages = totalPagesValue;
        updatePagination();

        // Prepare the products display before hiding the loading state
        const productsGrid = document.getElementById('products-grid');
        const pagination = document.getElementById('pagination');
        const noResults = document.getElementById('no-results');

        if (products && products.length > 0) {
            console.log('Products found, preparing grid');
            // Display products but keep the grid hidden
            displayProducts(products);
        }

        // Calculate elapsed time
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; // 1 second minimum loading time to show the animation

        // If loading was too fast, delay hiding the loading state
        if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }

        // Perform the transition
        if (products && products.length > 0) {
            // First make sure the products grid is ready but hidden
            if (productsGrid) {
                productsGrid.style.opacity = '0';
                productsGrid.classList.remove('hidden');
            }
            if (pagination) pagination.classList.remove('hidden');
            if (noResults) noResults.classList.add('hidden');

            // Small delay to ensure DOM updates
            await new Promise(resolve => setTimeout(resolve, 50));

            // Fade in the products grid first
            if (productsGrid) {
                productsGrid.style.transition = 'opacity 0.5s ease-in';
                productsGrid.style.opacity = '1';
            }

            // Wait a bit for the fade-in to start, then hide loading state
            await new Promise(resolve => setTimeout(resolve, 100));

            // Hide loading state
            const loadingState = document.getElementById('loading-state');
            if (loadingState) loadingState.classList.add('hidden');
        } else {
            console.log('No products found, showing no results message');

            // Hide loading state
            const loadingState = document.getElementById('loading-state');
            if (loadingState) loadingState.classList.add('hidden');

            if (productsGrid) productsGrid.classList.add('hidden');
            if (pagination) pagination.classList.add('hidden');
            if (noResults) noResults.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading products:', error);

        // Calculate elapsed time even in error case
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1000; // 1 second minimum loading time

        // If loading was too fast, delay hiding the loading state
        if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }

        // Hide loading state with a small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 100));
        const loadingState = document.getElementById('loading-state');
        if (loadingState) loadingState.classList.add('hidden');

        // Show no results with error message
        const noResults = document.getElementById('no-results');
        if (noResults) {
            noResults.classList.remove('hidden');

            // Update the no results message to show the error
            const heading = noResults.querySelector('h2');
            if (heading) heading.textContent = 'Error Loading Products';

            const message = noResults.querySelector('p');
            if (message) message.textContent = `An error occurred: ${error.message}. Please try again later.`;
        }

        // If this is the first load and we have no products, show some sample products
        if (currentPage === 1 && !currentFilters.search && !currentFilters.category && !currentFilters.organic) {
            console.log('Showing sample products as fallback');
            displaySampleProducts();

            const productsGrid = document.getElementById('products-grid');
            if (productsGrid) productsGrid.classList.remove('hidden');

            if (noResults) noResults.classList.add('hidden');
        }
    }
}

/**
 * Display sample products when API fails
 */
function displaySampleProducts() {
    const sampleProducts = [
        {
            id: 1,
            name: 'Fresh Apples',
            description: 'Freshly picked organic apples from our local orchard. Perfect for snacks or baking.',
            price: 3.99,
            unit: '1 kg',
            isOrganic: true,
            imageUrl: 'https://picsum.photos/400/300?random=1'
        },
        {
            id: 2,
            name: 'Carrots',
            description: 'Sweet and crunchy organic carrots, great for salads or juicing.',
            price: 2.49,
            unit: '500 g',
            isOrganic: true,
            imageUrl: 'https://picsum.photos/400/300?random=2'
        },
        {
            id: 3,
            name: 'Whole Milk',
            description: 'Fresh whole milk from grass-fed cows. Pasteurized and homogenized.',
            price: 4.29,
            unit: '1 L',
            isOrganic: false,
            imageUrl: 'https://picsum.photos/400/300?random=3'
        },
        {
            id: 4,
            name: 'Chicken Breast',
            description: 'Boneless, skinless chicken breast. Perfect for grilling or baking.',
            price: 8.99,
            unit: '1 kg',
            isOrganic: false,
            imageUrl: 'https://picsum.photos/400/300?random=4'
        }
    ];

    displayProducts(sampleProducts);
}

/**
 * Display products in the grid
 */
async function displayProducts(products) {
    console.log('Starting displayProducts function');
    const productsGrid = document.getElementById('products-grid');

    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }

    productsGrid.innerHTML = '';

    if (!products || products.length === 0) {
        console.log('No products to display');
        return;
    }

    console.log('Displaying products:', products);

    // Get all cart items at once to avoid multiple API calls
    let cartItems = [];
    try {
        // Only try to get cart items if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            // Make direct API call instead of using getCartItems to avoid redirects
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (response.ok) {
                cartItems = await response.json();
                console.log('Cart items for comparison:', cartItems);
            } else {
                console.log('Failed to fetch cart items, status:', response.status);
            }
        } else {
            console.log('User not logged in, not fetching cart items');
        }
    } catch (error) {
        console.error('Error fetching cart items:', error);
    }

    products.forEach(product => {
        // Log each product for debugging
        console.log('Product:', product);

        // Get product ID (handle different API response formats)
        const productId = product.productId || product.id || 0;

        // Skip products without valid IDs
        if (!productId) {
            console.warn('Skipping product with invalid ID:', product);
            return;
        }

        // Check if product is in cart - ensure we're comparing numbers, not strings
        const productIdNum = parseInt(productId, 10);
        const inCart = cartItems.some(item => parseInt(item.productId, 10) === productIdNum);
        const cartItem = cartItems.find(item => parseInt(item.productId, 10) === productIdNum);
        console.log(`Product ${productId} in cart: ${inCart}`, cartItem);

        // Create product card container (div instead of anchor to allow for add to cart button)
        const productCardContainer = document.createElement('div');
        productCardContainer.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
        productCardContainer.dataset.productId = productId; // Add data attribute for product ID

        // Create product card (clickable area)
        const productCard = document.createElement('a');
        productCard.href = `/product/${productId}`;
        productCard.className = 'block';

        // Create product image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'h-48 overflow-hidden';

        // Create product image
        const productImage = document.createElement('img');
        // Handle different image field names
        productImage.src = product.productImage || product.imageUrl || 'https://picsum.photos/400/300?random=' + productId;
        productImage.alt = product.productName || product.name;
        productImage.className = 'w-full h-full object-cover';
        productImage.loading = 'lazy';

        // Handle image load error
        productImage.onerror = function() {
            this.src = 'https://picsum.photos/400/300?random=' + productId;
        };

        // Create product details container
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'p-4';

        // Create product header (name and organic badge)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-start mb-2';

        // Create product name
        const productName = document.createElement('h3');
        productName.className = 'text-lg font-bold text-gray-800';
        productName.textContent = product.productName || product.name;

        // Create organic badge if applicable
        const organicBadge = document.createElement('span');
        // Handle different field names for organic status
        const isOrganic = product.isOrganic === true || product.organic === true;
        if (isOrganic) {
            organicBadge.className = 'bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded';
            organicBadge.textContent = 'Organic';
        } else {
            organicBadge.className = 'bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded';
            organicBadge.textContent = 'Conventional';
        }

        // Create product description
        const productDescription = document.createElement('p');
        productDescription.className = 'text-gray-600 text-sm mb-3 line-clamp-2';
        productDescription.textContent = product.productDescription || product.description || 'No description available';

        // Create price and unit container
        const priceContainer = document.createElement('div');
        priceContainer.className = 'flex justify-between items-center mb-3';

        // Create price
        const price = document.createElement('span');
        price.className = 'text-xl font-bold text-green-700';
        // Handle different price field formats
        const productPrice = typeof product.price === 'number' ? product.price :
                           (typeof product.price === 'string' ? parseFloat(product.price) : 0);
        price.textContent = formatCurrency(productPrice);

        // Create unit
        const unit = document.createElement('span');
        unit.className = 'text-sm text-gray-500';
        unit.textContent = product.unit || 'unit';

        // Create add to cart button with different UI based on cart status
        const addToCartBtn = document.createElement('button');

        if (inCart && cartItem) {
            // Product is in cart - show "View in Cart" button
            addToCartBtn.className = 'add-to-cart-btn w-full bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5';
            addToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>In Cart (${cartItem.quantity})</span>
            `;

            // Add event listener to view cart
            addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent navigation to product page
                e.stopPropagation(); // Prevent event bubbling
                window.location.href = '/cart';
            });
        } else {
            // Product is not in cart - show "Add to Cart" button
            addToCartBtn.className = 'add-to-cart-btn w-full bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 border border-green-200 hover:border-green-300 py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5';
            addToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span>Add to Cart</span>
            `;

            // Add event listener to add to cart
            addToCartBtn.clickHandler = function(e) {
                e.preventDefault(); // Prevent navigation to product page
                e.stopPropagation(); // Prevent event bubbling
                addToCart(productId);
            };
            addToCartBtn.addEventListener('click', addToCartBtn.clickHandler);
        }

        // Assemble the product card
        headerDiv.appendChild(productName);
        headerDiv.appendChild(organicBadge);

        priceContainer.appendChild(price);
        priceContainer.appendChild(unit);

        detailsContainer.appendChild(headerDiv);
        detailsContainer.appendChild(productDescription);
        detailsContainer.appendChild(priceContainer);
        detailsContainer.appendChild(addToCartBtn);

        imageContainer.appendChild(productImage);

        productCard.appendChild(imageContainer);
        productCard.appendChild(detailsContainer);

        productCardContainer.appendChild(productCard);
        productsGrid.appendChild(productCardContainer);
    });
}

/**
 * Update pagination controls
 */
function updatePagination() {
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;

    // Enable/disable previous button
    const prevButton = document.getElementById('prev-page');
    prevButton.disabled = currentPage <= 1;

    // Enable/disable next button
    const nextButton = document.getElementById('next-page');
    nextButton.disabled = currentPage >= totalPages;
}

/**
 * Format currency for display
 */
function formatCurrency(value) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    });

    return formatter.format(value);
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

        try {
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
                console.log('Cart items:', cartItems);

                // Find the product in the cart - ensure we're comparing numbers, not strings
                const productIdNum = parseInt(productId, 10);
                const cartItem = cartItems.find(item => {
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
            } else {
                console.log(`Failed to check cart, status: ${response.status}`);
                // Assume product is not in cart if we can't check
                return {
                    success: false,
                    inCart: false,
                    message: `Failed to check cart (Status: ${response.status})`
                };
            }
        } catch (fetchError) {
            console.error('Error fetching cart:', fetchError);
            // Assume product is not in cart if we can't check
            return {
                success: false,
                inCart: false,
                message: 'Error checking cart: ' + fetchError.message
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
 * Add a product to the cart
 * @param {number} productId - The ID of the product to add
 */
async function addToCart(productId) {
    try {
        console.log(`Adding product ${productId} to cart`);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, show login modal and return
        if (!token) {
            console.log('No token found, showing login modal');
            showLoginRequiredModal();
            return;
        }

        // Check if user is a buyer
        try {
            const userRoleResponse = await fetch('/api/user-role/is-buyer', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });

            if (userRoleResponse.ok) {
                const userRoleData = await userRoleResponse.json();
                console.log('User role check result:', userRoleData);

                // If user is not a buyer but is a seller, show seller account modal
                if (!userRoleData.isBuyer && userRoleData.isSeller) {
                    console.log('User is a seller but not a buyer, showing seller account modal');
                    showSellerAccountModal();
                    return;
                }
            }
        } catch (roleError) {
            // If we can't check the role, log the error but continue anyway
            console.error('Error checking user role:', roleError);
            console.log('Continuing with cart operation despite role check error');
        }

        // Find the button for this product by data attribute
        const productCard = document.querySelector(`div[data-product-id="${productId}"]`);
        const button = productCard ? productCard.querySelector('button.add-to-cart-btn') : null;

        if (!button) {
            console.warn(`Button for product ${productId} not found`);
        }

        // Check if product is already in cart
        const checkResult = await checkProductInCart(productId);

        if (checkResult.success && checkResult.inCart) {
            console.log(`Product ${productId} is already in cart, redirecting to cart page`);

            // Show notification
            showNotification('Product is already in your cart. Redirecting to cart page...');

            // Redirect to cart page after a short delay
            setTimeout(() => {
                window.location.href = '/cart';
            }, 1000);

            return;
        }

        // Show loading state on button
        // Find all buttons for this product using the data-product-id attribute
        const productCards = document.querySelectorAll(`div[data-product-id="${productId}"]`);
        const buttons = [];
        productCards.forEach(card => {
            const btn = card.querySelector('button.add-to-cart-btn');
            if (btn) buttons.push(btn);
        });

        const originalButtonHTML = buttons.length > 0 ? buttons[0].innerHTML : '';

        buttons.forEach(button => {
            button.disabled = true;
            button.innerHTML = `
                <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Adding...</span>
            `;
        });

        try {
            // Make API call
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: 1
                })
            });

            // Parse response
            if (response.ok) {
                console.log('Product added to cart successfully');

                // Show success notification
                showNotification('Product added to cart successfully!');

                // Update cart count
                updateCartCount();

                // Update all buttons for this product to show success and change style
                updateProductButtonsToInCart(productId, 1);

                // Don't reset the button - keep the new style
            } else {
                console.log('Failed to add product to cart, status:', response.status);

                // Handle unauthorized (401) responses
                if (response.status === 401) {
                    console.log('Unauthorized access, user needs to login');
                    showLoginRequiredModal();

                    // Reset button
                    buttons.forEach(button => {
                        button.disabled = false;
                        button.innerHTML = originalButtonHTML;
                    });
                    return;
                }

                // Show error notification for other errors
                try {
                    const errorData = await response.json();
                    console.log('Error data:', errorData);

                    // Check if this is a ProductAlreadyInCartException
                    if (response.status === 400 && errorData.message && errorData.message.includes('already in cart')) {
                        console.log('Product already in cart, showing notification and redirecting');

                        // Get the existing item data if available
                        const existingItem = errorData.data;
                        const quantity = existingItem ? existingItem.quantity : 1;

                        // Show notification
                        showNotification('Product is already in your cart. Redirecting to cart page...');

                        // Update button to show it's in cart
                        updateProductButtonsToInCart(productId, quantity);

                        // Redirect to cart page after a short delay
                        setTimeout(() => {
                            window.location.href = '/cart';
                        }, 1000);

                        return;
                    }

                    // Log the full error message for debugging
                    console.log('Full error message:', errorData.message);
                    showNotification(errorData.message || 'Failed to add product to cart', 'error');
                } catch (jsonError) {
                    console.log('Error parsing JSON response:', jsonError);
                    showNotification(`Failed to add product to cart (Status: ${response.status})`, 'error');
                }

                // Reset button
                buttons.forEach(button => {
                    button.disabled = false;
                    button.innerHTML = originalButtonHTML;
                });
            }
        } catch (fetchError) {
            console.error('Network error while adding to cart:', fetchError);
            showNotification('Network error: ' + fetchError.message, 'error');

            // Reset button
            buttons.forEach(button => {
                button.disabled = false;
                button.innerHTML = originalButtonHTML;
            });
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Error adding product to cart: ' + error.message, 'error');

        // Reset all add to cart buttons
        const buttons = document.querySelectorAll('.add-to-cart-btn');
        buttons.forEach(button => {
            button.disabled = false;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
                <span>Add to Cart</span>
            `;
        });
    }
}

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
                cartCountElement.textContent = cartCount;

                // Show/hide cart count
                if (cartCount > 0) {
                    cartCountElement.classList.remove('hidden');
                } else {
                    cartCountElement.classList.add('hidden');
                }

                // Update any in-cart buttons if we have product cards on the page
                if (forceRefresh) {
                    updateProductButtonsAfterCartChange(data);
                }
            } else {
                console.log(`Failed to get cart count, status: ${response.status}`);
                // Hide cart count on error
                document.getElementById('cart-count').classList.add('hidden');
            }
        } catch (fetchError) {
            console.error('Error fetching cart count:', fetchError);
            // Hide cart count on error
            document.getElementById('cart-count').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
        // Hide cart count on error
        document.getElementById('cart-count').classList.add('hidden');
    }
}

// Make the function globally accessible
window.updateCartCount = updateCartCount;

/**
 * Show a notification
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (success or error)
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // Set message
    notificationMessage.textContent = message;

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

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

/**
 * Set up user menu toggle
 */
function setupUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');

    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', function() {
            userMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
}

/**
 * Set up mobile menu toggle
 */
function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * Show login required modal
 */
function showLoginRequiredModal() {
    const modal = document.getElementById('login-required-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Add event listener to close modal when clicking outside
        document.addEventListener('click', closeModalOnOutsideClick);
    }
}

// Make the function globally accessible
window.showLoginRequiredModal = showLoginRequiredModal;

/**
 * Close login modal
 */
function closeLoginModal() {
    const modal = document.getElementById('login-required-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // Remove event listener if no other modals are open
        const sellerModal = document.getElementById('seller-account-modal');
        if (!sellerModal || sellerModal.classList.contains('hidden')) {
            document.removeEventListener('click', closeModalOnOutsideClick);
        }
    }
}

// Make the function globally accessible
window.closeLoginModal = closeLoginModal;

/**
 * Close modal when clicking outside
 */
function closeModalOnOutsideClick(event) {
    const loginModal = document.getElementById('login-required-modal');
    const sellerModal = document.getElementById('seller-account-modal');

    // Check login modal
    if (loginModal && loginModal.classList.contains('flex')) {
        const loginModalContent = loginModal.querySelector('.relative');
        if (loginModalContent && !loginModalContent.contains(event.target)) {
            closeLoginModal();
        }
    }

    // Check seller modal
    if (sellerModal && sellerModal.classList.contains('flex')) {
        const sellerModalContent = sellerModal.querySelector('.relative');
        if (sellerModalContent && !sellerModalContent.contains(event.target)) {
            closeSellerModal();
        }
    }
}

/**
 * Show seller account modal
 */
function showSellerAccountModal() {
    const modal = document.getElementById('seller-account-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Add event listener to close modal when clicking outside
        document.addEventListener('click', closeModalOnOutsideClick);
    }
}

// Make the function globally accessible
window.showSellerAccountModal = showSellerAccountModal;

/**
 * Close seller account modal
 */
function closeSellerModal() {
    const modal = document.getElementById('seller-account-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');

        // Remove event listener if no other modals are open
        const loginModal = document.getElementById('login-required-modal');
        if (!loginModal || loginModal.classList.contains('hidden')) {
            document.removeEventListener('click', closeModalOnOutsideClick);
        }
    }
}

// Make the function globally accessible
window.closeSellerModal = closeSellerModal;

/**
 * Update all buttons for a product to show it's in the cart
 * @param {number} productId - The ID of the product
 * @param {number} quantity - The quantity in cart
 */
function updateProductButtonsToInCart(productId, quantity) {
    // Find all product cards for this product
    const productCards = document.querySelectorAll(`div[data-product-id="${productId}"]`);

    productCards.forEach(card => {
        const button = card.querySelector('button.add-to-cart-btn');
        if (!button) return;

        // Update button style and content
        button.disabled = false;
        button.classList.remove('from-green-50', 'to-green-100', 'text-green-700', 'border-green-200');
        button.classList.add('from-blue-50', 'to-blue-100', 'text-blue-700', 'border-blue-200');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span>In Cart (${quantity})</span>
        `;

        // Change event listener to go to cart
        if (button.clickHandler) {
            button.removeEventListener('click', button.clickHandler);
        }

        button.clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/cart';
        };

        button.addEventListener('click', button.clickHandler);
    });
}

/**
 * Update product buttons after cart changes
 * @param {Array} cartItems - The current cart items
 */
function updateProductButtonsAfterCartChange(cartItems) {
    console.log('Updating product buttons after cart change');

    try {
        // Get all product cards on the page
        const productCards = document.querySelectorAll('[data-product-id]');
        if (productCards.length === 0) {
            console.log('No product cards found on page');
            return;
        }

        console.log(`Found ${productCards.length} product cards on page`);

        // Process each product card
        productCards.forEach(card => {
            const productId = parseInt(card.dataset.productId, 10);
            const button = card.querySelector('button.add-to-cart-btn');

            if (!button) {
                console.log(`No add-to-cart button found for product ${productId}`);
                return;
            }

            // Check if this product is in the cart
            const cartItem = cartItems.find(item => parseInt(item.productId, 10) === productId);

            if (cartItem) {
                // Product is in cart - update button to show "In Cart"
                console.log(`Product ${productId} is in cart with quantity ${cartItem.quantity}`);
                updateProductButtonsToInCart(productId, cartItem.quantity);
            } else {
                // Product is not in cart - reset button to "Add to Cart"
                console.log(`Product ${productId} is not in cart`);

                // Reset button style and content
                button.disabled = false;
                button.classList.remove('from-blue-50', 'to-blue-100', 'text-blue-700', 'border-blue-200');
                button.classList.add('from-green-50', 'to-green-100', 'text-green-700', 'border-green-200');
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span>Add to Cart</span>
                `;

                // Change event listener to add to cart
                if (button.clickHandler) {
                    button.removeEventListener('click', button.clickHandler);
                }

                button.clickHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(productId);
                };

                button.addEventListener('click', button.clickHandler);
            }
        });
    } catch (error) {
        console.error('Error updating product buttons:', error);
    }
}
