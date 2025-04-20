/**
 * Handles the logout functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Find all logout links
    const logoutLinks = document.querySelectorAll('a[href="/api/auth/logout"]');

    // Add click event listener to each logout link
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Prevent the default link behavior
            event.preventDefault();

            // Call the logout function
            logout();
        });
    });
});

/**
 * Performs the logout operation
 */
function logout() {
    // Check if user is a buyer (has ROLE_USER) and is on the marketplace page
    const userRoles = localStorage.getItem('userRoles');
    const isBuyer = userRoles && userRoles.includes('ROLE_USER');
    const isOnMarketplace = window.location.pathname.includes('/marketplace');

    // Always redirect buyers to home page when logging out from marketplace
    // For other cases, use the default home page redirect
    const redirectTo = '/';

    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');
    localStorage.removeItem('userStoreId');
    localStorage.removeItem('userStoreName');

    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Call the logout API endpoint
    fetch('/api/auth/logout', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            // Redirect to the appropriate page
            window.location.href = redirectTo;
        } else {
            console.error('Logout failed:', response.statusText);
            // Redirect anyway
            window.location.href = redirectTo;
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        // Redirect even if there's an error
        window.location.href = redirectTo;
    });
}
