document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registration-form');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    // Real-time password validation
    confirmPassword.addEventListener('input', function() {
        if (this.value && password.value !== this.value) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });

    password.addEventListener('input', function() {
        if (confirmPassword.value && this.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission

        // Clear any previous error messages
        hideMessage('error-message');

        // Validate passwords match
        if (password.value !== confirmPassword.value) {
            showMessage('error-message', 'Passwords do not match', 0);
            confirmPassword.focus();
            return false;
        }

        // Form is valid, prepare data for submission
        disableButton('submit-btn', 'Creating your account...');

        // Get form data
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: password.value,
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            region: document.getElementById('region').value,
            agricultureType: document.getElementById('agricultureType').value,
            bio: document.getElementById('bio').value || null
        };

        // Check if registering as a seller
        const registerAsSeller = document.getElementById('register-as-seller').checked;
        if (registerAsSeller) {
            formData.roles = ['seller'];
        }

        try {
            // Get CSRF token
            const csrf = getCsrfToken();

            // Submit data as JSON
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    [csrf.header]: csrf.value
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Registration successful
                const data = await response.json();
                if (data.success) {
                    // Redirect to login page with appropriate message
                    const registerAsSeller = document.getElementById('register-as-seller').checked;
                    if (registerAsSeller) {
                        window.location.href = '/login?registered=true&seller=true';
                    } else {
                        window.location.href = '/login?registered=true';
                    }
                } else {
                    // Show error message
                    showMessage('error-message', data.message || 'Registration failed. Please try again.', 0);
                    enableButton('submit-btn', 'Create Account');
                }
            } else {
                // Handle HTTP errors
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.message || 'Registration failed. Please try again.';
                showMessage('error-message', errorMsg, 0);
                enableButton('submit-btn', 'Create Account');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('error-message', 'An error occurred. Please try again later.', 0);
            enableButton('submit-btn', 'Create Account');
        }
    });
});
