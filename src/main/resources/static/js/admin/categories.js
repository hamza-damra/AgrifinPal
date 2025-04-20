/**
 * Categories Management Module
 * Handles the admin interface for managing product categories
 */

// Make sure categoriesManager is globally available
window.categoriesManager = {
    // Flag to track if the module has been initialized
    initialized: false,
    // Store the current categories data
    categories: [],
    filteredCategories: [],
    searchTerm: '',
    currentCategoryId: null,

    /**
     * Initialize the categories manager
     */
    init() {
        // Only initialize once
        if (this.initialized) {
            console.log('Categories module already initialized');
            return;
        }

        console.log('Initializing categories module...');

        // Mark as initialized
        this.initialized = true;

        // Initial load if we're already on the categories tab
        if (window.adminApp && window.adminApp.activeTab === 'categories') {
            this.fetchCategories();
        }
    },

    /**
     * Fetch categories from the API and render them
     */
    fetchCategories() {
        console.log('Fetching categories...');

        // Get the categories container
        const categoriesContainer = document.querySelector('[x-show="activeTab === \'categories\'"]');
        if (!categoriesContainer) {
            console.error('Categories container not found');
            return;
        }

        // Show loading state
        categoriesContainer.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        `;

        // Fetch categories from API
        // Get token from localStorage
        const token = localStorage.getItem('token');

        fetch('/api/admin/categories', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                return response.json();
            })
            .then(categories => {
                // Store categories for filtering
                this.categories = categories;
                this.filteredCategories = [...categories];

                // Render the categories UI
                this.renderCategoriesUI(categories, categoriesContainer);

                // Set up event listeners
                this.setupEventListeners(categoriesContainer);
            })
            .catch(error => {
                console.error('Error fetching categories:', error);
                categoriesContainer.innerHTML = `
                    <div class="bg-white shadow rounded-lg p-6">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load categories</h3>
                            <p class="text-gray-500">${error.message}</p>
                            <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="categoriesManager.fetchCategories()">
                                <i class="fas fa-sync-alt mr-2"></i> Try Again
                            </button>
                        </div>
                    </div>
                `;
            });
    },

    /**
     * Render the categories UI
     * @param {Array} categories - The categories to render
     * @param {HTMLElement} container - The container element
     */
    renderCategoriesUI(categories, container) {
        // Clear the container
        container.innerHTML = '';

        // Create the header with search and add button
        const header = document.createElement('div');
        header.className = 'px-4 sm:px-6 lg:px-8 py-6';
        header.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Product Categories</h2>
                    <p class="text-sm text-gray-500 mt-1">Manage product categories for the marketplace</p>
                </div>
                <button id="add-category-btn" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <i class="fas fa-plus mr-2"></i> Add Category
                </button>
            </div>
            <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                <div class="relative flex-grow">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fas fa-search text-gray-400"></i>
                    </div>
                    <input id="category-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500" placeholder="Search categories...">
                </div>
            </div>
        `;
        container.appendChild(header);

        // Create the table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'flex flex-col';
        tableContainer.innerHTML = `
            <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arabic Name</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${categories.length > 0 ? categories.map((category, i) => `
                                    <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                                                    ${category.image ?
                                                        `<img class="h-10 w-10 object-cover" src="${category.image}" alt="${category.nameEn || category.categoryNameEn}">` :
                                                        `<div class="h-10 w-10 flex items-center justify-center bg-primary-100 text-primary-600">
                                                            <i class="fas fa-tag text-lg"></i>
                                                        </div>`
                                                    }
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">${category.nameEn || category.categoryNameEn}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">${category.nameAr || category.categoryNameAr || '-'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-500">${category.description || 'No description'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div class="flex space-x-2">
                                                <button class="text-primary-600 hover:text-primary-900" title="Edit" data-action="edit" data-category-id="${category.id || category.categoryId}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="text-red-600 hover:text-red-900" title="Delete" data-action="delete" data-category-id="${category.id || category.categoryId}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') : `
                                    <tr>
                                        <td colspan="4" class="px-6 py-12 whitespace-nowrap text-center">
                                            <div class="flex flex-col items-center justify-center">
                                                <i class="fas fa-tags text-gray-300 text-5xl mb-4"></i>
                                                <p class="text-lg font-medium text-gray-500 mb-1">No categories available</p>
                                                <p class="text-sm text-gray-400">
                                                    ${this.searchTerm ?
                                                    'No categories match your search term. Try clearing your search.' :
                                                    'There are currently no product categories in the system'}
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
    },

    /**
     * Set up event listeners for the category buttons
     * @param {HTMLElement} container - The container element
     */
    setupEventListeners(container) {
        // Add Category button
        const addCategoryBtn = container.querySelector('#add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showAddCategoryModal();
            });
        }

        // Search input
        const searchInput = container.querySelector('#category-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterCategories();
            });
        }

        // Action buttons (edit, delete)
        const actionButtons = container.querySelectorAll('button[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                const categoryId = button.getAttribute('data-category-id');

                switch (action) {
                    case 'edit':
                        this.showEditCategoryModal(categoryId);
                        break;
                    case 'delete':
                        this.confirmDeleteCategory(categoryId);
                        break;
                }
            });
        });
    },

    /**
     * Filter categories based on search term
     */
    filterCategories() {
        this.filteredCategories = this.categories.filter(category => {
            // Filter by search term
            const matchesSearch = !this.searchTerm ||
                (category.nameEn && category.nameEn.toLowerCase().includes(this.searchTerm)) ||
                (category.categoryNameEn && category.categoryNameEn.toLowerCase().includes(this.searchTerm)) ||
                (category.nameAr && category.nameAr.toLowerCase().includes(this.searchTerm)) ||
                (category.categoryNameAr && category.categoryNameAr.toLowerCase().includes(this.searchTerm)) ||
                (category.description && category.description.toLowerCase().includes(this.searchTerm));

            return matchesSearch;
        });

        // Re-render the filtered categories
        const categoriesContainer = document.querySelector('[x-show="activeTab === \'categories\'"]');
        if (categoriesContainer) {
            this.renderCategoriesUI(this.filteredCategories, categoriesContainer);
            this.setupEventListeners(categoriesContainer);
        }
    },

    /**
     * Show modal for adding a new category
     */
    showAddCategoryModal() {
        console.log('Opening add category modal...');
        // Implementation for showing add category modal
        if (window.adminApp) {
            window.adminApp.showAddCategoryModal = true;
        }
    },

    /**
     * Show modal for editing an existing category
     * @param {string} categoryId - The ID of the category to edit
     */
    showEditCategoryModal(categoryId) {
        console.log('Edit category:', categoryId);
        this.currentCategoryId = categoryId;

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Fetch category details
        fetch(`/api/admin/categories/${categoryId}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch category details');
            }
            return response.json();
        })
        .then(category => {
            // Populate edit form with category details
            if (window.adminApp) {
                window.adminApp.categoryToEdit = category;
                window.adminApp.showEditCategoryModal = true;
            }
        })
        .catch(error => {
            console.error('Error fetching category details:', error);
            if (typeof AdminToast !== 'undefined') {
                AdminToast.error('Failed to load category details');
            }
        });
    },

    /**
     * Show confirmation dialog for deleting a category
     * @param {string} categoryId - The ID of the category to delete
     */
    confirmDeleteCategory(categoryId) {
        console.log('Delete category:', categoryId);
        if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            this.deleteCategory(categoryId);
        }
    },

    /**
     * Delete a category
     * @param {string} categoryId - The ID of the category to delete
     */
    deleteCategory(categoryId) {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Call API to delete category
        fetch(`/api/admin/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete category');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (typeof AdminToast !== 'undefined') {
                AdminToast.success('Category deleted successfully');
            }

            // Refresh categories list
            this.fetchCategories();
        })
        .catch(error => {
            console.error('Error deleting category:', error);
            if (typeof AdminToast !== 'undefined') {
                AdminToast.error('Failed to delete category: ' + error.message);
            }
        });
    },

    /**
     * Add a new category
     * @param {Object} categoryData - The category data to add
     */
    addCategory(categoryData) {
        console.log('Adding category:', categoryData);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Call API to add category
        fetch('/api/admin/categories', {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add category');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (typeof AdminToast !== 'undefined') {
                AdminToast.success('Category added successfully');
            }

            // Refresh categories list
            this.fetchCategories();

            // Close modal
            if (window.adminApp) {
                window.adminApp.showAddCategoryModal = false;
            }
        })
        .catch(error => {
            console.error('Error adding category:', error);
            if (typeof AdminToast !== 'undefined') {
                AdminToast.error('Failed to add category: ' + error.message);
            }
        });
    },

    /**
     * Update an existing category
     * @param {string} categoryId - The ID of the category to update
     * @param {Object} categoryData - The updated category data
     */
    updateCategory(categoryId, categoryData) {
        console.log('Updating category:', categoryId, categoryData);

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Call API to update category
        fetch(`/api/admin/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update category');
            }
            return response.json();
        })
        .then(data => {
            // Show success message
            if (typeof AdminToast !== 'undefined') {
                AdminToast.success('Category updated successfully');
            }

            // Refresh categories list
            this.fetchCategories();

            // Close modal
            if (window.adminApp) {
                window.adminApp.showEditCategoryModal = false;
            }
        })
        .catch(error => {
            console.error('Error updating category:', error);
            if (typeof AdminToast !== 'undefined') {
                AdminToast.error('Failed to update category: ' + error.message);
            }
        });
    }
};

// Create a global function to bind our fetchCategories method to adminApp
window.bindCategoryModule = function(app) {
    console.log('Binding category module to app...');
    if (app) {
        app.fetchCategories = categoriesManager.fetchCategories.bind(categoriesManager);
        return true;
    }
    return false;
};

// Initialize the categories manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Categories module initializing...');
    // Initialize the categories module
    categoriesManager.init();

    // If adminApp is available, bind our fetchCategories method to it
    if (typeof window.adminApp !== 'undefined') {
        console.log('Binding fetchCategories to adminApp...');
        window.bindCategoryModule(window.adminApp);
    } else {
        console.log('adminApp not available yet, will try to bind later');
        // Try again after a short delay in case adminApp is loaded later
        setTimeout(() => {
            if (typeof window.adminApp !== 'undefined') {
                console.log('Binding fetchCategories to adminApp (delayed)...');
                window.bindCategoryModule(window.adminApp);
            } else {
                console.warn('adminApp still not available after delay');
            }
        }, 1000);
    }
});
