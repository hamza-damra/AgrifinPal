/**
 * Simplified English-only internationalization (i18n) utility for AgriFinPal
 */

// Make sure English language object is available
if (typeof en === 'undefined') {
    console.error('English language file not loaded');
    var en = {};
}

// Fixed language - English only
let currentLanguage = 'en';

// Initialize language settings
function initLanguage() {
    console.log('Initializing language (English only)...');

    // Clear any previous language settings
    localStorage.setItem('agrifinpal-language', 'en');

    // Set HTML attributes for LTR (left-to-right) English
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';

    // Remove RTL stylesheet if it exists
    const rtlStylesheet = document.getElementById('rtl-stylesheet');
    if (rtlStylesheet) {
        rtlStylesheet.remove();
    }

    // Hide any language selectors that might exist
    const languageSelects = document.querySelectorAll('.language-select');
    languageSelects.forEach(select => {
        select.style.display = 'none';
    });

    // Update debug panel if it exists
    const debugCurrentLang = document.getElementById('debug-current-lang');
    const debugDirection = document.getElementById('debug-direction');
    const debugRtlLoaded = document.getElementById('debug-rtl-loaded');

    if (debugCurrentLang) debugCurrentLang.textContent = 'en';
    if (debugDirection) debugDirection.textContent = 'ltr';
    if (debugRtlLoaded) debugRtlLoaded.textContent = 'No';
}

/**
 * Stub function for language change (English only)
 * @param {string} lang - Language code (only 'en' is supported)
 */
window.changeLanguage = function(lang) {
    console.log('Language change requested, but only English is supported');

    // Always use English
    currentLanguage = 'en';
    localStorage.setItem('agrifinpal-language', 'en');

    // Ensure LTR direction
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';

    // Translate the page (will use English translations)
    translatePage();

    console.log('English language applied');
}

/**
 * Get a translation by key (English only)
 * @param {string} key - Dot notation key (e.g., 'header.home')
 * @param {string} defaultValue - Default value if translation is not found
 * @returns {string} - Translated text
 */
window.getTranslation = function(key, defaultValue = '') {
    // Split the key by dots
    const keys = key.split('.');

    // Always use English language object
    const langObj = en;

    // Check if language object is available
    if (!langObj || Object.keys(langObj).length === 0) {
        console.error('English language object is not properly loaded');
        return defaultValue;
    }

    // Navigate through the object to find the translation
    let translation = langObj;
    for (const k of keys) {
        if (translation && translation[k] !== undefined) {
            translation = translation[k];
        } else {
            console.warn(`Translation key not found: '${key}', using default value: '${defaultValue}'`);
            return defaultValue;
        }
    }

    if (typeof translation !== 'string') {
        console.warn(`Translation for key '${key}' is not a string, using default value: '${defaultValue}'`);
        return defaultValue;
    }

    return translation;
}

/**
 * Translate an element by its ID
 * @param {string} elementId - Element ID
 * @param {string} key - Translation key
 * @param {string} defaultValue - Default value if translation is not found
 */
function translateElement(elementId, key, defaultValue = '') {
    const element = document.getElementById(elementId);
    if (element) {
        const translation = getTranslation(key, defaultValue);
        element.textContent = translation;
    }
}

/**
 * Translate an element's attribute by its ID
 * @param {string} elementId - Element ID
 * @param {string} attribute - Attribute name (e.g., 'placeholder')
 * @param {string} key - Translation key
 * @param {string} defaultValue - Default value if translation is not found
 */
function translateElementAttribute(elementId, attribute, key, defaultValue = '') {
    const element = document.getElementById(elementId);
    if (element) {
        const translation = getTranslation(key, defaultValue);
        element.setAttribute(attribute, translation);
    }
}

/**
 * Translate all elements with data-i18n attribute
 */
function translatePage() {
    console.log('Starting page translation, current language:', currentLanguage);

    // Translate elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Found ${elements.length} elements with data-i18n attribute`);
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key, element.textContent);
        console.log(`Translating [${key}]: '${element.textContent}' -> '${translation}'`);
        element.textContent = translation;
    });

    // Translate elements with data-i18n-placeholder attribute
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    console.log(`Found ${placeholderElements.length} elements with data-i18n-placeholder attribute`);
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const translation = getTranslation(key, element.getAttribute('placeholder') || '');
        element.setAttribute('placeholder', translation);
    });

    // Translate elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    console.log(`Found ${titleElements.length} elements with data-i18n-title attribute`);
    titleElements.forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        const translation = getTranslation(key, element.getAttribute('title') || '');
        element.setAttribute('title', translation);
    });

    // Translate elements with data-i18n-value attribute
    const valueElements = document.querySelectorAll('[data-i18n-value]');
    console.log(`Found ${valueElements.length} elements with data-i18n-value attribute`);
    valueElements.forEach(element => {
        const key = element.getAttribute('data-i18n-value');
        const translation = getTranslation(key, element.getAttribute('value') || '');
        element.setAttribute('value', translation);
    });

    // Dispatch a custom event for components that need to know when translation is done
    document.dispatchEvent(new CustomEvent('translationComplete', { detail: { language: currentLanguage } }));
    console.log('Translation complete, dispatched translationComplete event');
}

// Initialize language when the script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing language (English only)');

    // Stub function for language change - always use English
    window.changeLanguageAndReload = function(lang) {
        console.log('Language change requested, but only English is supported');
        // Always use English
        localStorage.setItem('agrifinpal-language', 'en');
    };

    // Initialize language
    initLanguage();

    // Hide any language selectors
    const languageSelects = document.querySelectorAll('.language-select');
    console.log(`Found ${languageSelects.length} language selectors to hide`);

    languageSelects.forEach(select => {
        select.style.display = 'none';
    });

    // Hide language buttons
    const languageButtons = document.querySelectorAll('[onclick*="changeLanguage"]');
    languageButtons.forEach(button => {
        button.style.display = 'none';
    });

    // Translate the page
    translatePage();
    console.log('English translation applied');
});

// Add a fallback initialization for cases where the DOMContentLoaded event has already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded, initializing language immediately (English only)');
    setTimeout(function() {
        // Stub function for language change - always use English
        if (!window.changeLanguageAndReload) {
            window.changeLanguageAndReload = function(lang) {
                console.log('Language change requested, but only English is supported');
                // Always use English
                localStorage.setItem('agrifinpal-language', 'en');
            };
        }

        initLanguage();

        // Hide any language selectors
        const languageSelects = document.querySelectorAll('.language-select');
        console.log(`Found ${languageSelects.length} language selectors to hide (fallback)`);

        languageSelects.forEach(select => {
            select.style.display = 'none';
        });

        // Hide language buttons
        const languageButtons = document.querySelectorAll('[onclick*="changeLanguage"]');
        languageButtons.forEach(button => {
            button.style.display = 'none';
        });

        // Translate the page
        translatePage();
        console.log('English translation applied (fallback)');
    }, 100);
}
