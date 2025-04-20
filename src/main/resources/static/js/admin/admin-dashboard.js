/**
 * Admin Dashboard JavaScript
 * Functionality specific to the dashboard tab
 */

const dashboardModule = {
    /**
     * Initialize the dashboard module
     */
    init() {
        console.log('Dashboard module initialized');
    },

    /**
     * Update dashboard statistics cards
     * @param {Object} stats - The statistics data
     */
    updateDashboardStats(stats) {
        // This functionality is now handled in the main adminApp
        console.log('Dashboard stats updated');
    }
};

// Initialize the dashboard module when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dashboardModule.init();
});
