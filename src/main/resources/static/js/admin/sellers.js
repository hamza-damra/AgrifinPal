// seller.js

const adminApp = {
    // State
    activeTab: 'sellers',
    showAddSellerModal: false,
    showViewSellerModal: false,
    mobileMenuOpen: false,

    // Switch tabs and load data
    setActiveTab(tab) {
        this.activeTab = tab;
        this.mobileMenuOpen = false;

        switch (tab) {
            case 'dashboard':
                this.fetchDashboardData?.();
                break;
            case 'sellers':
                this.fetchSellers();
                break;
            case 'products':
                this.fetchProducts?.();
                break;
        }
    },

    // Fetch list of sellers
    fetchSellers() {
        console.log('Fetching sellers...');

        const sellersContainer = document.querySelector('[x-show="activeTab === \'sellers\'"]');
        if (!sellersContainer) {
            console.error('Sellers container not found');
            return;
        }

        // Loading state
        sellersContainer.innerHTML = `
            <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        `;

        const token = localStorage.getItem('token');
        fetch('/api/admin/sellers', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch sellers');
                return response.json();
            })
            .then(sellers => {
                this.renderSellersUI(sellers, sellersContainer);
            })
            .catch(error => {
                console.error('Error fetching sellers:', error);
                sellersContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:mx-8">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load sellers</h3>
                        <p class="text-gray-500">${error.message}</p>
                        <button
                            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                            onclick="adminApp.fetchSellers()"
                        >
                            <i class="fas fa-sync-alt mr-2"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
            });
    },

    // Render sellers table + header + search/filter
    renderSellersUI(sellers, container) {
        container.innerHTML = '';

        // Header without add button
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
                    <input
                        id="seller-search"
                        type="text"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Search sellers..."
                    >
                </div>
                <div class="flex space-x-2">
                    <select
                        id="seller-filter"
                        class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(header);

        // Table
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'bg-white shadow rounded-lg overflow-x-auto';
        tableWrapper.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase">Seller</th>
                        <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase">Contact</th>
                        <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-6 py-3 text-left font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody id="sellers-body" class="bg-white divide-y divide-gray-200">
                    ${sellers.map(seller => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="font-semibold text-gray-900">${seller.fullName || seller.username}</div>
                                <div class="text-gray-500 text-xs">@${seller.username}</div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-gray-900">${seller.email}</div>
                                <div class="text-gray-500 text-xs">${seller.phone || 'No phone'}</div>
                            </td>
                            <td class="px-6 py-4">
                                ${UserStatus.renderStatusBadge(seller.status || (seller.isActive ? 'ACTIVE' : 'INACTIVE'))}
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex space-x-2">
                                    <button
                                        class="text-blue-600 hover:text-blue-900"
                                        onclick="adminApp.openViewSellerModal(${seller.userId})"
                                    >
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button
                                        class="text-red-600 hover:text-red-900"
                                        onclick="adminApp.deleteSeller(${seller.userId})"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        container.appendChild(tableWrapper);

        // Wire up Add, Search & Filter
        document.getElementById('add-seller-btn')
            .addEventListener('click', () => this.openAddSellerModal());
        this.setupSellerSearchFilter(sellers);
    },

    // Live-search + status filter
    setupSellerSearchFilter(sellers) {
        const searchInput = document.getElementById('seller-search');
        const filterSelect = document.getElementById('seller-filter');
        const body = document.getElementById('sellers-body');

        const renderRows = (list) => {
            body.innerHTML = list.map(s => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-semibold text-gray-900">${s.fullName || s.username}</div>
                        <div class="text-gray-500 text-xs">@${s.username}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-gray-900">${s.email}</div>
                        <div class="text-gray-500 text-xs">${s.phone || 'No phone'}</div>
                    </td>
                    <td class="px-6 py-4">
                        ${UserStatus.renderStatusBadge(s.status || (s.isActive ? 'ACTIVE' : 'INACTIVE'))}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex space-x-2">
                            <button class="text-blue-600 hover:text-blue-900" onclick="adminApp.openViewSellerModal(${s.userId})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-900" onclick="adminApp.deleteSeller(${s.userId})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        };

        const applyFilter = () => {
            const term = searchInput.value.toLowerCase();
            const status = filterSelect.value;
            const filtered = sellers.filter(s => {
                const matchesTerm = (s.fullName || s.username || s.email || '')
                    .toLowerCase().includes(term);
                const matchesStatus = status === 'all'
                    || (status === 'active' && s.isActive)
                    || (status === 'inactive' && !s.isActive);
                return matchesTerm && matchesStatus;
            });
            renderRows(filtered);
        };

        searchInput.addEventListener('input', applyFilter);
        filterSelect.addEventListener('change', applyFilter);
    },

    // Modal open/reset
    openAddSellerModal() {
        this.showAddSellerModal = true;
        setTimeout(() => {
            ['seller-name','seller-owner','seller-email','seller-phone'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }, 100);
    },

    openViewSellerModal(sellerId) {
        this.showViewSellerModal = true;
        console.log('Viewing seller:', sellerId);
        // TODO: fetch + display full details
    },

    // Delete with confirmation + refresh
    deleteSeller(sellerId) {
        if (!confirm('Are you sure you want to delete this seller?')) return;
        const token = localStorage.getItem('token');
        fetch(`/api/admin/sellers/${sellerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to delete seller');
                return res.json();
            })
            .then(data => {
                this.showSuccessToast(data.message || 'Seller deleted successfully');
                this.fetchSellers();
            })
            .catch(err => {
                console.error(err);
                this.showErrorToast('Failed to delete seller');
            });
    },

    // Toast helpers
    showSuccessToast(msg) { AdminToast.success(msg); },
    showErrorToast(msg)   { AdminToast.error(msg); },
    showWarningToast(msg) { AdminToast.warning(msg); },
    showInfoToast(msg)    { AdminToast.info(msg); }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.adminApp === 'undefined') {
        window.adminApp = adminApp;
    }
    adminApp.setActiveTab('sellers');
});
