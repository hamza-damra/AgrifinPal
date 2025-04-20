/**
 * Toast Notification System for Admin Panel
 */

const AdminToast = {
    container: null,

    init() {
        // Create toast container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(this.container);
        }

        // If the container was removed from the DOM, re-add it
        if (!document.getElementById('toast-container')) {
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast flex items-center p-4 rounded-lg shadow-lg bg-white border-l-4';

        // Set border color based on type
        switch (type) {
            case 'success':
                toast.classList.add('border-green-500');
                break;
            case 'error':
                toast.classList.add('border-red-500');
                break;
            case 'warning':
                toast.classList.add('border-yellow-500');
                break;
            default:
                toast.classList.add('border-blue-500');
        }

        // Create icon based on type
        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle text-green-500';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle text-red-500';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle text-yellow-500';
                break;
            default:
                iconClass = 'fas fa-info-circle text-blue-500';
        }

        // Set toast content
        toast.innerHTML = `
            <div class="flex-shrink-0 mr-3">
                <i class="${iconClass} text-lg"></i>
            </div>
            <div class="flex-grow">
                <p class="text-sm text-gray-800">${message}</p>
            </div>
            <button class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-500 focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add toast to container
        this.container.appendChild(toast);

        // Add click event to close button
        const closeButton = toast.querySelector('button');
        closeButton.addEventListener('click', () => {
            this.close(toast);
        });

        // Auto-close after duration
        setTimeout(() => {
            this.close(toast);
        }, duration);

        return toast;
    },

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    error(message, duration = 3000) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },

    close(toast) {
        // Add fade-out animation
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Make AdminToast globally available
window.AdminToast = AdminToast;

// Initialize AdminToast when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AdminToast.init();
});
