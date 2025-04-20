/**
 * Admin Login JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user was redirected with error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        const errorType = urlParams.get('error');
        if (errorType === 'unauthorized') {
            showMessage('error-box', 'You need admin privileges to access that page.', 0);
        } else if (errorType === 'inactive') {
            showMessage('inactive-box', 'Your account is inactive. Please contact support.', 0);
        } else if (errorType === 'suspended') {
            showMessage('suspended-box', 'Your account is suspended. Please contact support.', 0);
        } else if (errorType === 'banned') {
            showMessage('banned-box', 'Your account is banned. Please contact support.', 0);
        } else {
            showMessage('error-box', 'Invalid admin credentials', 0);
        }
    }

    // Check for logout parameter
    if (urlParams.has('logout') && urlParams.get('logout') === 'true') {
        // Clear token on logout
        localStorage.removeItem('token');
        showMessage('success-box', 'You have been successfully logged out.', 5000);
    }

    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showMessage('error-box', 'Please enter both username and password.', 0);
                return;
            }

            // Disable submit button
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }

            try {
                // For development/testing - check if server is running
                let serverRunning = false;
                try {
                    const pingResponse = await fetch('/api/auth/check-auth', { method: 'GET' });
                    serverRunning = true;
                } catch (pingError) {
                    console.warn('Server connection test failed:', pingError);
                }

                // If server is not running and username is 'admin', use mock response for testing
                if (!serverRunning && username === 'admin' && password === 'admin') {
                    console.warn('Using mock response for testing - REMOVE IN PRODUCTION');

                    // Simulate successful response
                    const mockResponse = {
                        success: true,
                        userId: 1,
                        username: 'admin',
                        email: 'admin@example.com',
                        roles: ['ROLE_ADMIN'],
                        token: 'mock-jwt-token-for-testing-only',
                        message: 'Login successful (MOCK)'
                    };

                    // Store token in localStorage
                    localStorage.setItem('token', mockResponse.token);
                    localStorage.setItem('userRoles', JSON.stringify(mockResponse.roles));
                    localStorage.setItem('userId', mockResponse.userId);

                    // Show success message
                    showMessage('success-box', 'Login successful! Redirecting to admin dashboard... (MOCK MODE)', 0);

                    // Redirect to admin dashboard
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard?token=' + mockResponse.token;
                    }, 1500);

                    return;
                }

                // Normal login flow
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Check if user has ADMIN role
                    const hasAdminRole = data.roles &&
                                        Array.isArray(data.roles) &&
                                        data.roles.includes('ROLE_ADMIN');

                    if (!hasAdminRole) {
                        showMessage('error-box', 'You do not have admin privileges.', 0);

                        // Re-enable submit button
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = 'Login as Admin';
                        }
                        return;
                    }

                    // Store token in localStorage
                    localStorage.setItem('token', data.token);

                    // Store user roles in localStorage
                    if (data.roles) {
                        localStorage.setItem('userRoles', JSON.stringify(data.roles));
                    }

                    // Store user ID in localStorage if available
                    if (data.userId) {
                        localStorage.setItem('userId', data.userId);
                    }

                    // Set token cookie for added security
                    document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;

                    // Show success message
                    showMessage('success-box', 'Login successful! Redirecting to admin dashboard...', 0);

                    // Redirect to admin dashboard with token in URL
                    setTimeout(() => {
                        const dashboardUrl = new URL('/admin/dashboard', window.location.origin);
                        dashboardUrl.searchParams.append('token', data.token);
                        window.location.href = dashboardUrl.toString();
                    }, 1000);
                } else {
                    // Show appropriate error message based on the response
                    const message = data.message || 'Invalid username or password';

                    if (message.toLowerCase().includes('inactive')) {
                        showMessage('inactive-box', message, 0);
                    } else if (message.toLowerCase().includes('suspended')) {
                        showMessage('suspended-box', message, 0);
                    } else if (message.toLowerCase().includes('banned')) {
                        showMessage('banned-box', message, 0);
                    } else {
                        showMessage('error-box', message, 0);
                    }

                    // Re-enable submit button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Login as Admin';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('error-box', 'An error occurred during login. Please try again.', 0);

                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login as Admin';
                }
            }
        });
    }
});
