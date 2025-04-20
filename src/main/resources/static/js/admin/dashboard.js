
const adminApp = {
    // State
    showAddSellerModal: false,

    // ==================== Dashboard ====================
    fetchDashboardData() {
        console.log('Fetching dashboard data...');

        const token = localStorage.getItem('token');

        fetch('/api/admin/dashboard-stats', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
                return response.json();
            })
            .then(stats => {
                this.updateDashboardCards(stats);
            })
            .catch(error => {
                console.error('Error fetching dashboard statistics:', error);
                if (typeof AdminToast !== 'undefined') {
                    AdminToast.error('Failed to load dashboard statistics');
                }
            });
    },

    updateDashboardCards(stats) {
        const totalUsersElement = document.querySelector('[data-stat="total-users"]');
        const userGrowthElement = document.querySelector('[data-stat="user-growth"]');
        if (totalUsersElement) totalUsersElement.textContent = stats.totalUsers.toLocaleString();
        if (userGrowthElement) userGrowthElement.textContent = `${stats.userGrowth}%`;

        const activeSellersElement = document.querySelector('[data-stat="active-sellers"]');
        const sellerGrowthElement = document.querySelector('[data-stat="seller-growth"]');
        if (activeSellersElement) activeSellersElement.textContent = stats.activeSellers.toLocaleString();
        if (sellerGrowthElement) sellerGrowthElement.textContent = `${stats.sellerGrowth}%`;

        const totalProductsElement = document.querySelector('[data-stat="total-products"]');
        const productGrowthElement = document.querySelector('[data-stat="product-growth"]');
        if (totalProductsElement) totalProductsElement.textContent = stats.totalProducts.toLocaleString();
        if (productGrowthElement) productGrowthElement.textContent = `${stats.productGrowth}%`;

        const monthlyOrdersElement = document.querySelector('[data-stat="monthly-orders"]');
        const orderGrowthElement = document.querySelector('[data-stat="order-growth"]');
        if (monthlyOrdersElement) monthlyOrdersElement.textContent = stats.monthlyOrders.toLocaleString();
        if (orderGrowthElement) orderGrowthElement.textContent = `${stats.orderGrowth}%`;
    },

    // ==================== UI Events ====================
    setupEventListeners() {
        const addSellerBtns = document.querySelectorAll('button');
        addSellerBtns.forEach(btn => {
            if (btn.textContent.includes('Add Seller')) {
                btn.addEventListener('click', () => this.openAddSellerModal());
            }
        });

        // Add more listeners as needed
    },

    openAddSellerModal() {
        this.showAddSellerModal = true;

        setTimeout(() => {
            ['seller-name', 'seller-owner', 'seller-email', 'seller-phone'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }, 100);
    },

    // ==================== Initialization ====================
    init(activeTab) {
        this.setupEventListeners();

        switch (activeTab) {
            case 'dashboard':
                this.fetchDashboardData();
                break;
            case 'buyers':
                this.fetchBuyers?.(); // If defined elsewhere
                break;
            case 'sellers':
                this.fetchSellers?.(); // If defined elsewhere
                break;
            case 'admins':
                this.fetchAdmins?.(); // If defined elsewhere
                break;
        }
    }
};

// Example usage on page load
document.addEventListener('DOMContentLoaded', () => {
    const activeTab = 'dashboard'; // ← أو get it from state/UI
    adminApp.init(activeTab);
});
