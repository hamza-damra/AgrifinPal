/**
 * Seller Dashboard JavaScript
 * Handles product management functionality for sellers
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Seller dashboard loaded');

    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        // Initialize the dashboard
        await initSellerDashboard();

        // Set up event listeners
        setupEventListeners();

        // Set up sidebar and tab navigation
        setupNavigation();

        // Animate dashboard content after loading
        animateDashboardContent();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    } finally {
        // Hide loading overlay with a slight delay for smoother transition
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }, 500);
    }
});

/**
 * Initialize the seller dashboard
 */
async function initSellerDashboard() {
    try {
        // Check if user has a store and load store info
        await loadStoreInfo();

        // Load products
        await loadProducts();

        // Load categories for product forms
        await loadCategories();

        // Update dashboard stats
        await updateDashboardStats();

        return true;
    } catch (error) {
        console.error('Error in dashboard initialization:', error);
        return false;
    }
}

/**
 * Set up event listeners for the dashboard
 */
function setupEventListeners() {
    // Add store button
    const addStoreBtn = document.getElementById('add-store-btn');
    if (addStoreBtn) {
        addStoreBtn.addEventListener('click', openAddStoreModal);
    }

    // Add store form
    const addStoreForm = document.getElementById('add-store-form');
    if (addStoreForm) {
        addStoreForm.addEventListener('submit', handleAddStore);
    }

    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', openAddProductModal);
    }

    // Add product form
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.fixed');
            if (modal) {
                modal.classList.add('hidden');
            } else {
                const modalId = this.closest('.modal')?.id;
                if (modalId) {
                    document.getElementById(modalId).classList.add('hidden');
                }
            }
        });
    });

    // Edit store button
    const editStoreBtn = document.getElementById('edit-store-btn');
    if (editStoreBtn) {
        editStoreBtn.addEventListener('click', function() {
            const storeId = localStorage.getItem('userStoreId');
            if (storeId) {
                window.location.href = `/edit-store?id=${storeId}`;
            }
        });
    }

    // Delete store button
    const deleteStoreBtn = document.getElementById('delete-store-btn');
    if (deleteStoreBtn) {
        deleteStoreBtn.addEventListener('click', openDeleteStoreModal);
    }

    // Delete store confirmation modal buttons
    const confirmDeleteStoreBtn = document.getElementById('confirm-delete-store');
    if (confirmDeleteStoreBtn) {
        confirmDeleteStoreBtn.addEventListener('click', handleDeleteStore);
    }

    const cancelDeleteStoreBtn = document.getElementById('cancel-delete-store');
    if (cancelDeleteStoreBtn) {
        cancelDeleteStoreBtn.addEventListener('click', closeDeleteStoreModal);
    }

    // Cancel buttons in modals
    document.querySelectorAll('.cancel-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            document.getElementById(modalId).classList.add('hidden');
        });
    });

    // Tab navigation buttons with data-tab attribute
    document.querySelectorAll('.btn[data-tab]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

/**
 * Load products for the current seller
 */
async function loadProducts() {
    try {
        // Get the products container
        const productsContainer = document.getElementById('product-list');
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }

        // Show loading state
        productsContainer.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        `;

        // Get store ID from localStorage or session
        const storeId = localStorage.getItem('userStoreId');


        // Fetch products from API
        let url = '/api/products';
        if (storeId) {
            url = `/api/products/store/${storeId}`;
        }

        const response = await authenticatedFetch(url, {
            method: 'GET'
        }, true, true);

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const products = await response.json();
        console.log('Products loaded:', products);

        // Check if there are products
        if (products && products.length > 0) {
            // Create products list
            let productsHTML = '';

            products.forEach(product => {
                // Get product ID (handle different API response formats)
                const productId = product.productId || product.id || 0;

                // Skip products without valid IDs
                if (!productId) {
                    console.warn('Skipping product with invalid ID:', product);
                    return;
                }

                // Handle different field names for organic status
                const isOrganic = product.isOrganic === true || product.organic === true;

                // Handle different price field formats
                const productPrice = typeof product.price === 'number' ? product.price :
                                   (typeof product.price === 'string' ? parseFloat(product.price) : 0);

                productsHTML += `
                    <div class="product-item bg-white rounded-lg shadow-md overflow-hidden" data-id="${productId}">
                        <div class="relative">
                            ${product.productImage || product.imageUrl ?
                                `<img class="w-full h-48 object-cover" src="${product.productImage || product.imageUrl}" alt="${product.productName || product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="w-full h-48 bg-gray-100 flex items-center justify-center" style="display: none;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>` :
                                `<div class="w-full h-48 bg-gray-100 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>`
                            }
                            ${isOrganic ? '<span class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">Organic</span>' : ''}
                        </div>
                        <div class="p-4">
                            <h3 class="text-lg font-semibold">${product.productName || product.name}</h3>
                            <p class="text-gray-600 text-sm mb-2">${product.categoryName || 'Uncategorized'}</p>
                            <p class="text-gray-700 mb-2 line-clamp-2">${product.productDescription || product.description || ''}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-primary-600 font-bold">$${productPrice.toFixed(2)} / ${product.unit || 'unit'}</span>
                                <div class="flex space-x-2">
                                    <a href="/edit-product?id=${productId}" class="text-blue-500 hover:text-blue-700">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <button onclick="deleteProduct(${productId})" class="text-red-500 hover:text-red-700">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            productsContainer.innerHTML = productsHTML;
        } else {
            // No products found
            productsContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 text-center">
                    <div class="flex justify-center mb-4">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p class="text-gray-500 mb-4">You haven't added any products yet.</p>
                    <button id="add-product-btn-empty" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <i class="fas fa-plus mr-2"></i> Add Product
                    </button>
                </div>
            `;

            // Add event listener to the new button
            const addProductBtnEmpty = document.getElementById('add-product-btn-empty');
            if (addProductBtnEmpty) {
                addProductBtnEmpty.addEventListener('click', openAddProductModal);
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);

        // Get the products container
        const productsContainer = document.getElementById('product-list');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 text-center">
                    <div class="flex justify-center mb-4">
                        <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
                    <p class="text-gray-500">${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Load categories for product forms
 */
async function loadCategories() {
    try {
        // Fetch categories from API
        const response = await fetch('/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const categories = await response.json();
        console.log('Categories loaded:', categories);

        // Populate category dropdowns
        const categorySelects = document.querySelectorAll('.category-select');
        categorySelects.forEach(select => {
            // Clear existing options
            select.innerHTML = '<option value="">Select Category</option>';

            // Add categories
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.categoryId || category.id;
                // Use nameEn from CategoryResponse
                option.textContent = category.nameEn || category.categoryName || category.name || 'Unknown Category';
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Open the add product modal
 */
async function openAddProductModal() {
    // Check if user has a store before allowing product creation
    const hasStore = await checkIfUserHasStore();

    if (!hasStore) {
        // Show error message and open the add store modal instead
        showToast('You need to create a store before adding products.', 'warning');
        openAddStoreModal();
        return;
    }

    const modal = document.getElementById('add-product-modal');
    if (!modal) {
        console.error('Add product modal not found');
        return;
    }

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

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Handle adding a product
 */
async function handleAddProduct(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        // Validate form
        const productName = form.elements.productName.value.trim();
        const productDescription = form.elements.productDescription.value.trim();
        const price = parseFloat(form.elements.price.value);
        const quantity = parseInt(form.elements.quantity.value);
        const unit = form.elements.unit.value.trim();
        const categoryId = parseInt(form.elements.categoryId.value);

        // Validate required fields
        if (!productName || !productDescription || isNaN(price) || isNaN(quantity) || !unit || isNaN(categoryId)) {
            alert('Please fill in all required fields.');
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

        // Send request to API
        const response = await authenticatedFetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Product added successfully
            const result = await response.json();
            console.log('Product added:', result);

            // Close modal
            document.getElementById('add-product-modal').classList.add('hidden');

            // Reload products
            loadProducts();

            // Show success message
            showToast('Product added successfully!', 'success');
        } else {
            // Handle error
            try {
                const errorData = await response.json();
                console.error('Error adding product:', errorData);

                if (response.status === 400) {
                    alert('Failed to add product. Please check if you have created a store first and all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to add products to this store.');
                } else {
                    alert(`Failed to add product: ${errorData.message || 'Unknown error'}`);
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
        alert(`An error occurred while adding the product: ${error.message}. Please try again.`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Add Product';
    }
}

/**
 * Edit a product - redirects to the edit product page
 */
function editProduct(productId) {
    // Redirect to the edit product page
    window.location.href = `/edit-product?id=${productId}`;
}

/**
 * Open the edit product modal
 */
function openEditProductModal(product) {
    const modal = document.getElementById('edit-product-modal');
    if (!modal) {
        console.error('Edit product modal not found');
        return;
    }

    // Populate form with product details
    const form = document.getElementById('edit-product-form');
    if (!form) {
        console.error('Edit product form not found');
        return;
    }

    // Set product ID
    form.elements.productId.value = product.productId || product.id;

    // Set other fields
    form.elements.productName.value = product.productName || product.name || '';
    form.elements.productDescription.value = product.productDescription || product.description || '';
    form.elements.price.value = product.price || 0;
    form.elements.quantity.value = product.quantity || 0;
    form.elements.unit.value = product.unit || '';
    form.elements.categoryId.value = product.categoryId || (product.category ? product.category.categoryId : '') || '';
    form.elements.productImage.value = product.productImage || product.imageUrl || '';
    form.elements.isOrganic.checked = product.isOrganic || product.organic || false;
    form.elements.isAvailable.checked = product.isAvailable || true;

    // Set store ID in hidden field if available
    const storeIdField = form.elements.storeId;
    if (storeIdField) {
        storeIdField.value = product.storeId || (product.store ? product.store.storeId : '') || localStorage.getItem('userStoreId') || '';
    }

    // Show modal
    modal.classList.remove('hidden');

    // Add event listener for form submission
    form.onsubmit = handleEditProduct;
}

/**
 * Handle editing a product
 */
async function handleEditProduct(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

    try {
        // Get product ID
        const productId = form.elements.productId.value;
        if (!productId) {
            throw new Error('Product ID is missing');
        }

        // Validate form
        const productName = form.elements.productName.value.trim();
        const productDescription = form.elements.productDescription.value.trim();
        const price = parseFloat(form.elements.price.value);
        const quantity = parseInt(form.elements.quantity.value);
        const unit = form.elements.unit.value.trim();
        const categoryId = parseInt(form.elements.categoryId.value);

        // Validate required fields
        if (!productName || !productDescription || isNaN(price) || isNaN(quantity) || !unit || isNaN(categoryId)) {
            alert('Please fill in all required fields.');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Update Product';
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
            submitButton.innerHTML = 'Update Product';
            return;
        }

        // Get form data
        const formData = {
            productId: productId,
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

        // Send request to API
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Product updated successfully
            const result = await response.json();
            console.log('Product updated:', result);

            // Close modal
            document.getElementById('edit-product-modal').classList.add('hidden');

            // Reload products
            loadProducts();

            // Show success message
            showToast('Product updated successfully!', 'success');
        } else {
            // Handle error
            try {
                const errorData = await response.json();
                console.error('Error updating product:', errorData);

                if (response.status === 400) {
                    alert('Failed to update product. Please check if all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to update this product.');
                } else {
                    alert(`Failed to update product: ${errorData.message || 'Unknown error'}`);
                }
            } catch (jsonError) {
                console.error('Error parsing error response:', jsonError, 'Status:', response.status);
                alert(`Failed to update product: Server returned status ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert(`An error occurred while updating the product: ${error.message}. Please try again.`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Update Product';
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
        // Send request to API
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'DELETE'
        }, true, true);

        if (response.ok) {
            // Product deleted successfully
            console.log('Product deleted:', productId);

            // Remove product from UI
            const productElement = document.querySelector(`.product-item[data-id="${productId}"]`);
            if (productElement) {
                productElement.remove();
            }

            // Reload products if list is now empty
            const productList = document.getElementById('product-list');
            if (productList && productList.children.length === 0) {
                loadProducts();
            }

            // Show success message
            showToast('Product deleted successfully!', 'success');
        } else {
            // Handle error
            try {
                const errorData = await response.json();
                console.error('Error deleting product:', errorData);

                if (response.status === 403) {
                    alert('You do not have permission to delete this product.');
                } else {
                    alert(`Failed to delete product: ${errorData.message || 'Unknown error'}`);
                }
            } catch (jsonError) {
                console.error('Error parsing error response:', jsonError, 'Status:', response.status);
                alert(`Failed to delete product: Server returned status ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(`An error occurred while deleting the product: ${error.message}. Please try again.`);
    }
}

/**
 * Load store information for the current user
 */
async function loadStoreInfo() {
    try {
        // Get the store details container
        const storeDetailsContainer = document.getElementById('store-details');
        const addStoreBtn = document.getElementById('add-store-btn');

        if (!storeDetailsContainer) {
            console.error('Store details container not found');
            return;
        }

        // Show loading state
        storeDetailsContainer.innerHTML = `
            <div class="flex justify-center items-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
        `;

        // Check if user has a store
        const hasStore = await checkIfUserHasStore();

        if (hasStore) {
            // User has a store, fetch store details
            const storeId = localStorage.getItem('userStoreId');

            if (!storeId) {
                throw new Error('Store ID not found in localStorage');
            }

            const response = await authenticatedFetch(`/api/stores/${storeId}`, {
                method: 'GET'
            }, true, true);

            if (!response.ok) {
                throw new Error(`Failed to fetch store details: ${response.status}`);
            }

            const store = await response.json();
            console.log('Store details loaded:', store);
            console.log('Store logo property:', store.logo, typeof store.logo);

            // Display store details
            storeDetailsContainer.innerHTML = `
                <div class="flex flex-row items-center">
                    <div class="store-logo-overview mr-4">
                        ${store.logo && store.logo.trim() !== '' ?
                            `<img src="${store.logo}" alt="${store.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="w-full h-full bg-gray-100 flex items-center justify-center" style="display: none;">
                                <i class="fas fa-store text-gray-400 text-xl"></i>
                            </div>` :
                            `<div class="w-full h-full bg-gray-100 flex items-center justify-center">
                                <i class="fas fa-store text-gray-400 text-xl"></i>
                            </div>`
                        }
                    </div>
                    <div class="store-info flex-1">
                        <h4 class="text-lg font-semibold text-gray-800">${store.name}</h4>
                        <p class="text-gray-600 text-sm mb-2 line-clamp-2">${store.description || 'No description available'}</p>
                        <div class="flex flex-wrap gap-2">
                            ${store.location ? `<span class="inline-flex items-center text-xs bg-gray-100 px-2 py-1 rounded shadow-sm"><i class="fas fa-map-marker-alt mr-1 text-gray-500"></i>${store.location}</span>` : ''}
                            ${store.contactInfo ? `<span class="inline-flex items-center text-xs bg-gray-100 px-2 py-1 rounded shadow-sm"><i class="fas fa-phone mr-1 text-gray-500"></i>${store.contactInfo}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Hide add store button and show edit store button
            if (addStoreBtn) {
                addStoreBtn.classList.add('hidden');
            }

            // Show edit store button in overview
            const editStoreOverviewBtn = document.getElementById('edit-store-overview-btn');
            if (editStoreOverviewBtn) {
                editStoreOverviewBtn.classList.remove('hidden');
                editStoreOverviewBtn.addEventListener('click', function() {
                    window.location.href = `/edit-store?id=${store.id || storeId}`;
                });
            }
        } else {
            // User doesn't have a store, show create store message
            storeDetailsContainer.innerHTML = `
                <div class="text-center py-6">
                    <div class="mb-4 flex justify-center">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                        </div>
                    </div>
                    <h4 class="text-lg font-medium text-gray-900 mb-2">You don't have a store yet</h4>
                    <p class="text-gray-500 mb-4">Create a store to start selling your products</p>
                </div>
            `;

            // Show add store button
            if (addStoreBtn) {
                addStoreBtn.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading store info:', error);
        console.log('Store info error details:', error.message, error.stack);

        // Show error message
        const storeDetailsContainer = document.getElementById('store-details');
        if (storeDetailsContainer) {
            storeDetailsContainer.innerHTML = `
                <div class="bg-red-50 p-4 rounded-lg">
                    <p class="text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> ${error.message || 'Failed to load store information'}</p>
                </div>
            `;
        }
    }
}

/**
 * Open the add store modal
 */
function openAddStoreModal() {
    const modal = document.getElementById('add-store-modal');
    if (!modal) {
        console.error('Add store modal not found');
        return;
    }

    // Reset form
    document.getElementById('add-store-form').reset();

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Open the delete store confirmation modal
 */
function openDeleteStoreModal() {
    const modal = document.getElementById('delete-store-modal');
    if (!modal) {
        console.error('Delete store modal not found');
        return;
    }

    // Show modal
    modal.classList.remove('hidden');
}

/**
 * Close the delete store confirmation modal
 */
function closeDeleteStoreModal() {
    const modal = document.getElementById('delete-store-modal');
    if (!modal) {
        console.error('Delete store modal not found');
        return;
    }

    // Hide modal
    modal.classList.add('hidden');
}

/**
 * Handle the delete store action
 */
async function handleDeleteStore() {
    try {
        // Get the store ID from localStorage
        const storeId = localStorage.getItem('userStoreId');
        if (!storeId) {
            showToast('Store ID not found', 'error');
            return;
        }

        // Show loading state on the button
        const confirmButton = document.getElementById('confirm-delete-store');
        const originalButtonText = confirmButton.innerHTML;
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Deleting...';

        // Make API call to delete the store
        const response = await fetch(`/api/stores/${storeId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        // Close the modal
        closeDeleteStoreModal();

        if (response.ok) {
            // Show success notification
            showToast('Store deleted successfully', 'success');

            // Clear store ID from localStorage
            localStorage.removeItem('userStoreId');

            // Reload the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            // Parse error response
            try {
                const errorData = await response.json();
                // Show error notification
                showToast(errorData.message || 'Failed to delete store', 'error');
            } catch (jsonError) {
                showToast(`Error: Server returned status ${response.status}`, 'error');
            }

            // Reset button state
            confirmButton.disabled = false;
            confirmButton.innerHTML = originalButtonText;
        }
    } catch (error) {
        console.error('Error deleting store:', error);

        // Show error notification
        showToast('Error deleting store: ' + error.message, 'error');

        // Reset button state
        const confirmButton = document.getElementById('confirm-delete-store');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.innerHTML = 'Delete Store';
        }

        // Close the modal
        closeDeleteStoreModal();
    }
}

/**
 * Handle adding a store
 */
async function handleAddStore(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Disable submit button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    try {
        // Validate form
        const storeName = form.elements.name.value.trim();
        const storeDescription = form.elements.description.value.trim();

        // Validate required fields
        if (!storeName || !storeDescription) {
            alert('Please fill in all required fields.');
            submitButton.disabled = false;
            submitButton.innerHTML = 'Create Store';
            return;
        }

        // Get form data
        const formData = {
            name: storeName,
            description: storeDescription,
            location: form.elements.location.value.trim() || null,
            contactInfo: form.elements.contactInfo.value.trim() || null,
            logo: form.elements.logo.value.trim() || null,
            banner: form.elements.banner.value.trim() || null
        };

        // Send request to API
        const response = await authenticatedFetch('/api/stores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Store created successfully
            const result = await response.json();
            console.log('Store created:', result);

            // Store the store ID in localStorage
            if (result.id) {
                localStorage.setItem('userStoreId', result.id);
                if (result.name) {
                    localStorage.setItem('userStoreName', result.name);
                }
            }

            // Close modal
            document.getElementById('add-store-modal').classList.add('hidden');

            // Reload store info
            await loadStoreInfo();

            // Show success message
            showToast('Store created successfully!', 'success');
        } else {
            // Handle error
            try {
                const errorData = await response.json();
                console.error('Error creating store:', errorData);

                if (response.status === 400) {
                    alert('Failed to create store. Please check if all required fields are filled correctly.');
                } else if (response.status === 403) {
                    alert('You do not have permission to create a store.');
                } else {
                    alert(`Failed to create store: ${errorData.message || 'Unknown error'}`);
                }
            } catch (jsonError) {
                console.error('Error parsing error response:', jsonError, 'Status:', response.status);
                alert(`Failed to create store: Server returned status ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error creating store:', error);
        alert(`An error occurred while creating the store: ${error.message}. Please try again.`);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create Store';
    }
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
 * Set up sidebar and tab navigation
 */
function setupNavigation() {
    // Mobile toggle button
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (mobileToggle && sidebar && mainContent) {
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const navItems = document.querySelectorAll('.nav-item');

    // Add click event to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Add click event to sidebar nav items
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);

            // Close sidebar on mobile after clicking
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('active');
        }
    });
}

/**
 * Switch to a specific tab
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update sidebar nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Get the current active tab content
    const currentActiveTab = document.querySelector('.tab-content.active');

    // Get the new tab content
    const newActiveTab = document.getElementById(tabId + '-tab');

    if (currentActiveTab && newActiveTab && currentActiveTab !== newActiveTab) {
        // Fade out current tab
        currentActiveTab.style.opacity = '0';
        currentActiveTab.style.transition = 'opacity 0.2s ease-out';

        setTimeout(() => {
            // Hide current tab
            currentActiveTab.classList.remove('active');

            // Show new tab but with opacity 0
            newActiveTab.classList.add('active');
            newActiveTab.style.opacity = '0';

            // Force reflow to ensure transition works
            void newActiveTab.offsetWidth;

            // Fade in new tab
            newActiveTab.style.opacity = '1';
            newActiveTab.style.transition = 'opacity 0.3s ease-in';

            // Add animation class
            newActiveTab.classList.add('animate-fade-in');

            // Remove animation class after animation completes
            setTimeout(() => {
                newActiveTab.classList.remove('animate-fade-in');
            }, 500);

            // Load tab-specific content if needed
            loadTabContent(tabId);
        }, 200);
    } else if (newActiveTab) {
        // If there's no current active tab or it's the same tab
        newActiveTab.classList.add('active');

        // Load tab-specific content if needed
        loadTabContent(tabId);
    }
}

/**
 * Load content specific to a tab
 * @param {string} tabId - The ID of the tab
 */
function loadTabContent(tabId) {
    switch (tabId) {
        case 'products':
            loadProducts();
            break;
        case 'store':
            loadStoreDetails();
            break;
        case 'categories':
            loadCategoriesList();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

/**
 * Load detailed store information for the store tab
 */
function loadStoreDetails() {
    const storeDetailsContainer = document.getElementById('store-details-full');
    const editStoreBtn = document.getElementById('edit-store-btn');

    if (!storeDetailsContainer) return;

    // Show loading state
    storeDetailsContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
        </div>
    `;

    // Get store ID from localStorage
    const storeId = localStorage.getItem('userStoreId');

    if (!storeId) {
        storeDetailsContainer.innerHTML = `
            <div class="text-center py-6">
                <p>You don't have a store yet. Please create one from the Overview tab.</p>
            </div>
        `;
        return;
    }

    // Fetch store details
    authenticatedFetch(`/api/stores/${storeId}`, {
        method: 'GET'
    }, true, true)
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch store details');
        return response.json();
    })
    .then(store => {
        // Show edit and delete buttons
        if (editStoreBtn) {
            editStoreBtn.classList.remove('hidden');
        }

        // Show delete button
        const deleteStoreBtn = document.getElementById('delete-store-btn');
        if (deleteStoreBtn) {
            deleteStoreBtn.classList.remove('hidden');
        }

        // Display store details
        storeDetailsContainer.innerHTML = `
            <div class="store-info-card">
                <div class="store-logo">
                    ${store.logo && store.logo.trim() !== '' ?
                        `<img src="${store.logo}" alt="${store.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="w-full h-full bg-gray-100 flex items-center justify-center" style="display: none;">
                            <i class="fas fa-store text-gray-400 text-5xl"></i>
                        </div>` :
                        `<div class="w-full h-full bg-gray-100 flex items-center justify-center">
                            <i class="fas fa-store text-gray-400 text-5xl"></i>
                        </div>`
                    }
                </div>
                <div class="store-details">
                    <h3 class="store-name">${store.name}</h3>
                    <p class="store-description">${store.description || 'No description available'}</p>

                    <div class="store-meta">
                        <div class="meta-item">
                            <span class="meta-label">Location</span>
                            <span class="meta-value">${store.location || 'Not specified'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Contact</span>
                            <span class="meta-value">${store.contactInfo || 'Not specified'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Created</span>
                            <span class="meta-value">${store.createdAt ? new Date(store.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    })
    .catch(error => {
        console.error('Error loading store details:', error);
        storeDetailsContainer.innerHTML = `
            <div class="bg-red-50 p-4 rounded-lg">
                <p class="text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> ${error.message || 'Failed to load store information'}</p>
            </div>
        `;
    });
}

/**
 * Load categories list for the categories tab
 */
function loadCategoriesList() {
    const categoriesContainer = document.getElementById('categories-list');

    if (!categoriesContainer) return;

    // Show loading state
    categoriesContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
        </div>
    `;

    // Fetch categories
    fetch('/api/categories', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    })
    .then(categories => {
        if (categories && categories.length > 0) {
            // Create categories list
            let categoriesHTML = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';

            categories.forEach(category => {
                categoriesHTML += `
                    <div class="bg-white p-4 rounded-lg shadow">
                        <h3 class="font-semibold">${category.nameEn || category.categoryName || category.name}</h3>
                        <p class="text-sm text-gray-500">${category.descriptionEn || category.description || 'No description'}</p>
                    </div>
                `;
            });

            categoriesHTML += '</div>';
            categoriesContainer.innerHTML = categoriesHTML;
        } else {
            categoriesContainer.innerHTML = `
                <p>No categories found. <a href="/category-management" class="text-blue-500 hover:underline">Manage categories</a> to add some.</p>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading categories:', error);
        categoriesContainer.innerHTML = `
            <div class="bg-red-50 p-4 rounded-lg">
                <p class="text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> ${error.message || 'Failed to load categories'}</p>
            </div>
        `;
    });
}

/**
 * Load orders for the orders tab
 */
function loadOrders() {
    const ordersContainer = document.getElementById('orders-list');

    if (!ordersContainer) return;

    // Show loading state
    ordersContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
        </div>
    `;

    // Get store ID from localStorage
    const storeId = localStorage.getItem('userStoreId');

    if (!storeId) {
        ordersContainer.innerHTML = `
            <div class="text-center py-6">
                <p>You don't have a store yet. Please create one from the Overview tab.</p>
            </div>
        `;
        return;
    }

    // Fetch orders (this endpoint might need to be implemented)
    authenticatedFetch(`/api/orders/store/${storeId}`, {
        method: 'GET'
    }, true, false)
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('No orders found');
            }
            throw new Error('Failed to fetch orders');
        }
        return response.json();
    })
    .then(orders => {
        if (orders && orders.length > 0) {
            // Create orders list
            let ordersHTML = '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200">';
            ordersHTML += `
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
            `;

            orders.forEach(order => {
                ordersHTML += `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customerName || 'Unknown'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800">
                                ${order.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${order.total.toFixed(2)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
                        </td>
                    </tr>
                `;
            });

            ordersHTML += '</tbody></table></div>';
            ordersContainer.innerHTML = ordersHTML;
        } else {
            ordersContainer.innerHTML = `
                <div class="text-center py-6">
                    <p>No orders found. When customers place orders for your products, they will appear here.</p>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading orders:', error);
        if (error.message === 'No orders found') {
            ordersContainer.innerHTML = `
                <div class="text-center py-6">
                    <p>No orders found. When customers place orders for your products, they will appear here.</p>
                </div>
            `;
        } else {
            ordersContainer.innerHTML = `
                <div class="bg-red-50 p-4 rounded-lg">
                    <p class="text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> ${error.message || 'Failed to load orders'}</p>
                </div>
            `;
        }
    });
}

/**
 * Get color for order status
 * @param {string} status - Order status
 * @returns {string} Color name
 */
function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'completed':
            return 'green';
        case 'processing':
            return 'blue';
        case 'pending':
            return 'yellow';
        case 'cancelled':
            return 'red';
        default:
            return 'gray';
    }
}

/**
 * Load analytics data for the analytics tab
 */
function loadAnalytics() {
    // This function would fetch and display analytics data
    // For now, we'll just display placeholder content
}

/**
 * Update dashboard stats
 */
async function updateDashboardStats() {
    try {
        // Get store ID from localStorage
        const storeId = localStorage.getItem('userStoreId');
        if (!storeId) return;

        // Update product count
        const productCountElement = document.getElementById('product-count');
        if (productCountElement) {
            // Fetch product count
            const response = await authenticatedFetch(`/api/products/store/${storeId}/count`, {
                method: 'GET'
            }, true, false);

            if (response.ok) {
                const data = await response.json();
                productCountElement.textContent = data.count || 0;
            }
        }

        // Update category count
        const categoryCountElement = document.getElementById('category-count');
        if (categoryCountElement) {
            // Fetch categories
            const response = await fetch('/api/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const categories = await response.json();
                categoryCountElement.textContent = categories.length || 0;
            }
        }

        // Other stats would be updated similarly
        // For now, we'll leave them with default values
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

/**
 * Animate dashboard content with staggered animations
 */
function animateDashboardContent() {
    // Show main content container
    const dashboardContent = document.getElementById('dashboard-content');
    if (dashboardContent) {
        dashboardContent.classList.add('loaded');
    }

    // Animate sidebar with slide in from left
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.add('animate-slide-in-left');
    }

    // Animate main content area
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.add('animate-fade-in');
    }

    // Animate store info card
    const storeInfo = document.getElementById('store-info');
    if (storeInfo) {
        setTimeout(() => {
            storeInfo.classList.add('loaded');
        }, 300);
    }

    // Animate stat cards with staggered delay
    const statCards = [
        document.getElementById('stat-card-1'),
        document.getElementById('stat-card-2'),
        document.getElementById('stat-card-3'),
        document.getElementById('stat-card-4')
    ];

    statCards.forEach((card, index) => {
        if (card) {
            setTimeout(() => {
                card.classList.add('loaded');
            }, 500 + (index * 100)); // Staggered delay
        }
    });

    // Animate tab content
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        activeTab.classList.add('animate-fade-in');
    }
}

/**
 * Show a toast message
 */
function showToast(message, type = 'info') {
    // Check if toast container exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        // Create toast container
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed bottom-4 right-4 z-50';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'mb-2 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in-bottom';

    // Set toast color based on type
    switch (type) {
        case 'success':
            toast.className += ' bg-green-500 text-white';
            break;
        case 'error':
            toast.className += ' bg-red-500 text-white';
            break;
        case 'warning':
            toast.className += ' bg-yellow-500 text-white';
            break;
        default:
            toast.className += ' bg-blue-500 text-white';
    }

    // Set toast content
    toast.innerHTML = message;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
