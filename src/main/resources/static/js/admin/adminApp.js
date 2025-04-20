function createAdminApp() {
    return {
        isLoading: true,
        mobileMenuOpen: false,
        profileMenuOpen: false,
        showNotifications: false,
        showUsersMenu: true,
        showContentMenu: true,
        showSettingsMenu: false,
        activeTab: 'dashboard',
        showAddSellerModal: false,
        showViewSellerModal: false,
        showAddCategoryModal: false,
        showEditCategoryModal: false,
        categoryToEdit: null,

        init() {
            console.log('Admin app initialized');

            // Bind product module if available
            if (typeof window.bindProductModule === 'function') {
                console.log('Binding product module from adminApp init...');
                window.bindProductModule(this);
            }

            // Bind category module if available
            if (typeof window.bindCategoryModule === 'function') {
                console.log('Binding category module from adminApp init...');
                window.bindCategoryModule(this);
            }

            // Simulate loading
            setTimeout(() => {
                this.isLoading = false;
                console.log('Admin app loading complete');

                // Add event listeners after the page is loaded
                this.setupEventListeners();
            }, 1000);

            // Fetch initial data
            this.fetchDashboardData();
        },

        setupEventListeners() {
            // Setup event listeners for admin panel functionality

            // Add event listeners for other buttons as needed
        },

        setActiveTab(tab) {
            this.activeTab = tab;
            this.mobileMenuOpen = false;

            // Load data based on active tab
            switch(tab) {
                case 'dashboard':
                    this.fetchDashboardData();
                    break;
                case 'buyers':
                    this.fetchBuyers();
                    break;
                case 'sellers':
                    this.fetchSellers();
                    break;
                case 'products':
                    this.fetchProducts();
                    break;
                case 'categories':
                    this.fetchCategories();
                    break;
                case 'orders':
                    this.fetchOrders();
                    break;
                case 'admins':
                    this.fetchAdmins();
                    break;
            }
        },

        getActiveTabTitle() {
            const titles = {
                'dashboard': 'Dashboard',
                'buyers': 'Buyers Management',
                'sellers': 'Sellers Management',
                'admins': 'Administrators',
                'products': 'Products',
                'categories': 'Product Categories',

                'orders': 'Orders',
                'reports': 'Reports',
                'platform-settings': 'Platform Settings',
                'payment-methods': 'Payment Methods'
            };
            return titles[this.activeTab] || 'Dashboard';
        },

        toggleUsersMenu() {
            this.showUsersMenu = !this.showUsersMenu;
        },

        toggleContentMenu() {
            this.showContentMenu = !this.showContentMenu;
        },

        toggleSettingsMenu() {
            this.showSettingsMenu = !this.showSettingsMenu;
        },

        toggleNotifications() {
            this.showNotifications = !this.showNotifications;
        },

        logout() {
            // Clear token from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('userRoles');
            localStorage.removeItem('userId');
            localStorage.removeItem('userStoreId');
            localStorage.removeItem('userStoreName');

            // Clear token cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

            // Redirect to admin login page
            window.location.href = '/admin/login?logout=true';
        },

        // Data fetching methods
        fetchCategories() {
            console.log('Initializing categories manager...');
            // This method delegates to the CategoriesManager in categories.js
            // If the CategoriesManager is already initialized, this will be a no-op
            // Otherwise, it will create a new instance

            // Check if CategoriesManager exists
            if (typeof CategoriesManager === 'undefined') {
                console.error('CategoriesManager not found. Make sure categories.js is loaded.');

                // Get the categories container
                const categoriesContainer = document.querySelector('[x-show="activeTab === \'categories\'"]');
                if (categoriesContainer) {
                    categoriesContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load categories</h3>
                                <p class="text-gray-500">The categories module could not be loaded. Please refresh the page and try again.</p>
                                <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="location.reload()">
                                    <i class="fas fa-sync-alt mr-2"></i> Refresh Page
                                </button>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // Initialize CategoriesManager if it's not already initialized
            if (!window.categoriesManager) {
                window.categoriesManager = new CategoriesManager();
            }
        },

        fetchDashboardData() {
            console.log('Fetching dashboard data...');

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch dashboard statistics from API
            fetch('/api/admin/dashboard-stats', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch dashboard statistics');
                    }
                    return response.json();
                })
                .then(stats => {
                    // Update the dashboard cards with real data
                    this.updateDashboardCards(stats);
                })
                .catch(error => {
                    console.error('Error fetching dashboard statistics:', error);
                    // Show error toast
                    if (typeof AdminToast !== 'undefined') {
                        AdminToast.error('Failed to load dashboard statistics');
                    } else {
                        console.error('Failed to load dashboard statistics');
                    }
                });
        },

        updateDashboardCards(stats) {
            // Update Total Users card
            const totalUsersElement = document.querySelector('[data-stat="total-users"]');
            const userGrowthElement = document.querySelector('[data-stat="user-growth"]');
            if (totalUsersElement) {
                totalUsersElement.textContent = stats.totalUsers.toLocaleString();
            }
            if (userGrowthElement) {
                userGrowthElement.textContent = stats.userGrowth + '%';
            }

            // Update Active Sellers card
            const activeSellersElement = document.querySelector('[data-stat="active-sellers"]');
            const sellerGrowthElement = document.querySelector('[data-stat="seller-growth"]');
            if (activeSellersElement) {
                activeSellersElement.textContent = stats.activeSellers.toLocaleString();
            }
            if (sellerGrowthElement) {
                sellerGrowthElement.textContent = stats.sellerGrowth + '%';
            }

            // Update Total Products card
            const totalProductsElement = document.querySelector('[data-stat="total-products"]');
            const productGrowthElement = document.querySelector('[data-stat="product-growth"]');
            if (totalProductsElement) {
                totalProductsElement.textContent = stats.totalProducts.toLocaleString();
            }
            if (productGrowthElement) {
                productGrowthElement.textContent = stats.productGrowth + '%';
            }

            // Update Monthly Orders card
            const monthlyOrdersElement = document.querySelector('[data-stat="monthly-orders"]');
            const orderGrowthElement = document.querySelector('[data-stat="order-growth"]');
            if (monthlyOrdersElement) {
                monthlyOrdersElement.textContent = stats.monthlyOrders.toLocaleString();
            }
            if (orderGrowthElement) {
                orderGrowthElement.textContent = stats.orderGrowth + '%';
            }
        },

        fetchBuyers() {
            console.log('Fetching buyers...');

            // Get the buyers container
            const buyersContainer = document.querySelector('[x-show="activeTab === \'buyers\'"]');
            if (!buyersContainer) {
                console.error('Buyers container not found');
                return;
            }

            // Show loading state with proper padding
            buyersContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch buyers from API
            fetch('/api/admin/buyers', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch buyers');
                    }
                    return response.json();
                })
                .then(buyers => {
                    // Create buyers UI with proper padding
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // Add header without add button
                    const header = document.createElement('div');
                    header.className = 'mb-6';
                    header.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h2 class="text-xl font-bold text-gray-900">Buyers</h2>
                                <p class="text-sm text-gray-500 mt-1">Manage buyers and their accounts</p>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                            <div class="relative flex-grow">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fas fa-search text-gray-400"></i>
                                </div>
                                <input id="buyer-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search buyers...">
                            </div>
                            <div class="flex space-x-2">
                                <select id="buyer-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                    <option value="pending">Pending Only</option>
                                    <option value="suspended">Suspended Only</option>
                                    <option value="banned">Banned Only</option>
                                </select>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center text-sm text-gray-600 border border-gray-200">
                            <i class="fas fa-info-circle text-primary-500 mr-2"></i>
                            <span>Buyers can purchase products from the marketplace but cannot sell products.</span>
                        </div>
                    `;
                    container.appendChild(header);

                    // Create buyers table with enhanced UI and proper padding
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
                    tableContainer.innerHTML = `
                        <div class="overflow-x-auto">
                            <div class="py-2 align-middle inline-block min-w-full px-4">
                                <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            ${buyers.length > 0 ? buyers.map((buyer, index) => `
                                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                                                ${buyer.profileImage ?
                        `<img class="h-12 w-12 object-cover" src="${buyer.profileImage}" alt="${buyer.fullName}">` :
                        `<div class="h-12 w-12 flex items-center justify-center bg-green-50 text-green-600">
                                                                        <i class="fas fa-user text-xl"></i>
                                                                    </div>`
                    }
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-medium text-gray-900">${buyer.fullName || buyer.username}</div>
                                                                <div class="text-sm text-gray-500 flex items-center">
                                                                    <span class="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full mr-1">@${buyer.username}</span>
                                                                    <span class="text-xs text-gray-400">ID: ${buyer.userId}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900 flex items-center">
                                                            <i class="fas fa-envelope text-gray-400 mr-2"></i>
                                                            ${buyer.email}
                                                        </div>
                                                        <div class="text-sm text-gray-500 flex items-center mt-1">
                                                            <i class="fas fa-phone text-gray-400 mr-2"></i>
                                                            ${buyer.phone || 'No phone'}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-700 flex items-center">
                                                            <i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                                                            ${buyer.region || 'Unknown location'}
                                                        </div>
                                                        <div class="text-xs text-gray-500 mt-1">
                                                            ${buyer.agricultureType || 'No agriculture type'}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        ${UserStatus.renderStatusBadge(buyer.status || (buyer.isActive ? 'ACTIVE' : 'INACTIVE'))}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div class="flex space-x-2">
                                                            <button class="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md transition-colors duration-150"
                                                                    data-buyer-id="${buyer.userId}"
                                                                    data-action="view"
                                                                    title="View buyer details">
                                                                <i class="fas fa-eye"></i>
                                                            </button>

                                                            <button class="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors duration-150"
                                                                    data-buyer-id="${buyer.userId}"
                                                                    data-action="delete"
                                                                    title="Delete buyer">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="5" class="px-6 py-12 whitespace-nowrap text-center text-gray-500">
                                                        <div class="flex flex-col items-center justify-center">
                                                            <i class="fas fa-user text-gray-300 text-5xl mb-4"></i>
                                                            <p class="text-lg font-medium text-gray-500 mb-1">No buyers found</p>
                                                            <p class="text-sm text-gray-400">Click the "Add Buyer" button to create one</p>
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

                    // Add pagination if needed
                    if (buyers.length > 10) {
                        const pagination = document.createElement('div');
                        pagination.className = 'bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm';
                        pagination.innerHTML = `
                            <div class="flex-1 flex justify-between sm:hidden">
                                <a href="#" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</a>
                                <a href="#" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</a>
                            </div>
                            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p class="text-sm text-gray-700">
                                        Showing <span class="font-medium">1</span> to <span class="font-medium">${Math.min(10, buyers.length)}</span> of <span class="font-medium">${buyers.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Previous</span>
                                            <i class="fas fa-chevron-left"></i>
                                        </a>
                                        <a href="#" aria-current="page" class="z-10 bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</a>
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Next</span>
                                            <i class="fas fa-chevron-right"></i>
                                        </a>
                                    </nav>
                                </div>
                            </div>
                        `;
                        container.appendChild(pagination);
                    }

                    container.appendChild(tableContainer);

                    // Replace loading state with buyers UI
                    buyersContainer.innerHTML = '';
                    buyersContainer.appendChild(container);

                    // Add event listeners to buttons
                    const actionButtons = buyersContainer.querySelectorAll('button[data-buyer-id]');
                    actionButtons.forEach(btn => {
                        const buyerId = btn.getAttribute('data-buyer-id');
                        const action = btn.getAttribute('data-action');

                        btn.addEventListener('click', () => {
                            if (action === 'view') {
                                // Implement view buyer details functionality
                                console.log('View buyer details:', buyerId);
                            } else if (action === 'toggle-status') {
                                // Toggle status is now handled by the inline onclick handler
                                console.log('Toggle status button clicked, but action is handled by inline onclick handler');
                            } else if (action === 'delete') {
                                // Implement delete buyer functionality
                                console.log('Delete buyer:', buyerId);
                            }
                        });
                    });

                    // Add event listener to search input
                    const searchInput = document.getElementById('buyer-search');
                    if (searchInput) {
                        searchInput.addEventListener('input', (e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const rows = buyersContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                const name = row.querySelector('.text-gray-900')?.textContent.toLowerCase() || '';
                                const username = row.querySelector('.bg-green-50')?.textContent.toLowerCase() || '';
                                const email = row.querySelector('.fa-envelope')?.nextSibling?.textContent.trim().toLowerCase() || '';

                                if (name.includes(searchTerm) || username.includes(searchTerm) || email.includes(searchTerm)) {
                                    row.style.display = '';
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                        });
                    }

                    // Add event listener to filter dropdown
                    const filterSelect = document.getElementById('buyer-filter');
                    if (filterSelect) {
                        filterSelect.addEventListener('change', (e) => {
                            const filterValue = e.target.value;
                            const rows = buyersContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                if (filterValue === 'all') {
                                    row.style.display = '';
                                } else {
                                    // Get the status from the status dropdown
                                    const statusCell = row.querySelector('td:nth-child(4)');
                                    const statusText = statusCell.textContent.trim().toLowerCase();

                                    if (filterValue === 'active' && statusText.includes('active')) {
                                        row.style.display = '';
                                    } else if (filterValue === 'inactive' && statusText.includes('inactive')) {
                                        row.style.display = '';
                                    } else if (filterValue === 'pending' && statusText.includes('pending')) {
                                        row.style.display = '';
                                    } else if (filterValue === 'suspended' && statusText.includes('suspended')) {
                                        row.style.display = '';
                                    } else if (filterValue === 'banned' && statusText.includes('banned')) {
                                        row.style.display = '';
                                    } else {
                                        row.style.display = 'none';
                                    }
                                }
                            });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching buyers:', error);
                    buyersContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load buyers</h3>
                                <p class="text-gray-500">${error.message}</p>
                                <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="adminApp.fetchBuyers()">
                                    <i class="fas fa-sync-alt mr-2"></i> Try Again
                                </button>
                            </div>
                        </div>
                    `;
                });
        },

        fetchSellers() {
            console.log('Fetching sellers...');

            // Get the sellers container
            const sellersContainer = document.querySelector('[x-show="activeTab === \'sellers\'"]');
            if (!sellersContainer) {
                console.error('Sellers container not found');
                return;
            }

            // Show loading state with proper padding
            sellersContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch sellers from API
            fetch('/api/admin/sellers', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch sellers');
                    }
                    return response.json();
                })
                .then(sellers => {
                    // Create sellers UI with proper padding
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // Add header without add button
                    const header = document.createElement('div');
                    header.className = 'mb-6';
                    header.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h2 class="text-xl font-bold text-gray-900">Sellers</h2>
                                <p class="text-sm text-gray-500 mt-1">Manage sellers and their stores</p>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                            <div class="relative flex-grow">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fas fa-search text-gray-400"></i>
                                </div>
                                <input id="seller-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search sellers...">
                            </div>
                            <div class="flex space-x-2">
                                <select id="seller-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center text-sm text-gray-600 border border-gray-200">
                            <i class="fas fa-info-circle text-primary-500 mr-2"></i>
                            <span>Sellers can create stores and list products for sale in the marketplace.</span>
                        </div>
                    `;
                    container.appendChild(header);

                    // Create sellers table with enhanced UI and proper padding
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';

                    tableContainer.innerHTML = `
                        <div class="overflow-x-auto">
                            <div class="py-2 align-middle inline-block min-w-full px-4">
                                <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            ${sellers.length > 0 ? sellers.map((seller, index) => `
                                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                                                ${seller.profileImage ?
                        `<img class="h-12 w-12 object-cover" src="${seller.profileImage}" alt="${seller.fullName}">` :
                        `<div class="h-12 w-12 flex items-center justify-center bg-amber-50 text-amber-600">
                                                                        <i class="fas fa-store-alt text-xl"></i>
                                                                    </div>`
                    }
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-medium text-gray-900">${seller.fullName || seller.username}</div>
                                                                <div class="text-sm text-gray-500 flex items-center">
                                                                    <span class="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full mr-1">@${seller.username}</span>
                                                                    <span class="text-xs text-gray-400">ID: ${seller.userId}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900 flex items-center">
                                                            <i class="fas fa-envelope text-gray-400 mr-2"></i>
                                                            ${seller.email}
                                                        </div>
                                                        <div class="text-sm text-gray-500 flex items-center mt-1">
                                                            <i class="fas fa-phone text-gray-400 mr-2"></i>
                                                            ${seller.phone || 'No phone'}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-700 flex items-center">
                                                            <i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                                                            ${seller.region || 'Unknown location'}
                                                        </div>
                                                        <div class="text-xs text-gray-500 mt-1">
                                                            ${seller.agricultureType || 'No agriculture type'}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        ${UserStatus.renderStatusBadge(seller.status || (seller.isActive ? 'ACTIVE' : 'INACTIVE'))}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div class="flex space-x-2">
                                                            <button class="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md transition-colors duration-150"
                                                                    data-seller-id="${seller.userId}"
                                                                    data-action="view"
                                                                    title="View seller details"
                                                                    @click="openViewSellerModal(${seller.userId})">
                                                                <i class="fas fa-eye"></i>
                                                            </button>

                                                            <button class="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors duration-150"
                                                                    data-seller-id="${seller.userId}"
                                                                    data-action="delete"
                                                                    title="Delete seller">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="5" class="px-6 py-12 whitespace-nowrap text-center text-gray-500">
                                                        <div class="flex flex-col items-center justify-center">
                                                            <i class="fas fa-store-alt text-gray-300 text-5xl mb-4"></i>
                                                            <p class="text-lg font-medium text-gray-500 mb-1">No sellers found</p>
                                                            <p class="text-sm text-gray-400">Click the "Add Seller" button to create one</p>
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

                    // Add pagination if needed
                    if (sellers.length > 10) {
                        const pagination = document.createElement('div');
                        pagination.className = 'bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm';
                        pagination.innerHTML = `
                            <div class="flex-1 flex justify-between sm:hidden">
                                <a href="#" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</a>
                                <a href="#" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</a>
                            </div>
                            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p class="text-sm text-gray-700">
                                        Showing <span class="font-medium">1</span> to <span class="font-medium">${Math.min(10, sellers.length)}</span> of <span class="font-medium">${sellers.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Previous</span>
                                            <i class="fas fa-chevron-left"></i>
                                        </a>
                                        <a href="#" aria-current="page" class="z-10 bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</a>
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Next</span>
                                            <i class="fas fa-chevron-right"></i>
                                        </a>
                                    </nav>
                                </div>
                            </div>
                        `;
                        container.appendChild(pagination);
                    }

                    container.appendChild(tableContainer);

                    // Replace loading state with sellers UI
                    sellersContainer.innerHTML = '';
                    sellersContainer.appendChild(container);

                    // Add event listeners to buttons
                    const actionButtons = sellersContainer.querySelectorAll('button[data-seller-id]');
                    actionButtons.forEach(btn => {
                        const sellerId = btn.getAttribute('data-seller-id');
                        const action = btn.getAttribute('data-action');

                        if (action === 'view') {
                            // The view button already has the @click attribute for Alpine.js
                            // No need to add an event listener here
                        } else if (action === 'toggle-status') {
                            // Toggle status is now handled by the inline onclick handler
                            // No need to add an event listener here
                        } else if (action === 'delete') {
                            btn.addEventListener('click', () => {
                                // Implement delete seller functionality
                                console.log('Delete seller:', sellerId);
                            });
                        }
                    });

                    // Add event listener to search input
                    const searchInput = document.getElementById('seller-search');
                    if (searchInput) {
                        searchInput.addEventListener('input', (e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const rows = sellersContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                const name = row.querySelector('.text-gray-900')?.textContent.toLowerCase() || '';
                                const username = row.querySelector('.bg-amber-50')?.textContent.toLowerCase() || '';
                                const email = row.querySelector('.fa-envelope')?.nextSibling?.textContent.trim().toLowerCase() || '';

                                if (name.includes(searchTerm) || username.includes(searchTerm) || email.includes(searchTerm)) {
                                    row.style.display = '';
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                        });
                    }

                    // Add event listener to filter dropdown
                    const filterSelect = document.getElementById('seller-filter');
                    if (filterSelect) {
                        filterSelect.addEventListener('change', (e) => {
                            const filterValue = e.target.value;
                            const rows = sellersContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                if (filterValue === 'all') {
                                    row.style.display = '';
                                } else if (filterValue === 'active') {
                                    const isActive = row.querySelector('.bg-green-100') !== null;
                                    row.style.display = isActive ? '' : 'none';
                                } else if (filterValue === 'inactive') {
                                    const isActive = row.querySelector('.bg-green-100') !== null;
                                    row.style.display = !isActive ? '' : 'none';
                                }
                            });
                        });
                    }

                    // Add event listener to the add seller button
                    const addSellerBtn = document.getElementById('add-seller-btn');
                    if (addSellerBtn) {
                        addSellerBtn.addEventListener('click', () => {
                            this.openAddSellerModal();
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching sellers:', error);
                    sellersContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load sellers</h3>
                                <p class="text-gray-500">${error.message}</p>
                                <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="adminApp.fetchSellers()">
                                    <i class="fas fa-sync-alt mr-2"></i> Try Again
                                </button>
                            </div>
                        </div>
                    `;
                });
        },

        fetchProducts() {
            console.log('Fetching products...');

            // Get the products container
            const productsContainer = document.querySelector('[x-show="activeTab === \'products\'"]');
            if (!productsContainer) {
                console.error('Products container not found');
                return;
            }

            // Show loading state with proper padding
            productsContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch products from API
            fetch('/api/admin/products', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch products');
                    }
                    return response.json();
                })
                .then(response => {
                    // Check if the response is a Page object (Spring Data pagination)
                    const products = response.content ? response.content : (Array.isArray(response) ? response : []);

                    // Create products UI with proper padding
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // Add enhanced header with search and add button
                    const header = document.createElement('div');
                    header.className = 'mb-6';
                    header.innerHTML = `
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h2 class="text-xl font-bold text-gray-900">Products</h2>
                                <p class="text-sm text-gray-500 mt-1">Manage products in the marketplace</p>
                            </div>
                            <button id="add-product-btn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150">
                                <i class="fas fa-plus mr-2"></i> Add Product
                            </button>
                        </div>
                        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                            <div class="relative flex-grow">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i class="fas fa-search text-gray-400"></i>
                                </div>
                                <input id="product-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search products...">
                            </div>
                            <div class="flex space-x-2">
                                <select id="product-category-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                    <option value="all">All Categories</option>
                                    <option value="fruits">Fruits</option>
                                    <option value="vegetables">Vegetables</option>
                                    <option value="grains">Grains</option>
                                </select>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center text-sm text-gray-600 border border-gray-200">
                            <i class="fas fa-info-circle text-primary-500 mr-2"></i>
                            <span>Products are listed in the marketplace and can be purchased by buyers.</span>
                        </div>
                    `;
                    container.appendChild(header);

                    // Create products table with enhanced UI and proper padding
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
                    tableContainer.innerHTML = `
                        <div class="overflow-x-auto">
                            <div class="py-2 align-middle inline-block min-w-full px-4">
                                <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">

                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                            ${products.length > 0 ? products.map((product, index) => `
                                                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                                                                ${product.productImage || product.imageUrl ?
                        `<img class="h-10 w-10 object-cover" src="${product.productImage || product.imageUrl}" alt="${product.productName || product.name}">` :
                        `<div class="h-10 w-10 flex items-center justify-center bg-green-100 text-green-600">
                                                                        <i class="fas fa-seedling text-lg"></i>
                                                                    </div>`
                    }
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-medium text-gray-900">${product.productName || product.name}</div>
                                                                <div class="text-sm text-gray-500">${product.categoryName || 'Uncategorized'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900">${product.storeName || (product.store ? product.store.name : 'Unknown')}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900">$${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</div>
                                                        <div class="text-sm text-gray-500">${product.unit || 'unit'}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                                            ${product.isAvailable ? 'Available' : 'Unavailable'}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div class="flex space-x-2">
                                                            <button class="text-primary-600 hover:text-primary-900" data-product-id="${product.id || product.productId}" data-action="edit">
                                                                <i class="fas fa-edit"></i>
                                                            </button>
                                                            <button class="text-red-600 hover:text-red-900" data-product-id="${product.id || product.productId}" data-action="delete">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="5" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                                        <div class="flex flex-col items-center justify-center py-6">
                                                            <i class="fas fa-box text-gray-300 text-5xl mb-4"></i>
                                                            <p class="text-lg font-medium text-gray-500 mb-1">No products found</p>
                                                            <p class="text-sm text-gray-400">Click the "Add Product" button to create one</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `}
                            </tbody>
                        </table>
                    `;

                    // Add pagination if needed
                    if (products.length > 10) {
                        const pagination = document.createElement('div');
                        pagination.className = 'bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm';
                        pagination.innerHTML = `
                            <div class="flex-1 flex justify-between sm:hidden">
                                <a href="#" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Previous</a>
                                <a href="#" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">Next</a>
                            </div>
                            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p class="text-sm text-gray-700">
                                        Showing <span class="font-medium">1</span> to <span class="font-medium">${products.length}</span> of <span class="font-medium">${products.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Previous</span>
                                            <i class="fas fa-chevron-left"></i>
                                        </a>
                                        <a href="#" aria-current="page" class="z-10 bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">1</a>
                                        <a href="#" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                            <span class="sr-only">Next</span>
                                            <i class="fas fa-chevron-right"></i>
                                        </a>
                                    </nav>
                                </div>
                            </div>
                        `;
                        container.appendChild(pagination);
                    }

                    container.appendChild(tableContainer);

                    // Replace loading state with products UI
                    productsContainer.innerHTML = '';
                    productsContainer.appendChild(container);
                })
                .catch(error => {
                    console.error('Error fetching products:', error);
                    productsContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
                                <p class="text-gray-500">${error.message}</p>
                                <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="adminApp.fetchProducts()">
                                    <i class="fas fa-sync-alt mr-2"></i> Try Again
                                </button>
                            </div>
                        </div>
                    `;
                });
        },

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
                    // Create categories table
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col';

                    tableContainer.innerHTML = `
                        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                                <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                    <div class="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                                        <div class="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                                            <div class="ml-4 mt-2">
                                                <h3 class="text-lg leading-6 font-medium text-gray-900">Product Categories</h3>
                                            </div>
                                            <div class="ml-4 mt-2 flex-shrink-0">
                                                <button type="button" class="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                                    <i class="fas fa-plus mr-2"></i> Add Category
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                            ${categories.length > 0 ? categories.map(category => `
                                                <tr>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="flex items-center">
                                                            <div class="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden">
                                                                ${category.image ?
                        `<img class="h-10 w-10 object-cover" src="${category.image}" alt="${category.nameEn}">` :
                        `<div class="h-10 w-10 flex items-center justify-center bg-primary-100 text-primary-600">
                                                                        <i class="fas fa-tag text-lg"></i>
                                                                    </div>`
                    }
                                                            </div>
                                                            <div class="ml-4">
                                                                <div class="text-sm font-medium text-gray-900">${category.nameEn}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-900">${category.nameAr}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-500">${category.description || 'No description'}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div class="flex space-x-2">
                                                            <button class="text-primary-600 hover:text-primary-900" data-category-id="${category.id}">
                                                                <i class="fas fa-edit"></i>
                                                            </button>
                                                            <button class="text-red-600 hover:text-red-900">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('') : `
                                                <tr>
                                                    <td colspan="4" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                                        No categories found
                                                    </td>
                                                </tr>
                                            `}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;

                    // Replace loading state with categories table
                    categoriesContainer.innerHTML = '';
                    categoriesContainer.appendChild(tableContainer);

                    // Add event listeners to buttons
                    const editButtons = categoriesContainer.querySelectorAll('button');
                    editButtons.forEach(btn => {
                        if (btn.querySelector('.fa-edit')) {
                            btn.addEventListener('click', () => {
                                const categoryId = btn.getAttribute('data-category-id');
                                // Implement edit category functionality
                                console.log('Edit category:', categoryId);
                            });
                        }
                    });
                })
                .catch(error => {
                    console.error('Error fetching categories:', error);
                    categoriesContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load categories</h3>
                                <p class="text-gray-500">${error.message}</p>
                            </div>
                        </div>
                    `;
                });
        },

        fetchOrders() {
            console.log('Fetching orders...');

            // Get the orders container
            const ordersContainer = document.querySelector('[x-show="activeTab === \'orders\'"]');
            if (!ordersContainer) {
                console.error('Orders container not found');
                return;
            }

            // Show loading state
            ordersContainer.innerHTML = `
                <div class="flex justify-center items-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;
        },

        fetchAdmins() {
            console.log('Fetching administrators...');

            // Get the admins container
            const adminsContainer = document.querySelector('[x-show="activeTab === \'admins\'"]');
            if (!adminsContainer) {
                console.error('Administrators container not found');
                return;
            }

            // Show loading state with proper padding
            adminsContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch administrators from API
            fetch('/api/admin/admins', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch administrators');
                    }
                    return response.json();
                })
                .then(admins => {
                    // Create administrators UI with proper padding
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // Add header without add button
                    const header = document.createElement('div');
                    header.className = 'mb-6';
                    header.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">Administrators</h2>
                            <p class="text-sm text-gray-500 mt-1">Manage system administrators and their permissions</p>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                        <div class="relative flex-grow">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-search text-gray-400"></i>
                            </div>
                            <input id="admin-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search administrators...">
                        </div>
                        <div class="flex space-x-2">
                            <select id="admin-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg mb-4 flex items-center text-sm text-gray-600 border border-gray-200">
                        <i class="fas fa-info-circle text-primary-500 mr-2"></i>
                        <span>Administrators have full access to the system. Be careful when assigning admin privileges.</span>
                    </div>
                `;
                    container.appendChild(header);

                    // Create administrators table with enhanced UI and proper padding
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
                    tableContainer.innerHTML = `
                    <div class="overflow-x-auto">
                        <div class="py-2 align-middle inline-block min-w-full px-4">
                            <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrator</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        ${admins.length > 0 ? admins.map((admin, index) => `
                                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="flex items-center">
                                                        <div class="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                                            ${admin.profileImage ?
                        `<img class="h-12 w-12 object-cover" src="${admin.profileImage}" alt="${admin.fullName}">` :
                        `<div class="h-12 w-12 flex items-center justify-center bg-primary-50 text-primary-600">
                                                                    <i class="fas fa-user-shield text-xl"></i>
                                                                </div>`
                    }
                                                        </div>
                                                        <div class="ml-4">
                                                            <div class="text-sm font-medium text-gray-900">${admin.fullName || admin.username}</div>
                                                            <div class="text-sm text-gray-500 flex items-center">
                                                                <span class="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full mr-1">@${admin.username}</span>
                                                                <span class="text-xs text-gray-400">ID: ${admin.userId}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-900 flex items-center">
                                                        <i class="fas fa-envelope text-gray-400 mr-2"></i>
                                                        ${admin.email}
                                                    </div>
                                                    <div class="text-sm text-gray-500 flex items-center mt-1">
                                                        <i class="fas fa-phone text-gray-400 mr-2"></i>
                                                        ${admin.phone || 'No phone'}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-700 flex items-center">
                                                        <i class="fas fa-clock text-gray-400 mr-2"></i>
                                                        ${admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                                                    </div>
                                                    <div class="text-xs text-gray-500 mt-1">
                                                        ${admin.lastLogin ? `${Math.floor(Math.random() * 30)} days ago` : ''}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    ${UserStatus.renderStatusBadge(admin.status || (admin.isActive ? 'ACTIVE' : 'INACTIVE'))}
                                                    <div class="text-xs text-gray-500 mt-1">
                                                        ${admin.isActive ? 'Full access' : 'Limited access'}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div class="flex space-x-2">

                                                        <button class="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors duration-150"
                                                                data-admin-id="${admin.userId}"
                                                                data-action="delete"
                                                                title="Delete administrator">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('') : `
                                            <tr>
                                                <td colspan="5" class="px-6 py-12 whitespace-nowrap text-center text-gray-500">
                                                    <div class="flex flex-col items-center justify-center">
                                                        <i class="fas fa-user-shield text-gray-300 text-5xl mb-4"></i>
                                                        <p class="text-lg font-medium text-gray-500 mb-1">No administrators found</p>
                                                        <p class="text-sm text-gray-400">Click the "Add Administrator" button to create one</p>
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

                    // Replace loading state with administrators UI
                    adminsContainer.innerHTML = '';
                    adminsContainer.appendChild(container);

                    // Admin add button removed

                    const actionButtons = adminsContainer.querySelectorAll('button[data-admin-id]');
                    actionButtons.forEach(btn => {
                        const adminId = btn.getAttribute('data-admin-id');
                        const action = btn.getAttribute('data-action');

                        btn.addEventListener('click', () => {
                            if (action === 'toggle-status') {
                                // Toggle status is now handled by the inline onclick handler
                                // No need to call toggleAdminStatus here
                            } else if (action === 'delete') {
                                this.deleteAdmin(adminId);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Error fetching administrators:', error);
                    adminsContainer.innerHTML = `
                    <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load administrators</h3>
                            <p class="text-gray-500">${error.message}</p>
                        </div>
                    </div>
                `;
                });

            // Since we don't have a specific orders endpoint yet, we'll show a placeholder
            // In a real application, you would fetch orders from an API endpoint
            setTimeout(() => {
                const tableContainer = document.createElement('div');
                tableContainer.className = 'flex flex-col';

                tableContainer.innerHTML = `
                    <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <div class="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                                    <div class="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                                        <div class="ml-4 mt-2">
                                            <h3 class="text-lg leading-6 font-medium text-gray-900">Orders</h3>
                                        </div>
                                        <div class="ml-4 mt-2 flex-shrink-0">
                                            <button type="button" class="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                                <i class="fas fa-filter mr-2"></i> Filter Orders
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <!-- Sample order data - replace with real data in production -->
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">#ORD-12345</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center">
                                                    <div class="flex-shrink-0 h-10 w-10">
                                                        <img class="h-10 w-10 rounded-full" src="https://picsum.photos/200?random=10" alt="">
                                                    </div>
                                                    <div class="ml-4">
                                                        <div class="text-sm font-medium text-gray-900">Mohammed Ali</div>
                                                        <div class="text-sm text-gray-500">mohammed.ali@example.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">2023-04-15</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">$120.50</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div class="flex space-x-2">
                                                    <button class="text-primary-600 hover:text-primary-900">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">#ORD-12346</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="flex items-center">
                                                    <div class="flex-shrink-0 h-10 w-10">
                                                        <img class="h-10 w-10 rounded-full" src="https://picsum.photos/200?random=11" alt="">
                                                    </div>
                                                    <div class="ml-4">
                                                        <div class="text-sm font-medium text-gray-900">Sara Ahmad</div>
                                                        <div class="text-sm text-gray-500">sara.ahmad@example.com</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">2023-04-16</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-900">$85.75</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Processing</span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div class="flex space-x-2">
                                                    <button class="text-primary-600 hover:text-primary-900">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

                // Replace loading state with orders table
                ordersContainer.innerHTML = '';
                ordersContainer.appendChild(tableContainer);
            }, 1000); // Simulate loading delay
        },

        // Admin management methods
        updateUserStatus(userId, status, userType) {
            if (!userId || !status || !userType) return;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Determine the API endpoint based on user type
            let endpoint;
            if (userType === 'admin') {
                endpoint = `/api/admin/admins/${userId}/status?status=${status}`;
            } else if (userType === 'buyer' || userType === 'seller') {
                endpoint = `/api/admin/users/${userId}/update-status?status=${status}`;
            } else {
                console.error('Invalid user type:', userType);
                return;
            }

            // Show loading state
            const statusCell = document.querySelector(`#status-menu-button-${userId}`).closest('td');
            const originalContent = statusCell.innerHTML;
            statusCell.innerHTML = `
                <div class="flex justify-center items-center py-2">
                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Call API to update status
            fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to update ${userType} status`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Show success message
                    AdminToast.success(data.message || `${userType.charAt(0).toUpperCase() + userType.slice(1)} status updated successfully`);

                    // Refresh the appropriate list
                    if (userType === 'admin') {
                        this.fetchAdmins();
                    } else if (userType === 'buyer') {
                        this.fetchBuyers();
                    } else if (userType === 'seller') {
                        this.fetchSellers();
                    }
                })
                .catch(error => {
                    console.error(`Error updating ${userType} status:`, error);
                    AdminToast.error(`Failed to update ${userType} status`);

                    // Restore original content
                    statusCell.innerHTML = originalContent;
                });
        },

        toggleAdminStatus(adminId) {
            if (!adminId) return;

            // Find the admin in the list to get their current status and name
            const adminRow = document.querySelector(`button[data-admin-id="${adminId}"][data-action="toggle-status"]`).closest('tr');
            const adminName = adminRow ? adminRow.querySelector('.text-gray-900').textContent : 'this administrator';
            const isActive = adminRow ? adminRow.querySelector('.bg-green-100') !== null : false;
            const actionText = isActive ? 'deactivate' : 'activate';

            // Create a custom confirmation dialog
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'fixed z-20 inset-0 overflow-y-auto';
            confirmDialog.innerHTML = `
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                    <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                        <div>
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isActive ? 'bg-yellow-100' : 'bg-green-100'}">
                                <i class="fas ${isActive ? 'fa-ban text-yellow-600' : 'fa-check text-green-600'}"></i>
                            </div>
                            <div class="mt-3 text-center sm:mt-5">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                    ${isActive ? 'Deactivate' : 'Activate'} Administrator
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Are you sure you want to ${actionText} <span class="font-medium text-gray-900">${adminName}</span>?
                                        ${isActive ? 'They will lose access to the admin dashboard.' : 'They will gain full access to the admin dashboard.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button id="confirm-toggle" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${isActive ? 'focus:ring-yellow-500' : 'focus:ring-green-500'} sm:col-start-2 sm:text-sm">
                                Yes, ${actionText}
                            </button>
                            <button id="cancel-toggle" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            // Add event listeners to the buttons
            document.getElementById('confirm-toggle').addEventListener('click', () => {
                // Remove the dialog
                document.body.removeChild(confirmDialog);

                // Show loading overlay on the admin row
                adminRow.style.position = 'relative';
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center';
                loadingOverlay.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>';
                adminRow.appendChild(loadingOverlay);

                // Get token from localStorage
                const token = localStorage.getItem('token');

                // Call API to toggle admin status
                fetch(`/api/admin/admins/${adminId}/toggle-status`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to toggle administrator status');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Show success message
                        AdminToast.success(data.message || `Administrator ${isActive ? 'deactivated' : 'activated'} successfully`);

                        // Refresh administrators list
                        this.fetchAdmins();
                    })
                    .catch(error => {
                        console.error('Error toggling administrator status:', error);
                        AdminToast.error('Failed to update administrator status');

                        // Remove loading overlay
                        adminRow.removeChild(loadingOverlay);
                    });
            });

            document.getElementById('cancel-toggle').addEventListener('click', () => {
                // Remove the dialog
                document.body.removeChild(confirmDialog);
            });
        },

        deleteAdmin(adminId) {
            if (!adminId) return;

            // Find the admin in the list to get their name
            const adminRow = document.querySelector(`button[data-admin-id="${adminId}"][data-action="delete"]`).closest('tr');
            const adminName = adminRow ? adminRow.querySelector('.text-gray-900').textContent : 'this administrator';

            // Create a custom confirmation dialog
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'fixed z-20 inset-0 overflow-y-auto';
            confirmDialog.innerHTML = `
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                    <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                        <div>
                            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                            </div>
                            <div class="mt-3 text-center sm:mt-5">
                                <h3 class="text-lg leading-6 font-medium text-gray-900">
                                    Delete Administrator
                                </h3>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-500">
                                        Are you sure you want to delete <span class="font-medium text-gray-900">${adminName}</span>?
                                        This action cannot be undone and all associated data will be permanently removed.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button id="confirm-delete" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm">
                                Yes, delete
                            </button>
                            <button id="cancel-delete" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmDialog);

            // Add event listeners to the buttons
            document.getElementById('confirm-delete').addEventListener('click', () => {
                // Remove the dialog
                document.body.removeChild(confirmDialog);

                // Show loading overlay on the admin row
                adminRow.style.position = 'relative';
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center';
                loadingOverlay.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>';
                adminRow.appendChild(loadingOverlay);

                // Get token from localStorage
                const token = localStorage.getItem('token');

                // Call API to delete admin
                fetch(`/api/admin/admins/${adminId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : '',
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to delete administrator');
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Show success message with admin name
                        AdminToast.success(data.message || `Administrator ${adminName} deleted successfully`);

                        // Add a fade-out effect to the row before removing it
                        adminRow.style.transition = 'opacity 0.5s ease-out';
                        adminRow.style.opacity = '0';

                        // Refresh administrators list after a short delay
                        setTimeout(() => {
                            this.fetchAdmins();
                        }, 500);
                    })
                    .catch(error => {
                        console.error('Error deleting administrator:', error);
                        AdminToast.error('Failed to delete administrator');

                        // Remove loading overlay
                        adminRow.removeChild(loadingOverlay);
                    });
            });

            document.getElementById('cancel-delete').addEventListener('click', () => {
                // Remove the dialog
                document.body.removeChild(confirmDialog);
            });
        },

        openAddAdminModal() {
            this.showAddAdminModal = true;

            // Reset form fields if they exist
            setTimeout(() => {
                const usernameField = document.getElementById('admin-username');
                const fullnameField = document.getElementById('admin-fullname');
                const emailField = document.getElementById('admin-email');
                const passwordField = document.getElementById('admin-password');
                const phoneField = document.getElementById('admin-phone');

                if (usernameField) usernameField.value = '';
                if (fullnameField) fullnameField.value = '';
                if (emailField) emailField.value = '';
                if (passwordField) passwordField.value = '';
                if (phoneField) phoneField.value = '';
            }, 100);
        },

        addAdmin() {
            // Get form values
            const username = document.getElementById('admin-username').value.trim();
            const fullName = document.getElementById('admin-fullname').value.trim();
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            const phone = document.getElementById('admin-phone').value.trim();

            // Enhanced validation
            const errors = [];

            if (!username) {
                errors.push('Username is required');
                document.getElementById('admin-username').classList.add('border-red-500');
            } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                errors.push('Username must contain only letters, numbers, and underscores');
                document.getElementById('admin-username').classList.add('border-red-500');
            } else {
                document.getElementById('admin-username').classList.remove('border-red-500');
            }

            if (!fullName) {
                errors.push('Full name is required');
                document.getElementById('admin-fullname').classList.add('border-red-500');
            } else {
                document.getElementById('admin-fullname').classList.remove('border-red-500');
            }

            if (!email) {
                errors.push('Email is required');
                document.getElementById('admin-email').classList.add('border-red-500');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errors.push('Please enter a valid email address');
                document.getElementById('admin-email').classList.add('border-red-500');
            } else {
                document.getElementById('admin-email').classList.remove('border-red-500');
            }

            if (!password) {
                errors.push('Password is required');
                document.getElementById('admin-password').classList.add('border-red-500');
            } else if (password.length < 8) {
                errors.push('Password must be at least 8 characters long');
                document.getElementById('admin-password').classList.add('border-red-500');
            } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
                errors.push('Password must include both letters and numbers');
                document.getElementById('admin-password').classList.add('border-red-500');
            } else {
                document.getElementById('admin-password').classList.remove('border-red-500');
            }

            // Show validation errors if any
            if (errors.length > 0) {
                AdminToast.error(errors[0]);
                return;
            }

            // Disable form and show loading state
            const addButton = document.querySelector('button[type="button"][class*="bg-primary-600"]');
            const cancelButton = document.querySelector('button[type="button"][class*="bg-white"]');

            if (addButton) {
                addButton.disabled = true;
                addButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Adding...';
            }

            if (cancelButton) {
                cancelButton.disabled = true;
            }

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Create admin data
            const adminData = {
                username: username,
                fullName: fullName,
                email: email,
                password: password,
                phone: phone,
                region: 'Admin Region', // Default value
                agricultureType: 'Administration', // Default value
                bio: 'System administrator' // Default value
            };

            // Call API to create admin
            fetch('/api/admin/create-admin', {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminData)
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.message || 'Failed to create administrator');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    // Show success message
                    AdminToast.success(data.message || 'Administrator created successfully');

                    // Close modal
                    this.showAddAdminModal = false;

                    // Refresh administrators list
                    this.fetchAdmins();
                })
                .catch(error => {
                    console.error('Error creating administrator:', error);
                    AdminToast.error(error.message || 'Failed to create administrator');

                    // Re-enable form
                    if (addButton) {
                        addButton.disabled = false;
                        addButton.innerHTML = '<i class="fas fa-user-plus mr-2"></i> Add Administrator';
                    }

                    if (cancelButton) {
                        cancelButton.disabled = false;
                    }
                });
        },

        // Modal methods
        openAddSellerModal() {
            this.showAddSellerModal = true;

            // Reset form fields if they exist
            setTimeout(() => {
                const nameField = document.getElementById('seller-name');
                const ownerField = document.getElementById('seller-owner');
                const emailField = document.getElementById('seller-email');
                const phoneField = document.getElementById('seller-phone');

                if (nameField) nameField.value = '';
                if (ownerField) ownerField.value = '';
                if (emailField) emailField.value = '';
                if (phoneField) phoneField.value = '';
            }, 100);
        },

        openViewSellerModal(sellerId) {
            // In a real application, you would fetch seller details
            // Example: fetch(`/api/admin/sellers/${sellerId}`)
            //   .then(response => response.json())
            //   .then(data => { /* Update UI with data */ });
            this.showViewSellerModal = true;
        },

        addSeller() {
            // Get form data
            const businessName = document.getElementById('seller-name').value;
            const ownerName = document.getElementById('seller-owner').value;
            const email = document.getElementById('seller-email').value;
            const phone = document.getElementById('seller-phone').value;
            const location = document.getElementById('seller-location').value;
            const status = document.getElementById('seller-status').value;

            // Validate form data
            if (!businessName || !ownerName || !email) {
                alert('Please fill in all required fields');
                return;
            }

            // In a real application, you would send this data to your API
            console.log('Adding seller:', { businessName, ownerName, email, phone, location, status });
            // Example: fetch('/api/admin/sellers', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ businessName, ownerName, email, phone, location, status })
            // })

            // Close modal and show success message
            this.showAddSellerModal = false;
            this.showSuccessToast('Seller added successfully');

            // Refresh sellers list
            this.fetchSellers();
        },

        editSeller() {
            // Implement edit seller logic
            this.showViewSellerModal = false;
            // Show edit form
        },

        // Product management methods
        fetchProducts() {
            console.log('Fetching products...');

            // Get the products container
            const productsContainer = document.querySelector('[x-show="activeTab === \'products\'"]');
            if (!productsContainer) {
                console.error('Products container not found');
                return;
            }

            // Show loading state
            productsContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Fetch products from API
            fetch('/api/admin/products', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch products');
                    }
                    return response.json();
                })
                .then(products => {
                    // Create products UI
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // Add header with search and add button
                    const header = document.createElement('div');
                    header.className = 'mb-6';
                    header.innerHTML = `
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-900">Products</h2>
                            <p class="text-sm text-gray-500 mt-1">Manage products in the marketplace</p>
                        </div>
                        <button id="add-product-btn" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150">
                            <i class="fas fa-plus mr-2"></i> Add Product
                        </button>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                        <div class="relative flex-grow">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-search text-gray-400"></i>
                            </div>
                            <input id="product-search" type="text" class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Search products...">
                        </div>
                        <div class="flex space-x-2">
                            <select id="product-filter" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                                <option value="all">All Products</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                    </div>
                `;
                    container.appendChild(header);

                    // Create products table
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
                    tableContainer.innerHTML = `
                    <div class="overflow-x-auto">
                        <div class="py-2 align-middle inline-block min-w-full px-4">
                            <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        ${products.length > 0 ? products.map((product, index) => `
                                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150 ease-in-out">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="flex items-center">
                                                        <div class="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                                                            ${product.image ?
                        `<img class="h-12 w-12 object-cover" src="${product.image}" alt="${product.name}">` :
                        `<div class="h-12 w-12 flex items-center justify-center bg-blue-50 text-blue-600">
                                                                    <i class="fas fa-box text-xl"></i>
                                                                </div>`
                    }
                                                        </div>
                                                        <div class="ml-4">
                                                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                                                            <div class="text-sm text-gray-500">${product.seller ? product.seller.name : 'Unknown seller'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-900">${product.category ? product.category.name : 'Uncategorized'}</div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-900">${product.price ? `$${product.price.toFixed(2)}` : 'N/A'}</div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                                        ${product.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div class="flex space-x-2">
                                                        <button class="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded-md transition-colors duration-150"
                                                                data-product-id="${product.id}"
                                                                data-action="view"
                                                                title="View product details">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="text-yellow-600 hover:text-yellow-900 bg-yellow-50 p-1.5 rounded-md transition-colors duration-150"
                                                                data-product-id="${product.id}"
                                                                data-action="edit"
                                                                title="Edit product">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded-md transition-colors duration-150"
                                                                data-product-id="${product.id}"
                                                                data-action="delete"
                                                                title="Delete product">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `).join('') : `
                                            <tr>
                                                <td colspan="5" class="px-6 py-12 whitespace-nowrap text-center text-gray-500">
                                                    <div class="flex flex-col items-center justify-center">
                                                        <i class="fas fa-box text-gray-300 text-5xl mb-4"></i>
                                                        <p class="text-lg font-medium text-gray-500 mb-1">No products found</p>
                                                        <p class="text-sm text-gray-400">Click the "Add Product" button to create one</p>
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

                    // Replace loading state with products UI
                    productsContainer.innerHTML = '';
                    productsContainer.appendChild(container);

                    // Add event listeners to buttons
                    const actionButtons = productsContainer.querySelectorAll('button[data-product-id]');
                    actionButtons.forEach(btn => {
                        const productId = btn.getAttribute('data-product-id');
                        const action = btn.getAttribute('data-action');

                        btn.addEventListener('click', () => {
                            if (action === 'view') {
                                this.viewProduct(productId);
                            } else if (action === 'edit') {
                                this.editProduct(productId);
                            } else if (action === 'delete') {
                                this.confirmDeleteProduct(productId);
                            }
                        });
                    });

                    // Add event listener to search input
                    const searchInput = document.getElementById('product-search');
                    if (searchInput) {
                        searchInput.addEventListener('input', (e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            const rows = productsContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                const name = row.querySelector('.text-gray-900')?.textContent.toLowerCase() || '';
                                const category = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                                const seller = row.querySelector('.text-gray-500')?.textContent.toLowerCase() || '';

                                if (name.includes(searchTerm) || category.includes(searchTerm) || seller.includes(searchTerm)) {
                                    row.style.display = '';
                                } else {
                                    row.style.display = 'none';
                                }
                            });
                        });
                    }

                    // Add event listener to filter dropdown
                    const filterSelect = document.getElementById('product-filter');
                    if (filterSelect) {
                        filterSelect.addEventListener('change', (e) => {
                            const filterValue = e.target.value;
                            const rows = productsContainer.querySelectorAll('tbody tr');

                            rows.forEach(row => {
                                if (filterValue === 'all') {
                                    row.style.display = '';
                                } else if (filterValue === 'active') {
                                    const isActive = row.querySelector('.bg-green-100') !== null;
                                    row.style.display = isActive ? '' : 'none';
                                } else if (filterValue === 'inactive') {
                                    const isActive = row.querySelector('.bg-green-100') !== null;
                                    row.style.display = !isActive ? '' : 'none';
                                }
                            });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching products:', error);
                    productsContainer.innerHTML = `
                    <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
                            <p class="text-gray-500">${error.message}</p>
                            <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" onclick="adminApp.fetchProducts()">
                                <i class="fas fa-sync-alt mr-2"></i> Try Again
                            </button>
                        </div>
                    </div>
                `;
                });
        },

        viewProduct(productId) {
            console.log('View product:', productId);
            // Implement view product functionality
        },

        editProduct(productId) {
            console.log('Edit product:', productId);
            // Implement edit product functionality
        },

        confirmDeleteProduct(productId) {
            console.log('Delete product:', productId);
            if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
                this.deleteProduct(productId);
            }
        },

        deleteProduct(productId) {
            console.log('Deleting product:', productId);
            // Implement delete product functionality

            // Get token from localStorage
            const token = localStorage.getItem('token');

            // Call API to delete product
            fetch(`/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete product');
                    }
                    return response.json();
                })
                .then(data => {
                    // Show success message
                    this.showSuccessToast('Product deleted successfully');

                    // Refresh products list
                    this.fetchProducts();
                })
                .catch(error => {
                    console.error('Error deleting product:', error);
                    this.showErrorToast('Failed to delete product: ' + error.message);
                });
        },

        // Category management methods
        addCategory(categoryData) {
            if (window.categoriesManager) {
                window.categoriesManager.addCategory(categoryData);
            } else {
                console.error('CategoriesManager not found');
                this.showErrorToast('Failed to add category: CategoriesManager not found');
            }
        },

        updateCategory(categoryId, categoryData) {
            if (window.categoriesManager) {
                window.categoriesManager.updateCategory(categoryId, categoryData);
            } else {
                console.error('CategoriesManager not found');
                this.showErrorToast('Failed to update category: CategoriesManager not found');
            }
        },

        // Toast notifications
        showSuccessToast(message) {
            AdminToast.success(message);
        },

        showErrorToast(message) {
            AdminToast.error(message);
        },

        showWarningToast(message) {
            AdminToast.warning(message);
        },

        showInfoToast(message) {
            AdminToast.info(message);
        }
    };
}

// Make the admin app available globally
document.addEventListener('DOMContentLoaded', function() {
    // Only set adminApp if it's not already defined
    if (typeof window.adminApp !== 'function') {
        window.adminApp = createAdminApp;
    }

    // Initialize the admin app if it's not already initialized
    if (typeof window.adminApp === 'function' && !window.adminAppInstance) {
        window.adminAppInstance = window.adminApp();
    }
});