/**
 * User Status Utilities
 *
 * This file contains utilities for handling user status in the admin dashboard.
 */

const UserStatus = {
    // Status constants
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    PENDING: 'PENDING',
    SUSPENDED: 'SUSPENDED',
    BANNED: 'BANNED',

    /**
     * Toggle a status dropdown and close all others
     * @param {string} userId - The user ID of the dropdown to toggle
     * @param {Event} event - The click event
     */
    toggleDropdown(userId, event) {
        // Prevent the event from bubbling up
        if (event) {
            event.stopPropagation();
        }

        const dropdownId = `status-dropdown-${userId}`;
        const currentDropdown = document.getElementById(dropdownId);

        if (!currentDropdown) {
            console.error(`Dropdown with ID ${dropdownId} not found`);
            return;
        }

        // Close all other dropdowns
        const allDropdowns = document.querySelectorAll('[id^="status-dropdown-"]');
        allDropdowns.forEach(dropdown => {
            if (dropdown.id !== dropdownId) {
                dropdown.classList.add('hidden');
            }
        });

        // Toggle the current dropdown
        currentDropdown.classList.toggle('hidden');
    },

    /**
     * Get the display name for a status
     * @param {string} status - The status value
     * @returns {string} The display name
     */
    getDisplayName(status) {
        switch (status) {
            case this.ACTIVE:
                return 'Active';
            case this.INACTIVE:
                return 'Inactive';
            case this.PENDING:
                return 'Pending';
            case this.SUSPENDED:
                return 'Suspended';
            case this.BANNED:
                return 'Banned';
            default:
                return status || 'Unknown';
        }
    },

    /**
     * Get the CSS classes for a status badge
     * @param {string} status - The status value
     * @returns {Object} Object with background and text color classes
     */
    getStatusClasses(status) {
        switch (status) {
            case this.ACTIVE:
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    dot: 'bg-green-500'
                };
            case this.INACTIVE:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    dot: 'bg-gray-500'
                };
            case this.PENDING:
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    dot: 'bg-yellow-500'
                };
            case this.SUSPENDED:
                return {
                    bg: 'bg-orange-100',
                    text: 'text-orange-800',
                    dot: 'bg-orange-500'
                };
            case this.BANNED:
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    dot: 'bg-red-500'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    dot: 'bg-gray-500'
                };
        }
    },

    /**
     * Render a status badge
     * @param {string} status - The status value
     * @returns {string} HTML for the status badge
     */
    renderStatusBadge(status) {
        const classes = this.getStatusClasses(status);
        return `
            <span class="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${classes.bg} ${classes.text}">
                <span class="w-2 h-2 rounded-full ${classes.dot} mr-1"></span>
                ${this.getDisplayName(status)}
            </span>
        `;
    },

    /**
     * Get the available status options for a dropdown
     * @param {string} userType - The type of user (admin, buyer, seller)
     * @returns {Array} Array of status options
     */
    getStatusOptions(userType) {
        // Base options that are common to all user types
        const baseOptions = [
            { value: this.ACTIVE, label: this.getDisplayName(this.ACTIVE) },
            { value: this.INACTIVE, label: this.getDisplayName(this.INACTIVE) }
        ];

        // Add additional options based on user type
        if (userType === 'seller') {
            return [
                ...baseOptions,
                { value: this.PENDING, label: this.getDisplayName(this.PENDING) },
                { value: this.SUSPENDED, label: this.getDisplayName(this.SUSPENDED) },
                { value: this.BANNED, label: this.getDisplayName(this.BANNED) }
            ];
        } else if (userType === 'buyer') {
            return [
                ...baseOptions,
                { value: this.SUSPENDED, label: this.getDisplayName(this.SUSPENDED) },
                { value: this.BANNED, label: this.getDisplayName(this.BANNED) }
            ];
        } else if (userType === 'admin') {
            return [
                ...baseOptions,
                { value: this.SUSPENDED, label: this.getDisplayName(this.SUSPENDED) }
            ];
        }

        // Default: return all options
        return [
            { value: this.ACTIVE, label: this.getDisplayName(this.ACTIVE) },
            { value: this.INACTIVE, label: this.getDisplayName(this.INACTIVE) },
            { value: this.PENDING, label: this.getDisplayName(this.PENDING) },
            { value: this.SUSPENDED, label: this.getDisplayName(this.SUSPENDED) },
            { value: this.BANNED, label: this.getDisplayName(this.BANNED) }
        ];
    },

    /**
     * Render a status dropdown
     * @param {string} userId - The user ID
     * @param {string} currentStatus - The current status
     * @param {string} userType - The type of user (admin, buyer, seller)
     * @returns {string} HTML for the status dropdown
     */
    renderStatusDropdown(userId, currentStatus, userType) {
        const options = this.getStatusOptions(userType);
        const classes = this.getStatusClasses(currentStatus);

        return `
            <div class="relative inline-block text-left">
                <div>
                    <button type="button"
                            class="inline-flex justify-between w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium ${classes.text} hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            id="status-menu-button-${userId}"
                            aria-expanded="false"
                            aria-haspopup="true"
                            onclick="event.preventDefault(); UserStatus.toggleDropdown('${userId}', event); return false;">
                        <span class="flex items-center">
                            <span class="w-2 h-2 rounded-full ${classes.dot} mr-1"></span>
                            ${this.getDisplayName(currentStatus)}
                        </span>
                        <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
                <div class="hidden origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                     role="menu"
                     aria-orientation="vertical"
                     aria-labelledby="status-menu-button-${userId}"
                     id="status-dropdown-${userId}"
                     tabindex="-1">
                    <div class="py-1" role="none">
                        ${options.map(option => {
                            const optionClasses = this.getStatusClasses(option.value);
                            return `
                                <a href="#"
                                   class="flex items-center px-4 py-2 text-sm ${option.value === currentStatus ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-100'}"
                                   role="menuitem"
                                   tabindex="-1"
                                   onclick="event.preventDefault(); updateUserStatus('${userId}', '${option.value}', '${userType}', event); return false;">
                                    <span class="w-2 h-2 rounded-full ${optionClasses.dot} mr-2"></span>
                                    ${option.label}
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
};

// Add isValidStatusForUserType to the UserStatus object
UserStatus.isValidStatusForUserType = function(status, userType) {
    const validOptions = this.getStatusOptions(userType);
    return validOptions.some(option => option.value === status);
};

// Override toggleDropdown to ensure it works correctly
UserStatus.toggleDropdown = function(userId, event) {
    console.log(`Toggle dropdown called for user ${userId}`);

    // Prevent the event from bubbling up and default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const dropdownId = `status-dropdown-${userId}`;
    const currentDropdown = document.getElementById(dropdownId);

    if (!currentDropdown) {
        console.error(`Dropdown with ID ${dropdownId} not found`);
        return;
    }

    // Check if dropdown is currently hidden
    const isHidden = currentDropdown.classList.contains('hidden');
    console.log(`Dropdown is currently ${isHidden ? 'hidden' : 'visible'}`);

    // Close all dropdowns
    const allDropdowns = document.querySelectorAll('[id^="status-dropdown-"]');
    allDropdowns.forEach(dropdown => {
        dropdown.classList.add('hidden');
    });

    // If it was hidden, show it (since we just hid it above)
    if (isHidden) {
        currentDropdown.classList.remove('hidden');
        console.log(`Showing dropdown for user ${userId}`);
    }
};

// Close all status dropdowns when clicking outside
document.addEventListener('click', function(event) {
    // Don't process if the click was on a status menu button or option
    // (those are handled by the toggleDropdown method)
    if (event.target.closest('[id^="status-menu-button-"]') ||
        event.target.closest('[id^="status-dropdown-"]')) {
        return;
    }

    // Close all dropdowns
    const dropdowns = document.querySelectorAll('[id^="status-dropdown-"]');
    dropdowns.forEach(dropdown => {
        dropdown.classList.add('hidden');
    });
});
