/**
 * Home Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize home page
    initHomePage();
});

/**
 * Initialize the home page
 */
function initHomePage() {
    // Mobile menu toggle
    initMobileMenu();

    // Smooth scrolling for anchor links
    initSmoothScrolling();

    // Form handling
    initFormHandling();

    // Initialize language selector
    initLanguageSelector();

    // Initialize authentication UI
    initAuthUI();
}

/**
 * Initialize language selector
 */
function initLanguageSelector() {
    // Set language selector value based on current language
    const currentLang = localStorage.getItem('agrifinpal-language') || 'en';
    const languageSelectors = document.querySelectorAll('.language-select');

    languageSelectors.forEach(selector => {
        selector.value = currentLang;
    });

    // Add direct event listeners to language selectors
    languageSelectors.forEach(selector => {
        selector.addEventListener('change', function() {
            if (typeof window.changeLanguageAndReload === 'function') {
                window.changeLanguageAndReload(this.value);
            } else {
                console.error('changeLanguageAndReload function not found');
                // Fallback: save language preference and reload page
                localStorage.setItem('agrifinpal-language', this.value);
                window.location.reload();
            }
        });
    });
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                document.getElementById('mobileMenu').classList.remove('active');

                // Scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Initialize form handling
 */
function initFormHandling() {
    // Join form
    const joinForm = document.getElementById('joinForm');
    if (joinForm) {
        joinForm.addEventListener('submit', handleJoinFormSubmit);
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
}

/**
 * Handle join form submission
 * @param {Event} e - Form submit event
 */
function handleJoinFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());

    console.log('Join form submitted:', formValues);

    // In a real implementation, you would send this data to your backend
    // For now, we'll just show a success message

    // Show success message
    const successHTML = `
        <div class="success-message">
            <p>Thank you for joining AgriFinPal!</p>
            <p>Our team will contact you within 24 hours to complete your registration.</p>
        </div>
    `;

    e.target.innerHTML = successHTML;

    // Reset form after 3 seconds
    setTimeout(() => {
        e.target.reset();
        e.target.innerHTML = `
            <div class="form-group">
                <label for="fullName" class="form-label">Full Name</label>
                <input type="text" id="fullName" name="fullName" class="form-input" placeholder="Enter your full name" required>
            </div>

            <div class="form-group">
                <label for="region" class="form-label">Region</label>
                <select id="region" name="region" class="form-select" required>
                    <option value="">Select your region</option>
                    <option value="north">North (Jenin, Nablus, Tulkarem, Qalqilya, Salfit)</option>
                    <option value="central">Central (Ramallah, Jericho, Jerusalem, Bethlehem)</option>
                    <option value="south">South (Hebron)</option>
                    <option value="gaza">Gaza</option>
                </select>
            </div>

            <div class="form-group">
                <label for="agricultureType" class="form-label">Type of Agriculture</label>
                <select id="agricultureType" name="agricultureType" class="form-select" required>
                    <option value="">Select your agriculture type</option>
                    <option value="olives">Olives</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="form-group">
                <label for="contact" class="form-label">Contact Information</label>
                <input type="text" id="contact" name="contact" class="form-input" placeholder="Enter your phone number or email" required>
            </div>

            <button type="submit" class="form-submit">Join Now</button>
        `;
    }, 3000);
}

/**
 * Handle contact form submission
 * @param {Event} e - Form submit event
 */
function handleContactFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(e.target);
    const formValues = Object.fromEntries(formData.entries());

    console.log('Contact form submitted:', formValues);

    // Get CSRF token if it exists
    const csrfToken = document.getElementById('csrf-token');
    const headers = {
        'Content-Type': 'application/json'
    };

    if (csrfToken) {
        headers[csrfToken.name] = csrfToken.value;
    }

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    // Send data to backend
    fetch('/api/messages', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formValues)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);

        // Show success message
        const successHTML = `
            <div class="success-message">
                <p>Message Sent Successfully!</p>
                <p>We'll get back to you as soon as possible.</p>
            </div>
        `;

        e.target.innerHTML = successHTML;

        // Reset form after 3 seconds
        setTimeout(() => {
            e.target.reset();
            e.target.innerHTML = `
                <div class="form-group">
                    <label for="name" class="form-label">Your Name</label>
                    <input type="text" id="name" name="name" class="form-input" placeholder="Enter your name" required>
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Your Email</label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email" required>
                </div>

                <div class="form-group">
                    <label for="message" class="form-label">Your Message</label>
                    <textarea id="message" name="message" class="form-textarea" placeholder="How can we help you?" required></textarea>
                </div>

                <button type="submit" class="form-submit">Send Message</button>
            `;
        }, 3000);
    })
    .catch(error => {
        console.error('Error:', error);

        // Reset button state
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;

        // Show error message
        alert('There was an error sending your message. Please try again.');
    });
}

/**
 * Initialize authentication UI
 */
function initAuthUI() {
    // Check if auth-utils.js is loaded
    if (typeof updateAuthUI === 'function') {
        // Update UI based on authentication state
        updateAuthUI();
    } else {
        console.error('auth-utils.js not loaded');

        // Fallback implementation
        const isAuthenticated = !!localStorage.getItem('token');

        // Show/hide elements based on authentication state
        document.querySelectorAll('[data-auth-required]').forEach(element => {
            element.style.display = isAuthenticated ? '' : 'none';
        });

        document.querySelectorAll('[data-auth-anonymous]').forEach(element => {
            element.style.display = isAuthenticated ? 'none' : '';
        });

        // Handle role-based elements
        if (isAuthenticated) {
            try {
                const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');

                document.querySelectorAll('[data-role]').forEach(element => {
                    const requiredRole = element.getAttribute('data-role');
                    if (requiredRole) {
                        element.style.display = userRoles.includes(requiredRole) ? '' : 'none';
                    }
                });
            } catch (error) {
                console.error('Error parsing user roles:', error);
            }
        }
    }
}

/**
 * Handle logout
 */
function logout() {
    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');

    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Redirect to home page
    window.location.href = '/login?logout=true';
}
