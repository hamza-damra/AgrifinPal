/**
 * Edit Store JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Validate token before initializing
    const isAuthenticated = await validateToken(true);
    if (isAuthenticated) {
        initEditStorePage();
    }
});

/**
 * Initialize the edit store page
 */
async function initEditStorePage() {
    // Get store ID from URL
    const storeId = getStoreIdFromUrl();

    if (!storeId) {
        showError('Invalid store ID. Please go back and try again.');
        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');
        // Add a back button that works
        const errorArea = document.getElementById('error-message');
        errorArea.innerHTML += `
            <div style="margin-top: 1rem;">
                <button onclick="window.location.href='/dashboard'" class="primary-btn">
                    Back to Dashboard
                </button>
            </div>
        `;
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Load store data
    await loadStoreData(storeId);
}

/**
 * Get store ID from URL
 * @returns {number|null} The store ID or null if not found
 */
function getStoreIdFromUrl() {
    // First check for query parameter (edit-store?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');

    if (queryId) {
        const storeId = parseInt(queryId);
        if (!isNaN(storeId) && storeId > 0) {
            return storeId;
        }
        console.error('Invalid store ID in URL query parameter:', queryId);
    }

    // Then check for path parameter (edit-store/123)
    const pathParts = window.location.pathname.split('/');
    const storeIdStr = pathParts[pathParts.length - 1];

    // Check if the ID is 'undefined' string or actually undefined
    if (storeIdStr === 'undefined' || storeIdStr === undefined || storeIdStr === 'edit-store') {
        console.error('Store ID is undefined in URL path');
        return null;
    }

    const storeId = parseInt(storeIdStr);

    // Check if the parsed ID is a valid number
    if (isNaN(storeId) || storeId <= 0) {
        console.error('Invalid store ID in URL path:', storeIdStr);
        return null;
    }

    return storeId;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    const form = document.getElementById('edit-store-form');
    form.addEventListener('submit', handleFormSubmit);

    // Cancel button
    const cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', function() {
        window.location.href = '/dashboard';
    });

    // Logo URL input
    const logoInput = document.getElementById('store-logo');
    logoInput.addEventListener('input', function() {
        updateLogoPreview(this.value);
    });

    // Banner URL input
    const bannerInput = document.getElementById('store-banner');
    bannerInput.addEventListener('input', function() {
        updateBannerPreview(this.value);
    });

    // Back link
    const backLink = document.getElementById('back-link');
    backLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/dashboard';
    });
}

/**
 * Load store data from API
 * @param {number} storeId The store ID to load
 */
async function loadStoreData(storeId) {
    try {
        const loadingState = document.getElementById('loading-state');
        const form = document.getElementById('edit-store-form');

        // Show loading state
        loadingState.classList.remove('hidden');
        form.classList.add('hidden');

        // Fetch store data
        console.log('Fetching store with ID:', storeId);
        const response = await authenticatedFetch(`/api/stores/${storeId}`, {
            method: 'GET'
        });
        console.log('Store API response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to fetch store: ${response.status}`);
        }

        const store = await response.json();
        console.log('Store data loaded:', store);

        // Fill form with store data
        fillStoreForm(store);

        // Hide loading state, show form
        loadingState.classList.add('hidden');
        form.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading store:', error);
        showError(`Error loading store: ${error.message}`);
    }
}

/**
 * Fill the form with store data
 * @param {Object} store The store data
 */
function fillStoreForm(store) {
    console.log('Filling store form with data:', store);
    const form = document.getElementById('edit-store-form');

    // Normalize store data to ensure consistent field names
    if (!store.storeId && store.id) {
        store.storeId = store.id;
    }
    if (!store.name && store.storeName) {
        store.name = store.storeName;
    }
    if (!store.description && store.storeDescription) {
        store.description = store.storeDescription;
    }
    if (!store.logo && store.storeLogo) {
        store.logo = store.storeLogo;
    }
    if (!store.banner && store.storeBanner) {
        store.banner = store.storeBanner;
    }

    // Set form values
    form.elements.storeId.value = store.storeId;
    form.elements.name.value = store.name;
    form.elements.description.value = store.description || '';
    form.elements.location.value = store.location || '';
    form.elements.contactInfo.value = store.contactInfo || '';
    form.elements.logo.value = store.logo || '';
    form.elements.banner.value = store.banner || '';

    // Update logo preview if available
    if (store.logo) {
        updateLogoPreview(store.logo);
    }

    // Update banner preview if available
    if (store.banner) {
        updateBannerPreview(store.banner);
    }
}

/**
 * Handle form submission
 * @param {Event} event The form submission event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const storeId = form.elements.storeId.value;
    console.log('Submitting form for store ID:', storeId);
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
            name: form.elements.name.value.trim(),
            description: form.elements.description.value.trim(),
            location: form.elements.location.value.trim(),
            contactInfo: form.elements.contactInfo.value.trim(),
            logo: form.elements.logo.value.trim() || null,
            banner: form.elements.banner.value.trim() || null
        };

        console.log('Submitting store data:', formData);

        // Send update request
        const response = await authenticatedFetch(`/api/stores/${storeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to update store: ${response.status}`;
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
        console.error('Error updating store:', error);
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
    const requiredFields = ['name', 'description', 'location', 'contactInfo'];
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

    // Show error message if invalid
    if (!isValid) {
        showError('Please fill in all required fields.');
    }

    return isValid;
}

/**
 * Update logo preview
 * @param {string} logoUrl The logo URL
 */
function updateLogoPreview(logoUrl) {
    const logoPreview = document.getElementById('logo-preview');

    if (logoUrl) {
        logoPreview.src = logoUrl;
        logoPreview.alt = 'Store logo preview';

        // Handle image load error
        logoPreview.onerror = function() {
            logoPreview.src = '/images/default-logo.svg';
            logoPreview.alt = 'Default store logo';
        };
    } else {
        logoPreview.src = '/images/default-logo.svg';
        logoPreview.alt = 'Default store logo';
    }
}

/**
 * Update banner preview
 * @param {string} bannerUrl The banner URL
 */
function updateBannerPreview(bannerUrl) {
    const bannerPreview = document.getElementById('banner-preview');

    if (bannerUrl) {
        bannerPreview.src = bannerUrl;
        bannerPreview.alt = 'Store banner preview';

        // Handle image load error
        bannerPreview.onerror = function() {
            bannerPreview.src = '/images/default-banner.svg';
            bannerPreview.alt = 'Default store banner';
        };
    } else {
        bannerPreview.src = '/images/default-banner.svg';
        bannerPreview.alt = 'Default store banner';
    }
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
