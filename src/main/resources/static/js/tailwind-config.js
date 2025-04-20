/**
 * Common Tailwind CSS configuration for AgriFinPal
 * This script ensures consistent colors across all pages that use Tailwind CSS
 */
if (window.tailwind) {
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    green: {
                        50: '#f0fdf4',  // --secondary
                        100: '#dcfce7', // --green-100
                        500: '#22c55e', // --primary-light
                        600: '#166534', // --primary
                        700: '#14532d', // --primary-dark
                        800: '#166534', // --primary (same as 600 for backward compatibility)
                        900: '#14532d'  // --primary-dark (same as 700 for backward compatibility)
                    }
                }
            }
        }
    };
}
