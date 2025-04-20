document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is authenticated using validateToken from auth-utils.js
    const isAuthenticated = await validateToken(true, '/create-store');

    if (isAuthenticated) {
        // Form submission handler
        const form = document.getElementById('create-store-form');
        form.addEventListener('submit', handleCreateStore);
    }
});

/**
 * Handle create store form submission
 */
async function handleCreateStore(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = document.getElementById('submit-button');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const successMessage = document.getElementById('success-message');

    // Hide any existing messages
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');

    // Validate required fields
    const requiredFields = ['name', 'description', 'location', 'contactInfo'];
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        const input = form.elements[field];
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
            if (!firstInvalidField) {
                firstInvalidField = input;
            }
        } else {
            input.classList.remove('invalid');
        }
    });

    if (!isValid) {
        errorText.textContent = 'All fields marked with * are required';
        errorMessage.classList.remove('hidden');
        if (firstInvalidField) {
            firstInvalidField.focus();
        }
        return;
    }

    // Save original button content
    const originalButtonContent = submitButton.innerHTML;

    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Creating...';

        // Get form data
        const formData = {
            name: form.elements.name.value.trim(),
            description: form.elements.description.value.trim(),
            location: form.elements.location.value.trim(),
            contactInfo: form.elements.contactInfo.value.trim(),
            logo: form.elements.logo.value.trim() || null,
            banner: form.elements.banner.value.trim() || null
        };

        // Send request to create store using authenticatedFetch
        const response = await authenticatedFetch('/api/stores', {
            method: 'POST',
            body: JSON.stringify(formData)
        }, true, true);

        if (response.ok) {
            // Show success message
            successMessage.classList.remove('hidden');

            // Scroll to top to ensure message is visible
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } else {
            // Handle error response
            let errorData;
            try {
                errorData = await response.json();
                errorText.textContent = errorData.message || 'Failed to create store. Please try again.';
            } catch (jsonError) {
                errorText.textContent = 'Failed to create store. Please try again.';
                console.error('Error parsing error response:', jsonError);
            }

            errorMessage.classList.remove('hidden');

            // Scroll to top to ensure error message is visible
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error creating store:', error);
        errorText.textContent = `Error creating store: ${error.message}`;
        errorMessage.classList.remove('hidden');

        // Scroll to top to ensure error message is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
        // Re-enable submit button and restore original content
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonContent;
    }
}

/**
 * Add validation styling to form fields
 */
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });

    input.addEventListener('input', function() {
        if (this.classList.contains('invalid') && this.value.trim()) {
            this.classList.remove('invalid');
        }
    });
});
