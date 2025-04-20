/**
 * Common utility functions for the AgriFinPal application
 */

// Show a message with auto-hide functionality
function showMessage(elementId, message, duration = 5000) {
    const element = document.getElementById(elementId);
    if (element) {
        if (message) {
            element.textContent = message;
        }
        element.classList.remove('hidden');

        if (duration > 0) {
            setTimeout(function() {
                element.classList.add('hidden');
            }, duration);
        }
    }
}

// Hide a message
function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

// Get CSRF token from the page
function getCsrfToken() {
    // For API calls, we're not using CSRF tokens as they're disabled for /api/** endpoints
    // For form submissions, we'll use a simpler approach
    try {
        // Try to get from meta tags first (most reliable)
        const csrfMeta = document.querySelector('meta[name="_csrf"]');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]');

        if (csrfMeta && csrfHeader) {
            return {
                header: csrfHeader.content,
                value: csrfMeta.content
            };
        }

        // Try to get from hidden input
        const csrfInput = document.querySelector('input[name="_csrf"]') ||
                         document.getElementById('csrf-token');

        if (csrfInput) {
            return {
                header: 'X-CSRF-TOKEN',
                value: csrfInput.value || ''
            };
        }
    } catch (error) {
        console.error('Error getting CSRF token:', error);
    }

    // Default fallback
    return { header: 'X-CSRF-TOKEN', value: '' };
}

// Format validation errors
function formatValidationErrors(errors) {
    if (!errors || !Array.isArray(errors)) {
        return "Validation failed";
    }

    return errors.map(error => error.defaultMessage || error.message || "Invalid input").join(", ");
}

// Disable a button and change its text
function disableButton(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        if (text) {
            button.textContent = text;
        }
    }
}

// Enable a button and change its text
function enableButton(buttonId, text) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        if (text) {
            button.textContent = text;
        }
    }
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Truncate text with ellipsis
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

// Create an element with attributes and content
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    // Set content
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof Node) {
            element.appendChild(content);
        }
    }

    return element;
}

// Show a confirmation dialog
function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    } else if (typeof onCancel === 'function') {
        onCancel();
    }
}
