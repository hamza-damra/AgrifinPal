/**
 * Dashboard JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard page loaded');

    // Check if token is in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('token')) {
        console.log('Token found in URL parameters');

        // Store token from URL in localStorage
        const token = urlParams.get('token');
        localStorage.setItem('token', token);

        // Set token cookie for added security
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;

        // Remove token from URL to prevent security issues
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        console.log('Token stored and removed from URL');
    } else {
        console.log('No token in URL parameters');
    }

    // Validate token before initializing dashboard
    console.log('Validating token...');
    const isAuthenticated = await validateToken(true);

    if (isAuthenticated) {
        console.log('Token is valid, initializing dashboard');
        // Initialize dashboard
        initDashboard();
    } else {
        console.log('Token validation failed');
        showErrorState('Authentication failed. Please login again.');
    }
});

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
async function checkAuthentication() {
    console.log('Checking authentication status...');
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found in localStorage');
            return false;
        }

        // Make request to check authentication
        const response = await fetch('/api/auth/check-auth', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include' // Include cookies
        });

        const data = await response.json();
        console.log('Authentication check response:', data);

        return data.authenticated === true;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

/**
 * Show error state on the dashboard
 * @param {string} message - Error message to display
 */
function showErrorState(message) {
    console.error('Dashboard error:', message);

    // Create error container if it doesn't exist
    let errorContainer = document.getElementById('dashboard-error');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'dashboard-error';
        errorContainer.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';

        // Insert at the top of the main content
        const mainContent = document.querySelector('main') || document.body;
        mainContent.insertBefore(errorContainer, mainContent.firstChild);
    }

    // Set error message
    errorContainer.innerHTML = `
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
        <button class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="window.location.href='/login'">
            <span class="text-xl">&times;</span>
        </button>
    `;
}

/**
 * Initialize the dashboard
 */
function initDashboard() {
    // Check if user is authenticated
    checkAuthentication()
        .then(isAuthenticated => {
            if (isAuthenticated) {
                // Load user data and show dashboard
                loadUserData();
                showDashboard();

                // Initialize event listeners
                initEventListeners();

                // Load initial data
                loadProducts();
                loadCategories();
                loadUserStore();
            } else {
                // Show error state if not authenticated
                showErrorState('You need to be logged in to access this page.');
            }
        })
        .catch(error => {
            console.error('Authentication check failed:', error);
            showErrorState('Failed to check authentication. Please try again later.');
        });
}

/**
 * Check if the user is authenticated
 */
async function checkAuthentication() {
    // Use the validateToken function from auth-utils.js
    // but don't redirect automatically (we'll handle that in initDashboard)
    return await validateToken(false);
}

/**
 * Load user data
 */
async function loadUserData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, user is not authenticated
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            displayUserData(userData);
        } else {
            console.error('Failed to load user data');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Display user data in the UI
 */
function displayUserData(userData) {
    // Check if user has admin or seller role and redirect if needed
    if (userData.roles && Array.isArray(userData.roles)) {
        if (userData.roles.includes('ROLE_ADMIN')) {
            window.location.href = '/admin/dashboard';
            return;
        } else if (userData.roles.includes('ROLE_SELLER')) {
            window.location.href = '/seller/dashboard';
            return;
        }
    }

    // Update user name and email in the sidebar
    document.getElementById('user-name').textContent = userData.fullName || userData.username;
    document.getElementById('user-email').textContent = userData.email;

    // Update profile image if available
    if (userData.profileImage) {
        const avatarElement = document.getElementById('user-avatar');
        // Clear existing content
        avatarElement.innerHTML = '';

        // Create and add image
        const imgElement = document.createElement('img');
        imgElement.src = userData.profileImage;
        imgElement.alt = userData.fullName || userData.username;
        imgElement.onerror = function() {
            // If image fails to load, revert to default icon
            avatarElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        };
        avatarElement.appendChild(imgElement);
    }

    // Update profile tab with user details if it exists
    const profileDetails = document.getElementById('profile-details');
    if (profileDetails) {
        // Clear loading placeholder
        profileDetails.innerHTML = '';

        // Create profile details sections
        const basicInfoSection = createDetailSection('Basic Information', [
            { label: 'Username', value: userData.username },
            { label: 'Full Name', value: userData.fullName || 'Not provided' },
            { label: 'Email', value: userData.email }
        ]);

        const contactInfoSection = createDetailSection('Contact Information', [
            { label: 'Phone', value: userData.phone || 'Not provided' },
            { label: 'Region', value: userData.region || 'Not provided' }
        ]);

        const farmInfoSection = createDetailSection('Farm Information', [
            { label: 'Agriculture Type', value: userData.agricultureType || 'Not provided' },
            { label: 'Bio', value: userData.bio || 'Not provided' }
        ]);

        // Append sections to profile details
        profileDetails.appendChild(basicInfoSection);
        profileDetails.appendChild(contactInfoSection);
        profileDetails.appendChild(farmInfoSection);
    }
}

/**
 * Create a detail section for profile or store details
 */
function createDetailSection(title, details) {
    const section = document.createElement('div');
    section.className = 'detail-section';

    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);

    details.forEach(detail => {
        const row = document.createElement('div');
        row.className = 'detail-row';

        const label = document.createElement('div');
        label.className = 'detail-label';
        label.textContent = detail.label + ':';

        const value = document.createElement('div');
        value.className = 'detail-value';
        value.textContent = detail.value;

        row.appendChild(label);
        row.appendChild(value);
        section.appendChild(row);
    });

    return section;
}

/**
 * Load products from the API
 */
async function loadProducts() {
    try {
        const productList = document.getElementById('product-list');

        // Use authenticatedFetch to make the request
        const response = await authenticatedFetch('/api/products/user', {
            method: 'GET'
        }, true, false); // Don't redirect on failure, we'll handle it in the UI

        if (response.ok) {
            const products = await response.json();

            // Clear loading placeholder
            productList.innerHTML = '';

            if (products.length === 0) {
                // Check if user has a store
                const hasStore = await checkIfUserHasStore();

                if (!hasStore) {
                    // User doesn't have a store, show create store message
                    const emptyState = document.createElement('div');
                    emptyState.className = 'loading-placeholder';
                    emptyState.innerHTML = `
                        <p>You need to create a store before adding products.</p>
                        <button id="create-store-first-btn" class="primary-btn" style="margin-top: 1rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            <span>Create Store</span>
                        </button>
                    `;
                    productList.appendChild(emptyState);

                    // Add event listener to the create store button
                    document.getElementById('create-store-first-btn').addEventListener('click', function() {
                        window.location.href = '/create-store';
                    });
                } else {
                    // User has a store but no products
                    const emptyState = document.createElement('div');
                    emptyState.className = 'loading-placeholder';
                    emptyState.innerHTML = `
                        <p>You don't have any products yet.</p>
                        <button id="empty-add-product-btn" class="primary-btn" style="margin-top: 1rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            <span>Add Your First Product</span>
                        </button>
                    `;
                    productList.appendChild(emptyState);

                    // Add event listener to the empty state add button
                    document.getElementById('empty-add-product-btn').addEventListener('click', openAddProductModal);
                }
            } else {
                // Display products
                products.forEach(product => {
                    const productItem = createProductItem(product);
                    productList.appendChild(productItem);
                });
            }
        } else {
            // Show error
            productList.innerHTML = `
                <div class="loading-placeholder">
                    <p>Failed to load products. Please try again later.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('product-list').innerHTML = `
            <div class="loading-placeholder">
                <p>An error occurred while loading products.</p>
            </div>
        `;
    }
}

/**
 * Create a product item element
 */
function createProductItem(product) {
    const productItem = document.createElement('div');
    productItem.className = 'product-item';
    productItem.dataset.id = product.id;

    const productContent = document.createElement('div');
    productContent.className = 'product-content';

    // Product info (image and details)
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';

    // Product image
    const productImage = document.createElement('img');
    productImage.className = 'product-image';
    productImage.src = product.productImage || '/images/default-product.svg';
    productImage.alt = product.productName;
    // Add error handler to use default image if the product image fails to load
    productImage.onerror = function() {
        this.src = '/images/default-product.svg';
    };
    productInfo.appendChild(productImage);

    // Product details
    const productDetails = document.createElement('div');
    productDetails.className = 'product-details';

    const productName = document.createElement('h3');
    productName.textContent = product.productName;
    productDetails.appendChild(productName);

    const productPrice = document.createElement('p');
    productPrice.textContent = `$${product.price.toFixed(2)} per ${product.unit}`;
    productDetails.appendChild(productPrice);

    const productStock = document.createElement('p');
    productStock.textContent = `In stock: ${product.quantity} ${product.unit}`;
    productDetails.appendChild(productStock);

    productInfo.appendChild(productDetails);
    productContent.appendChild(productInfo);

    // Product actions
    const productActions = document.createElement('div');
    productActions.className = 'product-actions';

    // Edit button
    const editButton = document.createElement('button');
    editButton.className = 'icon-btn';
    editButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
    `;
    editButton.addEventListener('click', () => editProduct(product.id));
    productActions.appendChild(editButton);

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'icon-btn';
    deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
    `;
    deleteButton.addEventListener('click', () => deleteProduct(product.id));
    productActions.appendChild(deleteButton);

    productContent.appendChild(productActions);
    productItem.appendChild(productContent);

    return productItem;
}

/**
 * Load categories for the product form
 * @param {string} selectId - ID of the select element to populate (default: 'product-category')
 */
async function loadCategories(selectId = 'product-category') {
    try {
        const categorySelect = document.getElementById(selectId);
        if (!categorySelect) {
            console.error(`Category select element with ID '${selectId}' not found`);
            return;
        }

        // Use authenticatedFetch to make the request
        const response = await authenticatedFetch('/api/categories', {
            method: 'GET'
        }, true, false); // Don't redirect on failure, we'll handle it in the UI

        if (response.ok) {
            const categories = await response.json();
            console.log('Categories loaded:', categories); // Debug log

            // Clear existing options except the first one
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1);
            }

            // Add categories to select
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.nameEn; // Use nameEn field from CategoryResponse
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error(`Error loading categories for ${selectId}:`, error);
    }
}

/**
 * Load user's store from the API
 */
async function loadUserStore() {
    try {
        const storeDetails = document.getElementById('store-details');

        // Get the authenticated user's ID from the user data
        const userResponse = await authenticatedFetch('/api/auth/me', {
            method: 'GET'
        }, true, false); // Don't redirect on failure, we'll handle it in the UI

        if (!userResponse.ok) {
            throw new Error('Failed to get user data');
        }

        const userData = await userResponse.json();
        const userId = userData.userId;

        // Fetch the user's store
        console.log('Fetching store for user ID:', userId);
        const response = await authenticatedFetch(`/api/stores/user/${userId}`, {
            method: 'GET'
        }, false, false); // Skip token validation since we just did it
        console.log('Store API response status:', response.status);

        if (response.ok) {
            const storeData = await response.json();
            console.log('Store data loaded:', storeData);

            // Validate store data
            if (storeData && (storeData.storeId || storeData.id)) {
                // Make sure storeId is available for other functions
                if (!storeData.storeId && storeData.id) {
                    console.log('Normalizing store data: Adding storeId field from id field');
                    storeData.storeId = storeData.id;
                }
                displayStoreDetails(storeData);
            } else {
                console.error('Invalid store data received:', storeData);
                displayCreateStorePrompt();
            }
        } else if (response.status === 404) {
            // User doesn't have a store yet
            displayCreateStorePrompt();
        } else {
            throw new Error('Failed to load store data');
        }
    } catch (error) {
        console.error('Error loading store:', error);
        const storeDetails = document.getElementById('store-details');
        if (storeDetails) {
            storeDetails.innerHTML = `
                <div class="loading-placeholder">
                    <p>Failed to load store details. ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Display store details in the UI
 */
function displayStoreDetails(store) {
    console.log('Displaying store details:', store);
    const storeDetails = document.getElementById('store-details');
    if (!storeDetails) return;

    // Normalize store data to ensure consistent field names
    if (!store.storeId && store.id) {
        store.storeId = store.id;
    }
    if (!store.name && store.storeName) {
        store.name = store.storeName;
    }
    if (!store.description && store.storeDescription) {
        store.description = store.storeDescription;
    }
    if (!store.logo && store.storeLogo) {
        store.logo = store.storeLogo;
    }
    if (!store.banner && store.storeBanner) {
        store.banner = store.storeBanner;
    }

    // Clear loading placeholder
    storeDetails.innerHTML = '';

    // Create store header with logo and banner
    const storeHeader = document.createElement('div');
    storeHeader.className = 'store-header';

    // Add banner if available
    if (store.banner) {
        const banner = document.createElement('div');
        banner.className = 'store-banner';
        banner.style.backgroundImage = `url(${store.banner})`;
        storeHeader.appendChild(banner);
    }

    // Add logo if available
    const logoContainer = document.createElement('div');
    logoContainer.className = 'store-logo-container';

    const logo = document.createElement('div');
    logo.className = 'store-logo';
    if (store.logo) {
        logo.style.backgroundImage = `url(${store.logo})`;
    } else {
        logo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
    }
    logoContainer.appendChild(logo);
    storeHeader.appendChild(logoContainer);

    storeDetails.appendChild(storeHeader);

    // Create store info sections
    const basicInfoSection = createDetailSection('Store Information', [
        { label: 'Name', value: store.name },
        { label: 'Description', value: store.description || 'No description provided' }
    ]);

    const contactInfoSection = createDetailSection('Contact Information', [
        { label: 'Location', value: store.location || 'Not provided' },
        { label: 'Contact', value: store.contactInfo || 'Not provided' }
    ]);

    const datesSection = createDetailSection('Store Dates', [
        { label: 'Created', value: formatDate(store.createdAt) },
        { label: 'Last Updated', value: formatDate(store.updatedAt) }
    ]);

    // Append sections to store details
    storeDetails.appendChild(basicInfoSection);
    storeDetails.appendChild(contactInfoSection);
    storeDetails.appendChild(datesSection);

    // Update edit store button event listener
    const editStoreBtn = document.getElementById('edit-store-btn');
    if (editStoreBtn) {
        editStoreBtn.onclick = function() {
            // Check if store ID exists and is valid
            const storeId = store.storeId || store.id;
            if (store && storeId) {
                window.location.href = `/edit-store/${storeId}`;
            } else {
                console.error('Invalid store ID:', store);
                alert('Cannot edit store: Store ID is missing or invalid.');
            }
        };
    }
}

/**
 * Display create store prompt when user doesn't have a store
 */
function displayCreateStorePrompt() {
    const storeDetails = document.getElementById('store-details');
    if (!storeDetails) return;

    storeDetails.innerHTML = `
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <h3>You don't have a store yet</h3>
            <p>Create a store to start selling your products</p>
            <button id="create-store-btn" class="primary-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Create Store</span>
            </button>
        </div>
    `;

    // Add event listener to create store button
    document.getElementById('create-store-btn').addEventListener('click', function() {
        window.location.href = '/create-store';
    });
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn, .nav-item');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // Add product button
    document.getElementById('add-product-btn').addEventListener('click', openAddProductModal);

    // Edit profile button
    const editProfileBtn = document.getElementById('edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            window.location.href = '/edit-profile';
        });
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

    // Add product form submission
    const addProductForm = document.getElementById('add-product-form');
    addProductForm.addEventListener('submit', handleAddProduct);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        const isActive = pane.id === `${tabName}-tab`;
        pane.classList.toggle('active', isActive);
    });

    // Load data specific to the selected tab
    if (tabName === 'store') {
        // Reload store data when switching to store tab
        loadUserStore();
    }
}

/**
 * Open the add product modal
 */
async function openAddProductModal() {
    // Check if user has a store before allowing product creation
    const hasStore = await checkIfUserHasStore();

    if (!hasStore) {
        // Show error message and redirect to create store page
        alert('You need to create a store before adding products.');
        window.location.href = '/create-store';
        return;
    }

    const modal = document.getElementById('add-product-modal');
    modal.classList.remove('hidden');

    // Reset form
    document.getElementById('add-product-form').reset();

    // Set store ID in hidden field if available
    const storeIdField = document.getElementById('product-store-id');
    if (storeIdField) {
        const userStoreId = localStorage.getItem('userStoreId');
        if (userStoreId) {
            storeIdField.value = userStoreId;
        }
    }
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
 * Handle add product form submission
 */
async function handleAddProduct(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Adding...';

    try {
        // Validate form data
        const productName = form.elements.productName.value.trim();
        const productDescription = form.elements.productDescription.value.trim();
        const priceStr = form.elements.price.value.trim();
        const quantityStr = form.elements.quantity.value.trim();
        const unit = form.elements.unit.value.trim();
        const categoryIdStr = form.elements.categoryId.value.trim();

        // Check required fields
        if (!productName || !productDescription || !priceStr || !quantityStr || !unit || !categoryIdStr) {
            alert('Please fill in all required fields');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Add Product';
            return;
        }

        // Parse numeric values
        const price = parseFloat(priceStr);
        const quantity = parseInt(quantityStr);
        const categoryId = parseInt(categoryIdStr);

        // Validate numeric values
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Add Product';
            return;
        }

        if (isNaN(quantity) || quantity < 0) {
            alert('Please enter a valid quantity');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Add Product';
            return;
        }

        if (isNaN(categoryId) || categoryId <= 0) {
            alert('Please select a valid category');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Add Product';
            return;
        }

        // Get store ID from form or localStorage
        let storeId = null;
        const storeIdField = form.elements.storeId;
        if (storeIdField && storeIdField.value) {
            storeId = parseInt(storeIdField.value);
        } else {
            // Try to get store ID from localStorage
            const userStoreId = localStorage.getItem('userStoreId');
            if (userStoreId) {
                storeId = parseInt(userStoreId);
            }
        }

        // Validate store ID
        if (!storeId || isNaN(storeId) || storeId <= 0) {
            alert('Store ID is missing or invalid. Please create a store first.');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Add Product';
            return;
        }

        // Get form data
        const formData = {
            productName: productName,
            productDescription: productDescription,
            price: price,
            quantity: quantity,
            unit: unit,
            categoryId: categoryId,
            storeId: storeId,
            productImage: form.elements.productImage.value.trim() || null,
            isOrganic: form.elements.isOrganic.checked,
            isAvailable: form.elements.isAvailable.checked
        };

        // Log the form data for debugging
        console.log('Product form data:', formData);

        // Get CSRF token
        const csrf = getCsrfToken();
        console.log('CSRF token:', csrf);

        // Create headers object with safe values
        const headers = {};

        // Only add CSRF token if it's valid
        if (csrf && csrf.header && csrf.value) {
            // Validate header name to avoid invalid characters
            if (/^[\w-]+$/.test(csrf.header)) {
                headers[csrf.header] = csrf.value;
            } else {
                console.warn(`Skipping invalid CSRF header name: ${csrf.header}`);
            }
        }

        // Submit data using authenticatedFetch
        const response = await authenticatedFetch('/api/products', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Close modal and reload products
            closeModals();
            loadProducts();
        } else {
            try {
                const errorData = await response.json();
                console.error('Error response:', errorData);

                if (errorData.message) {
                    alert(`Failed to add product: ${errorData.message}`);
                } else if (response.status === 400) {
                    alert('Failed to add product. Please check if you have created a store first and all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to add products to this store.');
                } else {
                    alert(`Failed to add product: Server returned status ${response.status}`);
                }
            } catch (jsonError) {
                console.error('Error parsing error response:', jsonError, 'Status:', response.status);

                if (response.status === 400) {
                    alert('Failed to add product. Please check if you have created a store first and all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to add products to this store.');
                } else {
                    alert(`Failed to add product: Server returned status ${response.status}`);
                }
            }
        }
    } catch (error) {
        console.error('Error adding product:', error);

        // Provide more detailed error message if possible
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Network error details:', {
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack
            });

            // Check if it's a CORS issue
            if (error.message.includes('CORS')) {
                alert('Cross-Origin Request Blocked: The browser blocked the request due to CORS policy. Please contact support.');
            } else {
                alert('Network error: Unable to connect to the server. Please check your internet connection and try again.');
            }
        } else if (error.name === 'SyntaxError') {
            alert('Error processing server response. Please try again later.');
        } else {
            alert(`An error occurred while adding the product: ${error.message}. Please try again.`);
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Add Product';
    }
}

/**
 * Edit a product
 */
async function editProduct(productId) {
    try {
        // Show loading state
        showToast('Loading product details...', 'info');

        // Fetch product details
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'GET'
        }, true, true);

        if (!response.ok) {
            throw new Error(`Failed to fetch product details: ${response.status}`);
        }

        const product = await response.json();
        console.log('Product details loaded:', product);

        // Open edit modal
        openEditProductModal(product);
    } catch (error) {
        console.error('Error loading product for editing:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

/**
 * Delete a product
 */
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        // Get CSRF token
        const csrf = getCsrfToken();

        // Create headers object with safe values
        const headers = {};

        // Only add CSRF token if it's valid
        if (csrf && csrf.header && csrf.value) {
            // Validate header name to avoid invalid characters
            if (/^[\w-]+$/.test(csrf.header)) {
                headers[csrf.header] = csrf.value;
            } else {
                console.warn(`Skipping invalid CSRF header name: ${csrf.header}`);
            }
        }

        // Use authenticatedFetch to make the request
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: headers
        }, true, true);

        if (response.ok) {
            // Remove product from UI
            const productElement = document.querySelector(`.product-item[data-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
            }

            // Reload products if list is now empty
            const productList = document.getElementById('product-list');
            if (productList.children.length === 0) {
                loadProducts();
            }
        } else {
            alert('Failed to delete product. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product.');
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        // Get CSRF token
        const csrf = getCsrfToken();

        // Get JWT token
        const token = localStorage.getItem('token');

        // Clear token from localStorage
        localStorage.removeItem('token');

        if (token) {
            // Notify server about logout (optional for JWT)
            try {
                // Create headers object with safe values
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };

                // Only add CSRF token if it's valid
                if (csrf && csrf.header && csrf.value) {
                    // Validate header name to avoid invalid characters
                    if (/^[\w-]+$/.test(csrf.header)) {
                        headers[csrf.header] = csrf.value;
                    } else {
                        console.warn(`Skipping invalid CSRF header name: ${csrf.header}`);
                    }
                }

                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: headers
                });
            } catch (e) {
                console.warn('Error notifying server about logout:', e);
                // Continue with client-side logout regardless
            }
        }

        // Update UI to reflect logged out state
        updateAuthUI();

        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout.');
        // Still try to redirect to home page
        window.location.href = '/';
    }
}

/**
 * Show the dashboard
 */
function showDashboard() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

/**
 * Get CSRF token from meta tag
 */
function getCsrfToken() {
    try {
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        const csrfHeaderMeta = document.querySelector('meta[name="_csrf_header"]');

        if (csrfMeta && csrfHeaderMeta && csrfMeta.content && csrfHeaderMeta.content) {
            // Normalize header name to ensure it's valid
            // Convert from something like 'X-CSRF-TOKEN' to 'X-Csrf-Token'
            const normalizedHeader = csrfHeaderMeta.content.toLowerCase()
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('-');

            return {
                value: csrfMeta.content,
                header: normalizedHeader
            };
        }
    } catch (error) {
        console.error('Error getting CSRF token:', error);
    }

    return { value: '', header: '' };
}

/**
 * Open edit product modal
 */
function openEditProductModal(product) {
    // Get the modal and form
    const modal = document.getElementById('edit-product-modal');
    const form = document.getElementById('edit-product-form');

    // Reset form
    form.reset();

    // Fill form with product data
    form.elements.productId.value = product.productId;
    form.elements.productName.value = product.productName;
    form.elements.productDescription.value = product.productDescription;
    form.elements.price.value = product.price;
    form.elements.quantity.value = product.quantity;
    form.elements.unit.value = product.unit;
    form.elements.categoryId.value = product.categoryId;
    form.elements.productImage.value = product.productImage || '';
    form.elements.isOrganic.checked = product.isOrganic;
    form.elements.isAvailable.checked = product.isAvailable;

    // Load categories if needed
    loadCategories('edit-product-category');

    // Add event listener to form submission
    form.onsubmit = handleEditProduct;

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Handle edit product form submission
 */
async function handleEditProduct(event) {
    event.preventDefault();

    const form = event.target;
    const productId = form.elements.productId.value;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> Updating...';

    try {
        // Validate form data
        const productName = form.elements.productName.value.trim();
        const productDescription = form.elements.productDescription.value.trim();
        const priceStr = form.elements.price.value.trim();
        const quantityStr = form.elements.quantity.value.trim();
        const unit = form.elements.unit.value.trim();
        const categoryIdStr = form.elements.categoryId.value.trim();

        // Check required fields
        if (!productName || !productDescription || !priceStr || !quantityStr || !unit || !categoryIdStr) {
            alert('Please fill in all required fields');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Product';
            return;
        }

        // Parse numeric values
        const price = parseFloat(priceStr);
        const quantity = parseInt(quantityStr);
        const categoryId = parseInt(categoryIdStr);

        // Validate numeric values
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Product';
            return;
        }

        if (isNaN(quantity) || quantity < 0) {
            alert('Please enter a valid quantity');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Product';
            return;
        }

        if (isNaN(categoryId) || categoryId <= 0) {
            alert('Please select a valid category');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Product';
            return;
        }

        // Get form data
        const formData = {
            productName: productName,
            productDescription: productDescription,
            price: price,
            quantity: quantity,
            unit: unit,
            categoryId: categoryId,
            productImage: form.elements.productImage.value.trim() || null,
            isOrganic: form.elements.isOrganic.checked,
            isAvailable: form.elements.isAvailable.checked
        };

        // Log the form data for debugging
        console.log('Product update data:', formData);

        // Get CSRF token
        const csrf = getCsrfToken();
        console.log('CSRF token:', csrf);

        // Create headers object with safe values
        const headers = {};

        // Only add CSRF token if it's valid
        if (csrf && csrf.header && csrf.value) {
            // Validate header name to avoid invalid characters
            if (/^[\w-]+$/.test(csrf.header)) {
                headers[csrf.header] = csrf.value;
            } else {
                console.warn(`Skipping invalid CSRF header name: ${csrf.header}`);
            }
        }

        // Submit data using authenticatedFetch
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Close modal and reload products
            closeModals();
            loadProducts();
            showToast('Product updated successfully!', 'success');
        } else {
            try {
                const errorData = await response.json();
                console.error('Error response:', errorData);

                if (errorData.message) {
                    alert(`Failed to update product: ${errorData.message}`);
                } else if (response.status === 400) {
                    alert('Failed to update product. Please check if all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to update this product.');
                } else {
                    alert(`Failed to update product: Server returned status ${response.status}`);
                }
            } catch (jsonError) {
                console.error('Error parsing error response:', jsonError, 'Status:', response.status);

                if (response.status === 400) {
                    alert('Failed to update product. Please check if all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to update this product.');
                } else {
                    alert(`Failed to update product: Server returned status ${response.status}`);
                }
            }
        }
    } catch (error) {
        console.error('Error updating product:', error);

        // Provide more detailed error message if possible
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Network error details:', {
                errorName: error.name,
                errorMessage: error.message,
                stack: error.stack
            });

            // Check if it's a CORS issue
            if (error.message.includes('CORS')) {
                alert('Cross-Origin Request Blocked: The browser blocked the request due to CORS policy. Please contact support.');
            } else {
                alert('Network error: Unable to connect to the server. Please check your internet connection and try again.');
            }
        } else if (error.name === 'SyntaxError') {
            alert('Error processing server response. Please try again later.');
        } else {
            alert(`An error occurred while updating the product: ${error.message}. Please try again.`);
        }
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Update Product';
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Check if the current user has a store
 * @returns {Promise<boolean>} True if the user has a store, false otherwise
 */
async function checkIfUserHasStore() {
    try {
        // Use the new API endpoint to check if user has a store
        const response = await authenticatedFetch('/api/stores/check', {
            method: 'GET'
        }, true, false); // Don't redirect on failure

        if (response.ok) {
            const data = await response.json();
            console.log('Store check result:', data);

            // Store the store ID in localStorage if available
            if (data.hasStore && data.storeId) {
                localStorage.setItem('userStoreId', data.storeId);
                if (data.storeName) {
                    localStorage.setItem('userStoreName', data.storeName);
                }
            } else {
                localStorage.removeItem('userStoreId');
                localStorage.removeItem('userStoreName');
            }

            return data.hasStore === true;
        }

        return false;
    } catch (error) {
        console.error('Error checking if user has store:', error);
        return false;
    }
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
