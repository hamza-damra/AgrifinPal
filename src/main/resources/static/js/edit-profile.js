/**
 * Edit Profile JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Validate token before initializing
    const isAuthenticated = await validateToken(true);
    if (isAuthenticated) {
        initEditProfilePage();
    }
});

/**
 * Initialize the edit profile page
 */
async function initEditProfilePage() {
    // Set up event listeners
    setupEventListeners();

    // Load user data
    await loadUserData();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    const form = document.getElementById('edit-profile-form');
    form.addEventListener('submit', handleFormSubmit);

    // Cancel button
    const cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', function() {
        window.location.href = '/dashboard';
    });

    // Profile image input
    const imageInput = document.getElementById('profile-image');
    imageInput.addEventListener('input', handleImageUrlChange);

    // Back link
    const backLink = document.getElementById('back-link');
    backLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/dashboard';
    });
}

/**
 * Load user data from API
 */
async function loadUserData() {
    try {
        const loadingState = document.getElementById('loading-state');
        const form = document.getElementById('edit-profile-form');

        // Show loading state
        loadingState.classList.remove('hidden');
        form.classList.add('hidden');

        // Fetch user data
        const response = await authenticatedFetch('/api/auth/me', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User data loaded:', userData);

        // Fill form with user data
        fillProfileForm(userData);

        // Hide loading state, show form
        loadingState.classList.add('hidden');
        form.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading user data:', error);
        showError(`Error loading user data: ${error.message}`);
    }
}

/**
 * Fill the form with user data
 * @param {Object} userData The user data
 */
function fillProfileForm(userData) {
    const form = document.getElementById('edit-profile-form');

    // Set form values
    form.elements.username.value = userData.username || '';
    form.elements.fullName.value = userData.fullName || '';
    form.elements.email.value = userData.email || '';
    form.elements.phone.value = userData.phone || '';
    form.elements.region.value = userData.region || '';
    form.elements.agricultureType.value = userData.agricultureType || '';
    form.elements.bio.value = userData.bio || '';
    form.elements.profileImage.value = userData.profileImage || '';

    // Update profile image preview if available
    if (userData.profileImage) {
        updateProfileImagePreview(userData.profileImage);
    } else {
        // Use default image
        updateProfileImagePreview('/images/default-profile.svg');
    }
}

/**
 * Handle form submission
 * @param {Event} event The form submission event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = document.getElementById('submit-button');

    // Validate form
    if (!validateForm(form)) {
        return;
    }

    // Disable submit button and show loading state
    submitButton.disabled = true;
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<div class="spinner" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;"></div> Saving...';

    try {
        // Get form data
        const formData = {
            fullName: form.elements.fullName.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim() || null,
            region: form.elements.region.value.trim() || null,
            agricultureType: form.elements.agricultureType.value.trim() || null,
            bio: form.elements.bio.value.trim() || null,
            profileImage: form.elements.profileImage.value.trim() || null
        };

        console.log('Submitting profile data:', formData);

        // Send update request
        const response = await authenticatedFetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to update profile: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Ignore JSON parsing error
            }
            throw new Error(errorMessage);
        }

        // Show success message
        const successMessage = document.getElementById('success-message');
        successMessage.classList.remove('hidden');

        // Hide error message if shown
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.add('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Redirect to dashboard after delay
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    } catch (error) {
        console.error('Error updating profile:', error);
        showError(error.message);

        // Scroll to top to show error
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

/**
 * Validate the form
 * @param {HTMLFormElement} form The form to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateForm(form) {
    // Required fields
    const requiredFields = ['fullName', 'email'];
    let isValid = true;

    // Check each required field
    requiredFields.forEach(fieldName => {
        const field = form.elements[fieldName];
        const value = field.value.trim();

        if (!value) {
            field.classList.add('invalid');
            isValid = false;
        } else {
            field.classList.remove('invalid');
        }
    });

    // Validate email format
    const emailField = form.elements.email;
    const emailValue = emailField.value.trim();

    if (emailValue && !isValidEmail(emailValue)) {
        emailField.classList.add('invalid');
        isValid = false;
    }

    // Show error message if invalid
    if (!isValid) {
        showError('Please fill in all required fields correctly.');
    }

    return isValid;
}

/**
 * Validate email format
 * @param {string} email The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Handle image URL change
 * @param {Event} event The input event
 */
function handleImageUrlChange(event) {
    const imageUrl = event.target.value.trim();

    if (imageUrl) {
        updateProfileImagePreview(imageUrl);
    } else {
        // Use default image
        updateProfileImagePreview('/images/default-profile.svg');
    }
}

/**
 * Update profile image preview
 * @param {string} imageUrl The image URL
 */
function updateProfileImagePreview(imageUrl) {
    const previewImage = document.getElementById('profile-image-preview');

    previewImage.src = imageUrl;
    previewImage.alt = 'Profile image preview';

    // Handle image load error
    previewImage.onerror = function() {
        previewImage.src = '/images/default-profile.svg';
        previewImage.alt = 'Default profile image';
    };
}

/**
 * Show error message
 * @param {string} message The error message to show
 */
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}
