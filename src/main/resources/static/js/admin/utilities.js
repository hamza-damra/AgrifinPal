// adminApp.js

const adminApp = {
    // UI state
    activeTab: 'dashboard',
    mobileMenuOpen: false,
    showUsersMenu: false,
    showContentMenu: false,
    showSettingsMenu: false,
    showNotifications: false,

    // Switch tabs and load data
    setActiveTab(tab) {
        this.activeTab = tab;
        this.mobileMenuOpen = false;

        switch (tab) {
            case 'dashboard':
                this.fetchDashboardData();
                break;
            case 'buyers':
                this.fetchBuyers();
                break;
            case 'sellers':
                this.fetchSellers();
                break;
            case 'admins':
                this.fetchAdmins();
                break;
            case 'categories':
                this.fetchCategories();
                break;
            case 'products':
                this.fetchProducts();
                break;
            case 'orders':
                this.fetchOrders();
                break;
            // add more as needed...
        }
    },

    // Human‑readable tab title
    getActiveTabTitle() {
        const titles = {
            'dashboard': 'Dashboard',
            'buyers': 'Buyers Management',
            'sellers': 'Sellers Management',
            'admins': 'Administrators',
            'products': 'Products',
            'categories': 'Product Categories',
            'orders': 'Orders',
        };
        return titles[this.activeTab] || 'Dashboard';
    },

    // Toggle side menus / notifications
    toggleUsersMenu() { this.showUsersMenu = !this.showUsersMenu; },
    toggleContentMenu() { this.showContentMenu = !this.showContentMenu; },
    toggleSettingsMenu() { this.showSettingsMenu = !this.showSettingsMenu; },
    toggleNotifications() { this.showNotifications = !this.showNotifications; },

    // Log out
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('userRoles');
        localStorage.removeItem('userId');
        localStorage.removeItem('userStoreId');
        localStorage.removeItem('userStoreName');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/admin/login?logout=true';
    },

    // Fetch methods (stubs – replace with your implementation)
    fetchDashboardData() {
        console.log('Fetching dashboard statistics...');
        // implement as in your existing code...
    },
    fetchBuyers() {
        console.log('Fetching buyers list...');
        // implement...
    },
    fetchSellers() {
        console.log('Fetching sellers list...');
        // implement...
    },
    fetchAdmins() {
        console.log('Fetching administrators...');
        // implement...
    },
    fetchCategories() {
        console.log('Fetching categories...');
        // implement...
    },
    fetchProducts() {
        console.log('Fetching products...');
        // implement...
    },
    fetchOrders() {
        console.log('Fetching orders...');
        // implement...
    },

    /**
     * Update the status of a user (admin, buyer or seller).
     * Automatically shows spinner, calls API, handles toast and refresh.
     */
    updateUserStatus(userId, status, userType) {
        if (!userId || !status || !userType) return;

        const token = localStorage.getItem('token');
        let endpoint;

        if (userType === 'admin') {
            endpoint = `/api/admin/admins/${userId}/status?status=${status}`;
        } else if (userType === 'buyer' || userType === 'seller') {
            endpoint = `/api/admin/users/${userId}/update-status?status=${status}`;
        } else {
            console.error('Invalid user type:', userType);
            return;
        }

        // Find the status cell to insert a spinner
        const btn = document.querySelector(`#status-menu-button-${userId}`);
        const cell = btn?.closest('td');
        if (!cell) return;

        const originalHTML = cell.innerHTML;
        cell.innerHTML = `
      <div class="flex justify-center items-center py-2">
        <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    `;

        fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(`Failed to update ${userType} status`);
                return res.json();
            })
            .then(data => {
                AdminToast.success(data.message || `${userType.charAt(0).toUpperCase()+userType.slice(1)} status updated`);
                // Refresh the appropriate tab
                switch (userType) {
                    case 'admin':  this.fetchAdmins();  break;
                    case 'buyer':  this.fetchBuyers();  break;
                    case 'seller': this.fetchSellers(); break;
                }
            })
            .catch(err => {
                console.error(err);
                AdminToast.error(`Failed to update ${userType} status`);
                cell.innerHTML = originalHTML;
            });
    }
};

// Expose logout globally
if (typeof window.logout !== 'function') {
    window.logout = () => adminApp.logout();
}

// Initialize memory if needed
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.adminApp === 'undefined') {
        window.adminApp = adminApp;
    }
    // Optionally auto‑load the dashboard
    adminApp.setActiveTab('dashboard');
});
