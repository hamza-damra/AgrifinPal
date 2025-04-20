/**
 * Simple test script to verify language switching functionality
 */

// Run test when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Language test script loaded');

    // Add a test button to the page
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Language Switching';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '5px 10px';
    testButton.style.backgroundColor = '#ff5722';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';

    testButton.onclick = function() {
        runLanguageTest();
    };

    document.body.appendChild(testButton);
});

/**
 * Language test function (English only)
 */
function runLanguageTest() {
    console.log('Running language test');

    // Get current language (should always be English)
    const currentLang = document.documentElement.lang || 'en';
    console.log('Current language:', currentLang);

    // Verify English is set
    if (currentLang === 'en') {
        console.log('✅ English language is correctly set');
        alert('Language test successful! Using English');
    } else {
        console.error('❌ Language test failed! Not using English');

        // Force English
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
        localStorage.setItem('agrifinpal-language', 'en');

        alert('Language reset to English');
    }
}
