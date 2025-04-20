/**
 * Category Management JavaScript
 */

// Global variables
let categories = [];
let currentCategoryId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Show loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        // Validate token before initializing
        const isAuthenticated = await validateToken(true);
        if (isAuthenticated) {
            await initCategoryManagementPage();

            // Animate page content
            animatePageContent();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    } finally {
        // Hide loading overlay with a slight delay for smoother transition
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }, 500);
    }
});

/**
 * Initialize the category management page
 */
async function initCategoryManagementPage() {
    try {
        // Set up event listeners
        setupEventListeners();

        // Load categories
        await loadCategories();

        return true;
    } catch (error) {
        console.error('Error in category management initialization:', error);
        return false;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', openAddCategoryModal);
    }

    // Add category from empty state button
    const addCategoryEmptyBtn = document.getElementById('add-category-empty-btn');
    if (addCategoryEmptyBtn) {
        addCategoryEmptyBtn.addEventListener('click', openAddCategoryModal);
    }

    // Category form
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    }

    // Close modal buttons
    const closeModalBtn = document.getElementById('close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    const cancelButton = document.getElementById('cancel-button');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeModal);
    }

    // Close delete modal buttons
    const closeDeleteModalBtn = document.getElementById('close-delete-modal');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    const cancelDeleteBtn = document.getElementById('cancel-delete');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDeleteCategory);
    }

    // Image URL input
    const imageInput = document.getElementById('image');
    if (imageInput) {
        imageInput.addEventListener('input', handleImageUrlChange);
    }

    // Back link
    const backLink = document.getElementById('back-link');
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/seller/dashboard';
        });
    }
}

/**
 * Load categories from API
 */
async function loadCategories() {
    try {
        // Show loading state
        document.getElementById('loading-state').classList.remove('hidden');
        document.getElementById('categories-container').classList.add('hidden');
        document.getElementById('no-categories').classList.add('hidden');

        // Fetch categories from API
        const response = await authenticatedFetch('/api/categories', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.status}`);
        }

        categories = await response.json();
        console.log('Categories loaded:', categories);

        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');

        // Check if there are categories
        if (categories && categories.length > 0) {
            // Display categories
            displayCategories(categories);
            document.getElementById('categories-container').classList.remove('hidden');
        } else {
            // Show no categories message
            document.getElementById('no-categories').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Failed to load categories. Please refresh the page and try again.');

        // Hide loading state
        document.getElementById('loading-state').classList.add('hidden');
    }
}

/**
 * Display categories in the table
 * @param {Array} categories The categories to display
 */
function displayCategories(categories) {
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';

    categories.forEach(category => {
        const row = document.createElement('tr');

        // ID cell
        const idCell = document.createElement('td');
        idCell.textContent = category.id;
        row.appendChild(idCell);

        // Name (English) cell
        const nameEnCell = document.createElement('td');
        nameEnCell.textContent = category.nameEn || '-';
        row.appendChild(nameEnCell);

        // Name (Arabic) cell
        const nameArCell = document.createElement('td');
        nameArCell.textContent = category.nameAr || '-';
        row.appendChild(nameArCell);

        // Description cell
        const descriptionCell = document.createElement('td');
        descriptionCell.textContent = category.description || '-';
        row.appendChild(descriptionCell);

        // Image cell
        const imageCell = document.createElement('td');
        imageCell.className = 'image-cell';
        if (category.image) {
            const img = document.createElement('img');
            img.src = category.image;
            img.alt = category.nameEn;
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/40x40?text=No+Image';
                this.alt = 'Image not available';
            };
            imageCell.appendChild(img);
        } else {
            imageCell.textContent = '-';
        }
        row.appendChild(imageCell);

        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';

        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        editBtn.title = 'Edit Category';
        editBtn.addEventListener('click', () => openEditCategoryModal(category));
        actionsCell.appendChild(editBtn);

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        deleteBtn.title = 'Delete Category';
        deleteBtn.addEventListener('click', () => openDeleteCategoryModal(category.id));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(actionsCell);

        categoriesList.appendChild(row);
    });
}

/**
 * Open the add category modal
 */
function openAddCategoryModal() {
    // Reset form
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.getElementById('image-preview-container').classList.add('hidden');

    // Set modal title
    document.getElementById('modal-title').textContent = 'Add New Category';

    // Set submit button text
    const submitButton = document.getElementById('submit-button');
    submitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Category';

    // Reset current category ID
    currentCategoryId = null;

    // Show modal
    document.getElementById('category-modal').classList.remove('hidden');
}

/**
 * Open the edit category modal
 * @param {Object} category The category to edit
 */
function openEditCategoryModal(category) {
    // Set form values
    document.getElementById('category-id').value = category.id;
    document.getElementById('name-en').value = category.nameEn || '';
    document.getElementById('name-ar').value = category.nameAr || '';
    document.getElementById('description').value = category.description || '';
    document.getElementById('image').value = category.image || '';

    // Update image preview
    if (category.image) {
        const imagePreview = document.getElementById('image-preview');
        imagePreview.src = category.image;
        imagePreview.alt = category.nameEn;
        document.getElementById('image-preview-container').classList.remove('hidden');
    } else {
        document.getElementById('image-preview-container').classList.add('hidden');
    }

    // Set modal title
    document.getElementById('modal-title').textContent = 'Edit Category';

    // Set submit button text
    const submitButton = document.getElementById('submit-button');
    submitButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Changes';

    // Set current category ID
    currentCategoryId = category.id;

    // Show modal
    document.getElementById('category-modal').classList.remove('hidden');
}

/**
 * Close the category modal
 */
function closeModal() {
    document.getElementById('category-modal').classList.add('hidden');
}

/**
 * Open the delete category confirmation modal
 * @param {number} categoryId The ID of the category to delete
 */
function openDeleteCategoryModal(categoryId) {
    // Set current category ID
    currentCategoryId = categoryId;

    // Show modal
    document.getElementById('delete-modal').classList.remove('hidden');
}

/**
 * Close the delete category modal
 */
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
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
        imagePreview.alt = 'Category image preview';
        previewContainer.classList.remove('hidden');

        // Handle image load error
        imagePreview.onerror = function() {
            imagePreview.src = 'https://via.placeholder.com/200x100?text=Invalid+Image+URL';
            imagePreview.alt = 'Invalid image URL';
        };
    } else {
        previewContainer.classList.add('hidden');
    }
}

/**
 * Handle category form submission
 * @param {Event} event The form submission event
 */
async function handleCategoryFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = document.getElementById('submit-button');

    // Validate form
    if (!validateCategoryForm(form)) {
        return;
    }

    // Disable submit button and show loading state
    submitButton.disabled = true;
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<div class="spinner" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;"></div> Saving...';

    try {
        // Get form data
        const formData = {
            nameEn: form.elements.nameEn.value.trim(),
            nameAr: form.elements.nameAr.value.trim() || null,
            description: form.elements.description.value.trim() || null,
            image: form.elements.image.value.trim() || null
        };

        let response;

        if (currentCategoryId) {
            // Update existing category
            response = await authenticatedFetch(`/api/categories/${currentCategoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Create new category
            response = await authenticatedFetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
        }

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to ${currentCategoryId ? 'update' : 'create'} category: ${response.status}`;
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

        // Close modal
        closeModal();

        // Show success message
        showSuccess(`Category ${currentCategoryId ? 'updated' : 'created'} successfully!`);

        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error(`Error ${currentCategoryId ? 'updating' : 'creating'} category:`, error);
        showError(error.message);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

/**
 * Handle category deletion
 */
async function handleDeleteCategory() {
    if (!currentCategoryId) {
        closeDeleteModal();
        return;
    }

    const deleteButton = document.getElementById('confirm-delete');

    // Disable delete button and show loading state
    deleteButton.disabled = true;
    const originalButtonText = deleteButton.innerHTML;
    deleteButton.innerHTML = '<div class="spinner" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;"></div> Deleting...';

    try {
        // Send delete request
        const response = await authenticatedFetch(`/api/categories/${currentCategoryId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            // Try to get error message from response
            let errorMessage = `Failed to delete category: ${response.status}`;
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

        // Close modal
        closeDeleteModal();

        // Show success message
        showSuccess('Category deleted successfully!');

        // Reload categories
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showError(error.message);

        // Close modal
        closeDeleteModal();
    } finally {
        // Re-enable delete button
        deleteButton.disabled = false;
        deleteButton.innerHTML = originalButtonText;
    }
}

/**
 * Validate the category form
 * @param {HTMLFormElement} form The form to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateCategoryForm(form) {
    // Required fields
    const nameEn = form.elements.nameEn.value.trim();

    if (!nameEn) {
        form.elements.nameEn.classList.add('invalid');
        showError('English name is required.');
        return false;
    }

    form.elements.nameEn.classList.remove('invalid');
    return true;
}

/**
 * Show error message
 * @param {string} message The error message to show
 */
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const successMessage = document.getElementById('success-message');

    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.classList.add('animate-slide-in-top');
    successMessage.classList.add('hidden');

    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide error message after 5 seconds
    setTimeout(() => {
        errorMessage.classList.add('opacity-0');
        errorMessage.style.transition = 'opacity 0.3s ease-out';

        setTimeout(() => {
            errorMessage.classList.add('hidden');
            errorMessage.classList.remove('opacity-0', 'animate-slide-in-top');
        }, 300);
    }, 5000);
}

/**
 * Animate page content with staggered animations
 */
function animatePageContent() {
    // Show main content container
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
        pageContent.classList.add('loaded');
    }

    // Animate category rows with staggered delay
    const categoryRows = document.querySelectorAll('#categories-list tr');
    categoryRows.forEach((row, index) => {
        if (row) {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            row.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';

            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 100 + (index * 50)); // Staggered delay
        }
    });

    // Animate modal when it opens
    const categoryModal = document.getElementById('category-modal');
    if (categoryModal) {
        const modalContent = categoryModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-scale-in');
        }
    }
}

/**
 * Show success message
 * @param {string} message The success message to show
 */
function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    const successText = document.getElementById('success-text');
    const errorMessage = document.getElementById('error-message');

    successText.textContent = message;
    successMessage.classList.remove('hidden');
    successMessage.classList.add('animate-slide-in-top');
    errorMessage.classList.add('hidden');

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Hide success message after 3 seconds
    setTimeout(() => {
        successMessage.classList.add('opacity-0');
        successMessage.style.transition = 'opacity 0.3s ease-out';

        setTimeout(() => {
            successMessage.classList.add('hidden');
            successMessage.classList.remove('opacity-0', 'animate-slide-in-top');
        }, 300);
    }, 3000);
}
