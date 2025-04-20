/**
 * Add Product JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Validate token before initializing
    const isAuthenticated = await validateToken(true);
    if (isAuthenticated) {
        initAddProductPage();
    }
});

/**
 * Initialize the add product page
 */
async function initAddProductPage() {
    // Check if user has a store
    const hasStore = await checkIfUserHasStore();
    
    if (!hasStore) {
        showError('You need to create a store before adding products. Redirecting to create store page...');
        setTimeout(() => {
            window.location.href = '/create-store';
        }, 2000);
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load categories
    await loadCategories();
    
    // Set store ID in hidden field
    const storeIdField = document.getElementById('store-id');
    if (storeIdField) {
        const userStoreId = localStorage.getItem('userStoreId');
        if (userStoreId) {
            storeIdField.value = userStoreId;
        }
    }
}

/**
 * Check if the current user has a store
 * @returns {Promise<boolean>} True if the user has a store, false otherwise
 */
async function checkIfUserHasStore() {
    try {
        // Use the API endpoint to check if user has a store
        const response = await authenticatedFetch('/api/stores/check', {
            method: 'GET'
        }, true, false); // Don't redirect on failure
        
        if (response.ok) {
            const data = await response.json();
            console.log('Store check result:', data);
            
            // Store the store ID in localStorage if available
            if (data.hasStore && data.storeId) {
                localStorage.setItem('userStoreId', data.storeId);
                if (data.storeName) {
                    localStorage.setItem('userStoreName', data.storeName);
                }
            } else {
                localStorage.removeItem('userStoreId');
                localStorage.removeItem('userStoreName');
            }
            
            return data.hasStore === true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking if user has store:', error);
        return false;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    const form = document.getElementById('add-product-form');
    form.addEventListener('submit', handleFormSubmit);

    // Cancel button
    const cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', function() {
        window.location.href = '/dashboard';
    });

    // Image URL input
    const imageInput = document.getElementById('product-image');
    imageInput.addEventListener('input', handleImageUrlChange);

    // Back link
    const backLink = document.getElementById('back-link');
    backLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/dashboard';
    });
}

/**
 * Handle image URL change
 */
function handleImageUrlChange() {
    const imageUrl = this.value.trim();
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    if (imageUrl) {
        imagePreview.src = imageUrl;
        imagePreview.alt = 'Product image preview';
        previewContainer.classList.remove('hidden');
        
        // Handle image load error
        imagePreview.onerror = function() {
            imagePreview.src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
            imagePreview.alt = 'Invalid image URL';
        };
    } else {
        previewContainer.classList.add('hidden');
    }
}

/**
 * Load categories from API
 */
async function loadCategories() {
    try {
        // Fetch categories from API
        const response = await fetch('/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const categories = await response.json();
        console.log('Categories loaded:', categories);
        
        // Populate category dropdown
        const categorySelect = document.getElementById('product-category');
        
        // Clear existing options
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            // Use nameEn from CategoryResponse
            option.textContent = category.nameEn || category.name || 'Unknown Category';
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories. Please refresh the page and try again.');
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
    submitButton.innerHTML = '<div class="spinner" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;"></div> Adding...';

    try {
        // Get form data
        const formData = {
            productName: form.elements.productName.value.trim(),
            productDescription: form.elements.productDescription.value.trim(),
            price: parseFloat(form.elements.price.value),
            quantity: parseInt(form.elements.quantity.value),
            unit: form.elements.unit.value,
            categoryId: parseInt(form.elements.categoryId.value),
            storeId: parseInt(form.elements.storeId.value),
            productImage: form.elements.productImage.value.trim() || null,
            isOrganic: form.elements.isOrganic.checked,
            isAvailable: form.elements.isAvailable.checked
        };

        console.log('Submitting product data:', formData);

        // Send create request
        const response = await authenticatedFetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to add product: ${response.status}`;
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
        console.error('Error adding product:', error);
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
    const requiredFields = ['productName', 'productDescription', 'price', 'quantity', 'unit', 'categoryId'];
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

    // Check store ID
    if (!form.elements.storeId.value) {
        showError('Store ID is missing. Please create a store first or refresh the page.');
        isValid = false;
    }

    // Show error message if invalid
    if (!isValid) {
        showError('Please fill in all required fields.');
    }

    return isValid;
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
