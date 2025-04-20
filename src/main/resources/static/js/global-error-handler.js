/**
 * Global Error Handler
 * This script intercepts JSON error responses and displays a user-friendly error page
 */

// Execute immediately when loaded
(function() {
    // Listen for any AJAX errors
    window.addEventListener('error', handleGlobalError);
    
    // Check if the current page is an error response
    document.addEventListener('DOMContentLoaded', checkForErrorResponse);
})();

/**
 * Check if the current page content is a JSON error response
 */
function checkForErrorResponse() {
    try {
        // Get the page content
        const content = document.body.textContent.trim();
        
        // Check if it looks like JSON
        if (content.startsWith('{') && content.endsWith('}')) {
            try {
                // Try to parse it as JSON
                const errorData = JSON.parse(content);
                
                // Check if it has error properties
                if (errorData.errorCode && errorData.status && errorData.path) {
                    console.log('Detected JSON error response:', errorData);
                    
                    // Handle the error
                    displayErrorPage(errorData);
                    return true;
                }
            } catch (e) {
                console.log('Content looks like JSON but failed to parse', e);
            }
        }
        return false;
    } catch (e) {
        console.error('Error checking for error response', e);
        return false;
    }
}

/**
 * Handle global errors
 */
function handleGlobalError(event) {
    console.log('Global error detected:', event);
    
    // We don't want to interfere with normal error handling
    // This is just a fallback
}

/**
 * Display a custom error page
 */
function displayErrorPage(errorData) {
    // Clear the current page content
    document.body.innerHTML = '';
    
    // Add necessary styles
    const style = document.createElement('style');
    style.textContent = `
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f7fafc;
            color: #2d3748;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .error-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            text-align: center;
        }
        .error-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: #2d3748;
        }
        .error-message {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            color: #4a5568;
        }
        .error-details {
            margin-top: 2rem;
            padding: 1rem;
            background-color: #edf2f7;
            border-radius: 0.5rem;
            text-align: left;
            font-family: monospace;
            font-size: 0.875rem;
        }
        .error-path {
            font-size: 0.875rem;
            color: #718096;
            margin-bottom: 0.5rem;
        }
        .button-container {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }
        .error-button {
            display: inline-block;
            background-color: #38a169;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        .error-button:hover {
            background-color: #2f855a;
        }
        .error-button.secondary {
            background-color: #4a5568;
        }
        .error-button.secondary:hover {
            background-color: #2d3748;
        }
    `;
    document.head.appendChild(style);
    
    // Create error page content
    const container = document.createElement('div');
    container.className = 'error-container';
    
    // Set title based on status code
    let title = 'Error';
    if (errorData.status === 404) {
        title = '404 - Page Not Found';
        document.title = '404 - Page Not Found';
    } else if (errorData.status === 500) {
        title = '500 - Server Error';
        document.title = '500 - Server Error';
    } else {
        title = `${errorData.status} - ${errorData.errorCode}`;
        document.title = `Error - ${errorData.errorCode}`;
    }
    
    // Create elements
    const titleElement = document.createElement('h1');
    titleElement.className = 'error-title';
    titleElement.textContent = title;
    
    const messageElement = document.createElement('p');
    messageElement.className = 'error-message';
    messageElement.textContent = errorData.message || 'An unexpected error occurred.';
    
    const pathElement = document.createElement('p');
    pathElement.className = 'error-path';
    pathElement.textContent = `Path: ${errorData.path}`;
    
    const timestampElement = document.createElement('p');
    timestampElement.className = 'error-path';
    timestampElement.textContent = `Time: ${errorData.timestamp}`;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    const homeButton = document.createElement('a');
    homeButton.href = '/';
    homeButton.className = 'error-button';
    homeButton.textContent = 'Back to Home';
    
    const dashboardButton = document.createElement('a');
    dashboardButton.href = '/dashboard';
    dashboardButton.className = 'error-button secondary';
    dashboardButton.textContent = 'Go to Dashboard';
    
    // Create details section
    const detailsElement = document.createElement('div');
    detailsElement.className = 'error-details';
    
    const detailsContent = document.createElement('pre');
    detailsContent.textContent = JSON.stringify(errorData, null, 2);
    
    // Assemble the page
    container.appendChild(titleElement);
    container.appendChild(messageElement);
    container.appendChild(pathElement);
    container.appendChild(timestampElement);
    
    buttonContainer.appendChild(homeButton);
    buttonContainer.appendChild(dashboardButton);
    container.appendChild(buttonContainer);
    
    detailsElement.appendChild(detailsContent);
    container.appendChild(detailsElement);
    
    document.body.appendChild(container);
}
