/**
 * Error Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initErrorPage();
});

/**
 * Initialize the error page
 */
function initErrorPage() {
    // Check if i18n is available and translate the page
    if (typeof translateElement === 'function') {
        translateErrorPage();
    }
}

/**
 * Translate error page elements
 */
function translateErrorPage() {
    // 404 Not Found page
    if (document.getElementById('not-found-title')) {
        translateElement('not-found-title', 'notFound.title', '404 - Page Not Found');
        translateElement('not-found-message', 'notFound.message', 'The page you are looking for does not exist.');
        translateElement('not-found-back-home', 'notFound.backHome', 'Back to Home');
    }

    // 500 Server Error page
    if (document.getElementById('server-error-title')) {
        translateElement('server-error-title', 'serverError.title', '500 - Server Error');
        translateElement('server-error-message', 'serverError.message', 'We\'re sorry, but something went wrong on our server. Please try again later.');
        translateElement('server-error-back-home', 'serverError.backHome', 'Back to Home');
    }

    // Generic Error page
    if (document.getElementById('error-title')) {
        translateElement('error-title', 'error.title', 'Something Went Wrong');
        translateElement('error-message', 'error.message', 'We\'re sorry, but an error occurred while processing your request.');
        translateElement('error-back-home', 'error.backHome', 'Back to Home');
    }
}
