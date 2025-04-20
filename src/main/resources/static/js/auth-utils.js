/**
 * Authentication Utilities for AgriFinPal
 * This file contains utility functions for handling authentication across the application
 */

/**
 * Check if the user is authenticated and redirect to login if not
 * @param {boolean} redirectOnFailure - Whether to redirect to login page if not authenticated
 * @param {string} redirectUrl - URL to redirect to after login (defaults to current page)
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
async function validateToken(redirectOnFailure = true, redirectUrl = window.location.href) {
    try {
        console.log('Validating authentication token...');

        // Get token from localStorage
        const token = localStorage.getItem('token');

        // If no token, handle unauthenticated state
        if (!token) {
            console.log('No token found in localStorage');
            if (redirectOnFailure) {
                redirectToLogin(redirectUrl);
            }
            return false;
        }

        console.log('Token found, validating with server...');

        // Make request to validate token
        const response = await fetch('/api/auth/check-auth', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include' // Include cookies in the request
        });

        // Parse response
        const data = await response.json();
        console.log('Token validation response:', data);

        // If not authenticated, handle unauthenticated state
        if (!response.ok || !data.authenticated) {
            console.log('Token validation failed:', data);
            // Clear invalid token
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Clear cookie

            if (redirectOnFailure) {
                redirectToLogin(redirectUrl);
            }
            return false;
        }

        console.log('Token validated successfully');
        return true;
    } catch (error) {
        console.error('Error validating token:', error);

        // On network error, don't automatically redirect or remove token
        // This prevents logout on temporary network issues
        if (error.name !== 'TypeError' && redirectOnFailure) {
            localStorage.removeItem('token');
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; // Clear cookie
            redirectToLogin(redirectUrl);
        }

        return false;
    }
}

/**
 * Redirect to login page with a redirect URL
 * @param {string} redirectUrl - URL to redirect to after login
 */
function redirectToLogin(redirectUrl = window.location.href) {
    window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
}

/**
 * Make an authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {boolean} validateTokenFirst - Whether to validate token before making request
 * @param {boolean} redirectOnFailure - Whether to redirect to login if token validation fails
 * @returns {Promise<Object>} - Response data
 */
async function authenticatedFetch(url, options = {}, validateTokenFirst = true, redirectOnFailure = true) {
    try {
        // Validate token first if requested
        if (validateTokenFirst) {
            const isValid = await validateToken(redirectOnFailure);
            if (!isValid) {
                throw new Error('Token validation failed');
            }
        }

        // Get token
        const token = localStorage.getItem('token');

        // Create a new Headers object for better validation
        const headers = new Headers();

        // Add Authorization header
        headers.append('Authorization', `Bearer ${token}`);

        // Add headers from options first, so they take precedence
        let hasContentType = false;
        if (options.headers) {
            Object.keys(options.headers).forEach(key => {
                try {
                    // Skip null or undefined values
                    if (options.headers[key] != null) {
                        // Check if this is a Content-Type header
                        if (key.toLowerCase() === 'content-type') {
                            hasContentType = true;
                        }

                        // Validate header name
                        if (/^[\w-]+$/.test(key)) {
                            headers.append(key, options.headers[key]);
                        } else {
                            console.warn(`Skipping invalid header name: ${key}`);
                        }
                    }
                } catch (headerError) {
                    console.warn(`Error adding header ${key}:`, headerError);
                }
            });
        }

        // Add Content-Type header if not already set and not a FormData object
        if (!hasContentType && !(options.body instanceof FormData)) {
            headers.append('Content-Type', 'application/json');
        }

        // Log the request details for debugging
        console.log(`Making authenticated request to ${url}:`, {
            method: options.method || 'GET',
            headers: Array.from(headers.entries()),
            bodyType: options.body ? (typeof options.body === 'string' ? 'JSON string' : 'Object') : 'None'
        });

        // Make request with validated headers
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized responses
        if (response.status === 401) {
            localStorage.removeItem('token');
            if (redirectOnFailure) {
                redirectToLogin();
            }
            throw new Error('Unauthorized');
        }

        return response;
    } catch (error) {
        console.error(`Error making authenticated request to ${url}:`, error);

        // Add more detailed error information
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Network error details:', {
                url: url,
                method: options.method || 'GET',
                errorName: error.name,
                errorMessage: error.message
            });
        }

        // Rethrow for caller to handle
        throw error;
    }
}

/**
 * Check if user is authenticated (without redirecting)
 * @returns {boolean} - Whether user has a token (doesn't validate it)
 */
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

/**
 * Check if the current user has a specific role
 * @param {string} role - The role to check for (e.g., 'ROLE_ADMIN', 'ROLE_SELLER')
 * @returns {boolean} - Whether the user has the specified role
 */
function hasRole(role) {
    const userRoles = getUserRoles();
    return userRoles.includes(role);
}

/**
 * Check if the current user has any of the specified roles
 * @param {...string} roles - The roles to check for
 * @returns {boolean} - Whether the user has any of the specified roles
 */
function hasAnyRole(...roles) {
    const userRoles = getUserRoles();
    return roles.some(role => userRoles.includes(role));
}

/**
 * Get the current user's roles from localStorage
 * @returns {Array<string>} - Array of role names
 */
function getUserRoles() {
    try {
        const rolesJson = localStorage.getItem('userRoles');
        return rolesJson ? JSON.parse(rolesJson) : [];
    } catch (error) {
        console.error('Error parsing user roles:', error);
        return [];
    }
}

/**
 * Update UI elements based on authentication state and user roles
 * Shows/hides elements with data-auth-required, data-auth-anonymous, and data-role attributes
 */
function updateAuthUI() {
    const isAuthenticated = isLoggedIn();

    // Show elements that require authentication
    document.querySelectorAll('[data-auth-required]').forEach(element => {
        element.style.display = isAuthenticated ? '' : 'none';
    });

    // Show elements for anonymous users
    document.querySelectorAll('[data-auth-anonymous]').forEach(element => {
        element.style.display = isAuthenticated ? 'none' : '';
    });

    // Handle role-based elements
    if (isAuthenticated) {
        // Show elements for specific roles
        document.querySelectorAll('[data-role]').forEach(element => {
            const requiredRole = element.getAttribute('data-role');
            if (requiredRole) {
                // Check if user has the required role
                element.style.display = hasRole(requiredRole) ? '' : 'none';
            }
        });

        // Show elements for users with any of the specified roles
        document.querySelectorAll('[data-any-role]').forEach(element => {
            const requiredRoles = element.getAttribute('data-any-role').split(',');
            if (requiredRoles.length > 0) {
                // Check if user has any of the required roles
                element.style.display = hasAnyRole(...requiredRoles) ? '' : 'none';
            }
        });
    } else {
        // Hide all role-based elements if not authenticated
        document.querySelectorAll('[data-role], [data-any-role]').forEach(element => {
            element.style.display = 'none';
        });
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});
