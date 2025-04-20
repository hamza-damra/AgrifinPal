
/**
 * Admin Products JavaScript
 * Contains functionality for managing products in the admin panel
 */

// Make sure productModule is globally available
window.productModule = {
    // Flag to track if the module has been initialized
    initialized: false,
    // Store the current products data
    products: [],
    categories: [],
    filteredProducts: [],
    searchTerm: '',
    categoryFilter: 'all',
    statusFilter: 'all',

    /**
     * Initialize the product module
     */
    init() {
        // Only initialize once
        if (this.initialized) {
            console.log('Product module already initialized');
            return;
        }

        console.log('Initializing product module...');
        // Fetch categories for the filter dropdown
        this.fetchCategories();

        // Mark as initialized
        this.initialized = true;
    },
    fetchProducts() {
        console.log('Fetching products...');

        const productsContainer = document.querySelector('[x-show="activeTab === \'products\'"]');
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }

        productsContainer.innerHTML = `
            <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        `;

        const token = localStorage.getItem('token');

        fetch('/api/admin/products', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch products');
                return response.json();
            })
            .then(response => {
                // Handle different response formats
                this.products = response.content || (Array.isArray(response) ? response : []);
                this.filteredProducts = [...this.products];
                this.renderProductsUI(this.products, productsContainer);
                this.setupEventListeners(productsContainer);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                productsContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
                        <p class="text-gray-500">${error.message}</p>
                        <button onclick="productModule.fetchProducts()" class="mt-4 bg-primary-600 text-white px-4 py-2 rounded">
                            <i class="fas fa-sync-alt mr-2"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
            });
    },

    /**
     * Fetch categories for the filter dropdown
     */
    fetchCategories() {
        const token = localStorage.getItem('token');

        fetch('/api/admin/categories', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch categories');
                return response.json();
            })
            .then(categories => {
                this.categories = categories;
                // Update category filter dropdown if it exists
                const categoryFilter = document.getElementById('product-category-filter');
                if (categoryFilter) {
                    this.updateCategoryFilter(categoryFilter);
                }
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
            });
    },

    /**
     * Update the category filter dropdown with fetched categories
     */
    updateCategoryFilter(selectElement) {
        // Keep the 'All Categories' option
        selectElement.innerHTML = '<option value="all">All Categories</option>';

        // Add categories from the API
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.categoryId;
            option.textContent = category.categoryNameEn || category.name;
            selectElement.appendChild(option);
        });
    },

    /**
     * Render the products UI
     */
    renderProductsUI(products, container) {
        container.innerHTML = '';

        // Create header with search and filters
        const header = document.createElement('div');
        header.className = 'px-4 sm:px-6 lg:px-8 py-6';
        header.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Products</h2>
                    <p class="text-sm text-gray-500 mt-1">Manage products in the marketplace</p>
                </div>
                <button id="add-product-btn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <i class="fas fa-plus mr-2"></i> Add Product
                </button>
            </div>
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                <div class="relative flex-grow">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fas fa-search text-gray-400"></i>
                    </div>
                    <input id="product-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500" placeholder="Search products...">
                </div>
                <div class="flex space-x-2">
                    <select id="product-category-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value="all">All Categories</option>
                        <!-- Categories will be populated dynamically -->
                    </select>
                    <select id="product-status-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                        <option value="all">All Status</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Create products table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'flex flex-col';
        tableContainer.innerHTML = `
            <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${products.length > 0 ? products.map((p, i) => `
                                    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                                                    ${p.productImage || p.imageUrl ? `<img src="${p.productImage || p.imageUrl}" class="h-10 w-10 object-cover">` :
                                                    `<div class="flex items-center justify-center h-full text-green-600"><i class="fas fa-seedling"></i></div>`}
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">${p.productName || p.name}</div>
                                                    <div class="text-sm text-gray-500">${p.categoryName || 'Uncategorized'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">${p.storeName || (p.store?.name || 'Unknown')}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">$${parseFloat(p.price || 0).toFixed(2)}</div>
                                            <div class="text-sm text-gray-500">${p.quantity || 0} ${p.unit || 'unit'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                                ${p.isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div class="flex space-x-2">
                                                <button class="text-primary-600 hover:text-primary-900" title="View" data-action="view" data-product-id="${p.productId}">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="text-indigo-600 hover:text-indigo-900" title="Edit" data-action="edit" data-product-id="${p.productId}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="text-red-600 hover:text-red-900" title="Delete" data-action="delete" data-product-id="${p.productId}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="5" class="px-6 py-12 whitespace-nowrap text-center">
                                            <div class="flex flex-col items-center justify-center">
                                                <i class="fas fa-box-open text-gray-300 text-5xl mb-4"></i>
                                                <p class="text-lg font-medium text-gray-500 mb-1">No products available</p>
                                                <p class="text-sm text-gray-400">
                                                    ${this.searchTerm || this.categoryFilter !== 'all' || this.statusFilter !== 'all' ?
                                                    'No products match your current filters. Try clearing your search or filters.' :
                                                    'There are currently no products in the system'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(tableContainer);

        // Update category filter with fetched categories
        const categoryFilter = document.getElementById('product-category-filter');
        if (categoryFilter && this.categories.length > 0) {
            this.updateCategoryFilter(categoryFilter);
        }
    },

    /**
     * Set up event listeners for the products UI
     */
    setupEventListeners(container) {
        // Add product button
        const addProductBtn = container.querySelector('#add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                window.location.href = '/admin/add-product';
            });
        }

        // Search input
        const searchInput = container.querySelector('#product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterProducts();
            });
        }

        // Category filter
        const categoryFilter = container.querySelector('#product-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.categoryFilter = e.target.value;
                this.filterProducts();
            });
        }

        // Status filter
        const statusFilter = container.querySelector('#product-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterProducts();
            });
        }

        // Action buttons (view, edit, delete)
        const actionButtons = container.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const productId = button.getAttribute('data-product-id');

                switch (action) {
                    case 'view':
                        this.viewProduct(productId);
                        break;
                    case 'edit':
                        this.editProduct(productId);
                        break;
                    case 'delete':
                        this.confirmDeleteProduct(productId);
                        break;
                }
            });
        });
    },

    /**
     * Filter products based on search term, category, and status
     */
    filterProducts() {
        this.filteredProducts = this.products.filter(product => {
            // Filter by search term
            const matchesSearch = !this.searchTerm ||
                (product.productName && product.productName.toLowerCase().includes(this.searchTerm)) ||
                (product.name && product.name.toLowerCase().includes(this.searchTerm)) ||
                (product.productDescription && product.productDescription.toLowerCase().includes(this.searchTerm)) ||
                (product.storeName && product.storeName.toLowerCase().includes(this.searchTerm));

            // Filter by category
            const matchesCategory = this.categoryFilter === 'all' ||
                product.categoryId == this.categoryFilter;

            // Filter by status
            const matchesStatus = this.statusFilter === 'all' ||
                (this.statusFilter === 'available' && product.isAvailable) ||
                (this.statusFilter === 'unavailable' && !product.isAvailable);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Re-render the filtered products
        const productsContainer = document.querySelector('[x-show="activeTab === \'products\'"]');
        if (productsContainer) {
            this.renderProductsUI(this.filteredProducts, productsContainer);
            this.setupEventListeners(productsContainer);
        }
    },

    /**
     * View product details
     */
    viewProduct(productId) {
        console.log('Viewing product:', productId);
        // Redirect to product details page
        window.location.href = `/admin/products/${productId}`;
    },

    /**
     * Edit product
     */
    editProduct(productId) {
        console.log('Editing product:', productId);
        // Redirect to edit product page
        window.location.href = `/admin/products/${productId}/edit`;
    },

    /**
     * Confirm product deletion
     */
    confirmDeleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            this.deleteProduct(productId);
        }
    },

    /**
     * Delete product
     */
    deleteProduct(productId) {
        console.log('Deleting product:', productId);

        const token = localStorage.getItem('token');

        fetch(`/api/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to delete product');
            return response.json();
        })
        .then(data => {
            // Show success message
            if (typeof AdminToast !== 'undefined') {
                AdminToast.success('Product deleted successfully');
            } else {
                alert('Product deleted successfully');
            }

            // Refresh products list
            this.fetchProducts();
        })
        .catch(error => {
            console.error('Error deleting product:', error);

            // Show error message
            if (typeof AdminToast !== 'undefined') {
                AdminToast.error('Failed to delete product: ' + error.message);
            } else {
                alert('Failed to delete product: ' + error.message);
            }
        });
    }
};

// Create a global function to bind our fetchProducts method to adminApp
window.bindProductModule = function(app) {
    console.log('Binding product module to app...');
    if (app) {
        app.fetchProducts = productModule.fetchProducts.bind(productModule);
        return true;
    }
    return false;
};

// Initialize the product module when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Products module initializing...');
    // Initialize the product module
    productModule.init();

    // If adminApp is available, bind our fetchProducts method to it
    if (typeof window.adminApp !== 'undefined') {
        console.log('Binding fetchProducts to adminApp...');
        window.bindProductModule(window.adminApp);
    } else {
        console.log('adminApp not available yet, will try to bind later');
        // Try again after a short delay in case adminApp is loaded later
        setTimeout(() => {
            if (typeof window.adminApp !== 'undefined') {
                console.log('Binding fetchProducts to adminApp (delayed)...');
                window.bindProductModule(window.adminApp);
            } else {
                console.warn('adminApp still not available after delay');
            }
        }, 1000);
    }
});
