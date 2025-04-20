/**
 * Edit Product JavaScript
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Validate token before initializing
    const isAuthenticated = await validateToken(true);
    if (isAuthenticated) {
        initEditProductPage();
    }
});

// Store the current product data globally
let currentProduct = null;

/**
 * Initialize the edit product page
 */
async function initEditProductPage() {
    // Get product ID from URL
    const productId = getProductIdFromUrl();

    if (!productId) {
        showError('Invalid product ID. Please go back and try again.');
        return;
    }

    // Set up event listeners
    setupEventListeners();

    // Load product data
    await loadProductData(productId);

    // Load categories with the selected category ID
    if (currentProduct && currentProduct.categoryId) {
        await loadCategories(currentProduct.categoryId);

        // Double-check that the category is selected
        setTimeout(() => {
            const categorySelect = document.getElementById('product-category');
            if (categorySelect.value != currentProduct.categoryId) {
                console.log('Category not selected automatically, forcing selection');
                categorySelect.value = currentProduct.categoryId;

                // If that still didn't work, try one more approach
                if (categorySelect.value != currentProduct.categoryId) {
                    console.log('Final attempt with setAttribute');
                    categorySelect.setAttribute('value', currentProduct.categoryId);

                    // Trigger a change event to ensure any listeners are notified
                    const event = new Event('change');
                    categorySelect.dispatchEvent(event);
                }
            }
        }, 300);
    } else {
        await loadCategories();
    }

    // Add a final check after everything is loaded
    setTimeout(ensureCategoryIsSelected, 500);
}

/**
 * Ensure the category is selected
 * This is a final check to make sure the category is selected
 */
function ensureCategoryIsSelected() {
    if (window.productCategoryId) {
        const categorySelect = document.getElementById('product-category');
        if (categorySelect && categorySelect.value != window.productCategoryId) {
            console.log('Final check: Category still not selected, forcing selection');

            // Try direct value setting
            categorySelect.value = window.productCategoryId;

            // If that didn't work, try to find the option and select it
            if (categorySelect.value != window.productCategoryId) {
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].value == window.productCategoryId) {
                        categorySelect.selectedIndex = i;
                        console.log('Selected category by index in final check');
                        break;
                    }
                }
            }

            // If still not working, create a new option
            if (categorySelect.value != window.productCategoryId) {
                console.log('Creating new option in final check');
                const option = document.createElement('option');
                option.value = window.productCategoryId;
                option.textContent = `Category ID: ${window.productCategoryId}`;
                option.selected = true;
                categorySelect.appendChild(option);
            }
        } else {
            console.log('Final check: Category is correctly selected');
        }
    }
}

/**
 * Get product ID from URL
 * @returns {number|null} The product ID or null if not found
 */
function getProductIdFromUrl() {
    // First check for query parameter (edit-product?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');

    if (queryId) {
        const productId = parseInt(queryId);
        if (!isNaN(productId) && productId > 0) {
            return productId;
        }
        console.error('Invalid product ID in URL query parameter:', queryId);
    }

    // Then check for path parameter (edit-product/123)
    const pathParts = window.location.pathname.split('/');
    const productIdStr = pathParts[pathParts.length - 1];

    // Check if the ID is 'undefined' string or actually undefined
    if (productIdStr === 'undefined' || productIdStr === undefined || productIdStr === 'edit-product') {
        console.error('Product ID is undefined in URL path');
        return null;
    }

    const productId = parseInt(productIdStr);

    // Check if the parsed ID is a valid number
    if (isNaN(productId) || productId <= 0) {
        console.error('Invalid product ID in URL path:', productIdStr);
        return null;
    }

    return productId;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    const form = document.getElementById('edit-product-form');
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
 * Load product data from API
 * @param {number} productId The product ID to load
 */
async function loadProductData(productId) {
    try {
        const loadingState = document.getElementById('loading-state');
        const form = document.getElementById('edit-product-form');

        // Show loading state
        loadingState.classList.remove('hidden');
        form.classList.add('hidden');

        // Fetch product data
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const product = await response.json();
        console.log('Product data loaded:', product);

        // Store the product data globally
        currentProduct = product;

        // Fill form with product data
        fillProductForm(product);

        // Hide loading state, show form
        loadingState.classList.add('hidden');
        form.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading product:', error);
        showError(`Error loading product: ${error.message}`);
    }
}

/**
 * Fill the form with product data
 * @param {Object} product The product data
 */
function fillProductForm(product) {
    const form = document.getElementById('edit-product-form');

    // Set form values
    form.elements.productId.value = product.productId;
    form.elements.productName.value = product.productName;
    form.elements.productDescription.value = product.productDescription;
    form.elements.price.value = product.price;
    form.elements.quantity.value = product.quantity;
    form.elements.unit.value = product.unit;
    // Store the category ID for later use
    window.productCategoryId = product.categoryId;
    console.log('Product category ID stored:', window.productCategoryId);

    // Try to set the category directly
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
        // First, try to set the value directly
        categorySelect.value = product.categoryId;
        console.log('Direct category selection attempt:', categorySelect.value);

        // If that didn't work, we'll try again after categories are loaded
    }
    form.elements.productImage.value = product.productImage || '';
    form.elements.isOrganic.checked = product.isOrganic;
    form.elements.isAvailable.checked = product.isAvailable;

    // Update image preview if available
    if (product.productImage) {
        updateImagePreview(product.productImage);
    }
}

/**
 * Load categories from API
 * @param {number|null} selectedCategoryId - The ID of the category to select
 */
async function loadCategories(selectedCategoryId = null) {
    // Use the stored category ID if available and no ID was passed
    if (!selectedCategoryId && window.productCategoryId) {
        selectedCategoryId = window.productCategoryId;
        console.log('Using stored category ID:', selectedCategoryId);
    }
    try {
        const categorySelect = document.getElementById('product-category');

        // Fetch categories
        const response = await authenticatedFetch('/api/categories', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        const categories = await response.json();
        console.log('Categories loaded:', categories);
        console.log('Selected category ID:', selectedCategoryId);

        // Clear existing options except the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }

        // Add categories to select
        let foundSelectedCategory = false;

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.nameEn; // Use nameEn field from CategoryResponse

            // Select this option if it matches the selectedCategoryId
            if (selectedCategoryId && category.id == selectedCategoryId) {
                option.selected = true;
                foundSelectedCategory = true;
                console.log('Selected category found:', category.nameEn);
            }

            categorySelect.appendChild(option);
        });

        // If we didn't find the selected category, try to set it directly
        if (selectedCategoryId && !foundSelectedCategory) {
            console.log('Selected category not found in options, trying direct selection');
            // Try to find an option with the matching value
            for (let i = 0; i < categorySelect.options.length; i++) {
                if (categorySelect.options[i].value == selectedCategoryId) {
                    categorySelect.selectedIndex = i;
                    console.log('Selected category by index:', i);
                    break;
                }
            }
        }

        // Final attempt: force the value directly
        if (selectedCategoryId) {
            setTimeout(() => {
                console.log('Final attempt to set category ID:', selectedCategoryId);
                categorySelect.value = selectedCategoryId;

                // If that still didn't work, create a new option
                if (categorySelect.value != selectedCategoryId) {
                    console.log('Creating new option for category ID:', selectedCategoryId);
                    const option = document.createElement('option');
                    option.value = selectedCategoryId;
                    option.textContent = `Category ID: ${selectedCategoryId}`;
                    option.selected = true;
                    categorySelect.appendChild(option);
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError(`Error loading categories: ${error.message}`);
    }
}

/**
 * Handle form submission
 * @param {Event} event The form submission event
 */
async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const productId = form.elements.productId.value;
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
        let categoryId = parseInt(form.elements.categoryId.value);

        // If the category ID is not valid, use the stored one
        if (isNaN(categoryId) || categoryId <= 0) {
            console.log('Invalid category ID in form, using stored value');
            if (window.productCategoryId) {
                categoryId = parseInt(window.productCategoryId);
                console.log('Using stored category ID:', categoryId);
            } else if (currentProduct && currentProduct.categoryId) {
                categoryId = parseInt(currentProduct.categoryId);
                console.log('Using category ID from current product:', categoryId);
            } else {
                console.error('No valid category ID found');
            }
        }

        const formData = {
            productName: form.elements.productName.value.trim(),
            productDescription: form.elements.productDescription.value.trim(),
            price: parseFloat(form.elements.price.value),
            quantity: parseInt(form.elements.quantity.value),
            unit: form.elements.unit.value,
            categoryId: categoryId,
            productImage: form.elements.productImage.value.trim() || null,
            isOrganic: form.elements.isOrganic.checked,
            isAvailable: form.elements.isAvailable.checked
        };

        console.log('Submitting product data:', formData);

        // Send update request
        const response = await authenticatedFetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to update product: ${response.status}`;
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
        console.error('Error updating product:', error);
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

    // Validate numeric fields
    if (isValid) {
        const price = parseFloat(form.elements.price.value);
        const quantity = parseInt(form.elements.quantity.value);

        if (isNaN(price) || price <= 0) {
            form.elements.price.classList.add('invalid');
            isValid = false;
        }

        if (isNaN(quantity) || quantity < 0) {
            form.elements.quantity.classList.add('invalid');
            isValid = false;
        }
    }

    // Show error message if invalid
    if (!isValid) {
        showError('Please fill in all required fields correctly.');
    }

    return isValid;
}

/**
 * Handle image URL change
 * @param {Event} event The input event
 */
function handleImageUrlChange(event) {
    const imageUrl = event.target.value.trim();

    if (imageUrl) {
        updateImagePreview(imageUrl);
    } else {
        hideImagePreview();
    }
}

/**
 * Update image preview
 * @param {string} imageUrl The image URL
 */
function updateImagePreview(imageUrl) {
    const previewContainer = document.getElementById('image-preview-container');
    const previewImage = document.getElementById('image-preview');

    previewImage.src = imageUrl;
    previewImage.alt = 'Product image preview';

    // Show preview container
    previewContainer.classList.remove('hidden');

    // Handle image load error
    previewImage.onerror = function() {
        previewImage.src = 'https://via.placeholder.com/100x100?text=Invalid+Image';
        previewImage.alt = 'Invalid image URL';
    };
}

/**
 * Hide image preview
 */
function hideImagePreview() {
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.classList.add('hidden');
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
