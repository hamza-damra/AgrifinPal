document.addEventListener('DOMContentLoaded', function() {
    // Check if user was redirected from registration
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('registered') && urlParams.get('registered') === 'true') {
        // Check if it's a seller registration
        if (urlParams.has('seller') && urlParams.get('seller') === 'true') {
            showMessage('seller-success-box', null, 5000);
        } else {
            showMessage('success-box', null, 5000);
        }
    }

    // Check for error parameter
    if (urlParams.has('error')) {
        const errorType = urlParams.get('error');
        if (errorType === 'unauthorized') {
            showMessage('error-box', 'You need admin privileges to access that page.', 0);
        } else {
            showMessage('error-box', null, 0);
        }
    }

    // Check for custom message parameter
    if (urlParams.has('message')) {
        const message = urlParams.get('message');
        showMessage('error-box', message, 0);
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

                    // Check if there's a redirect parameter
                    const redirectUrl = urlParams.get('redirect');
                    if (redirectUrl) {
                        // Redirect to the specified URL with token
                        window.location.href = '/' + redirectUrl + '?token=' + data.token;
                    } else {
                        // Redirect to dashboard with token in URL
                        const dashboardUrl = new URL('/dashboard', window.location.origin);
                        dashboardUrl.searchParams.append('token', data.token);
                        window.location.href = dashboardUrl.toString();
                    }
                } else {
                    // Show error message
                    showMessage('error-box', data.message || 'Invalid username or password', 0);

                    // Re-enable submit button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Login';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('error-box', 'An error occurred during login. Please try again.', 0);

                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
    }
});
