/**
 * Stores Page JavaScript
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let storesPerPage = 9;
let currentFilters = {
    search: '',
    region: '',
    sort: 'name_asc'
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize stores page
    initStoresPage();
});

/**
 * Initialize the stores page
 */
function initStoresPage() {
    // Load regions for filter
    loadRegions();

    // Load initial stores
    loadStores();

    // Initialize event listeners
    initEventListeners();
}

/**
 * Load regions for the filter dropdown
 */
async function loadRegions() {
    try {
        // Fetch regions from the API
        const response = await fetch('/api/regions/stores', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load regions');
        }

        const regions = await response.json();

        // Populate region filter dropdown
        const regionFilter = document.getElementById('region-filter');

        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            regionFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading regions:', error);
        // Fallback to default regions if API fails
        const defaultRegions = [
            { id: 'northern-region', name: 'Northern Region' },
            { id: 'central-region', name: 'Central Region' },
            { id: 'southern-region', name: 'Southern Region' },
            { id: 'eastern-region', name: 'Eastern Region' },
            { id: 'western-region', name: 'Western Region' }
        ];

        const regionFilter = document.getElementById('region-filter');

        defaultRegions.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.name;
            regionFilter.appendChild(option);
        });
    }
}

/**
 * Load stores with current filters and pagination
 */
async function loadStores() {
    try {
        // Show loading state
        document.getElementById('stores-grid').innerHTML = `
            <div class="loading-placeholder">
                <div class="spinner small"></div>
                <p>Loading stores...</p>
            </div>
        `;

        // Build query parameters
        const queryParams = new URLSearchParams();

        // If region filter is applied, use the region-specific endpoint
        let apiUrl = '/api/stores';

        if (currentFilters.region) {
            // Convert region ID back to the actual region name
            // This assumes the region ID is in the format 'region-name' (lowercase with hyphens)
            const regionName = currentFilters.region
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            apiUrl = `/api/stores/region/${encodeURIComponent(regionName)}`;
        }

        // Add search parameter if provided
        if (currentFilters.search) {
            queryParams.append('search', currentFilters.search);
        }

        // Handle sorting
        if (currentFilters.sort) {
            const [field, direction] = currentFilters.sort.split('_');
            queryParams.append('sort', `${field},${direction}`);
        }

        // Add pagination parameters
        queryParams.append('page', currentPage - 1); // API uses 0-based indexing
        queryParams.append('size', storesPerPage);

        // Fetch stores
        const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load stores');
        }

        const data = await response.json();

        // Update pagination info
        totalPages = data.totalPages || 1;
        updatePagination();

        // Display stores
        displayStores(data.content || []);

        // Show content
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('stores-content').classList.remove('hidden');

        // Show/hide no results message
        if (data.content && data.content.length === 0) {
            document.getElementById('no-results').classList.remove('hidden');
        } else {
            document.getElementById('no-results').classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        showErrorState('Failed to load stores. Please try again.');
    }
}

/**
 * Display stores in the grid
 */
function displayStores(stores) {
    const storesGrid = document.getElementById('stores-grid');
    storesGrid.innerHTML = '';

    if (!stores || stores.length === 0) {
        return;
    }

    stores.forEach(store => {
        const storeCard = document.createElement('a');
        storeCard.href = `/store?id=${store.id}`;
        storeCard.className = 'store-card';

        // Create store banner
        const storeBanner = document.createElement('div');
        storeBanner.className = 'store-banner';

        const storeBannerImg = document.createElement('img');
        storeBannerImg.className = 'store-banner-img';
        storeBannerImg.src = store.banner || 'https://via.placeholder.com/800x320?text=No+Banner';
        storeBannerImg.alt = store.name;
        storeBannerImg.loading = 'lazy';
        storeBanner.appendChild(storeBannerImg);

        // Create store logo container
        const storeLogoContainer = document.createElement('div');
        storeLogoContainer.className = 'store-logo-container';

        const storeLogo = document.createElement('img');
        storeLogo.className = 'store-logo';
        storeLogo.src = store.logo || 'https://via.placeholder.com/200?text=No+Logo';
        storeLogo.alt = `${store.name} logo`;
        storeLogoContainer.appendChild(storeLogo);

        storeBanner.appendChild(storeLogoContainer);
        storeCard.appendChild(storeBanner);

        // Create store content
        const storeContent = document.createElement('div');
        storeContent.className = 'store-content';

        // Store header
        const storeHeader = document.createElement('div');
        storeHeader.className = 'store-header';

        const storeName = document.createElement('h3');
        storeName.className = 'store-name';
        storeName.textContent = store.name;
        storeHeader.appendChild(storeName);

        // Store rating
        const storeRating = document.createElement('div');
        storeRating.className = 'store-rating';

        const ratingStars = document.createElement('div');
        ratingStars.className = 'rating-stars';

        // Create stars based on rating (using a placeholder rating for now)
        const rating = 4.5; // Placeholder rating
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('div');
            star.className = i <= rating ? 'star filled' : 'star empty';
            star.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            `;
            ratingStars.appendChild(star);
        }

        storeRating.appendChild(ratingStars);

        const ratingCount = document.createElement('span');
        ratingCount.className = 'rating-count';
        ratingCount.textContent = `(${Math.floor(Math.random() * 100) + 10})`; // Random number of reviews
        storeRating.appendChild(ratingCount);

        storeHeader.appendChild(storeRating);
        storeContent.appendChild(storeHeader);

        // Store description
        const storeDescription = document.createElement('p');
        storeDescription.className = 'store-description';
        storeDescription.textContent = store.description || 'No description available.';
        storeContent.appendChild(storeDescription);

        // Store footer
        const storeFooter = document.createElement('div');
        storeFooter.className = 'store-footer';

        // Store location
        const storeLocation = document.createElement('div');
        storeLocation.className = 'store-location';
        storeLocation.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${store.location || 'Location not specified'}
        `;
        storeFooter.appendChild(storeLocation);

        // Store products count
        const storeProductsCount = document.createElement('div');
        storeProductsCount.className = 'store-products-count';
        storeProductsCount.textContent = `${store.productCount || 0} products`;
        storeFooter.appendChild(storeProductsCount);

        storeContent.appendChild(storeFooter);
        storeCard.appendChild(storeContent);

        storesGrid.appendChild(storeCard);
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

    // Region filter
    document.getElementById('region-filter').addEventListener('change', function(e) {
        currentFilters.region = e.target.value;
        currentPage = 1;
        loadStores();
    });

    // Sort filter
    document.getElementById('sort-filter').addEventListener('change', function(e) {
        currentFilters.sort = e.target.value;
        loadStores();
    });

    // Pagination buttons
    document.getElementById('prev-page').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadStores();
            // Scroll to top of stores
            document.getElementById('stores-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadStores();
            // Scroll to top of stores
            document.getElementById('stores-grid').scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Clear filters button
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);

    // Retry button
    document.getElementById('retry-btn').addEventListener('click', function() {
        document.getElementById('error-state').classList.add('hidden');
        document.getElementById('loading-state').classList.remove('hidden');
        loadStores();
    });
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    currentFilters.search = searchInput.value.trim();
    currentPage = 1;
    loadStores();
}

/**
 * Clear all filters
 */
function clearFilters() {
    // Reset filter values
    document.getElementById('search-input').value = '';
    document.getElementById('region-filter').value = '';
    document.getElementById('sort-filter').value = 'name_asc';

    // Reset filter state
    currentFilters = {
        search: '',
        region: '',
        sort: 'name_asc'
    };

    // Reset pagination
    currentPage = 1;

    // Reload stores
    loadStores();
}

/**
 * Show error state
 */
function showErrorState(message) {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('stores-content').classList.add('hidden');

    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    errorState.classList.remove('hidden');
}
