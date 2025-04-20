/**
 * Image Fallback System
 *
 * This script provides fallback images for missing profile pictures and icons
 * in the admin dashboard and throughout the application.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize image fallback system
    initImageFallback();

    // Log that the image fallback system is active
    console.log('Image fallback system initialized');
});

/**
 * Initialize the image fallback system
 */
function initImageFallback() {
    // Fix all images that fail to load
    document.addEventListener('error', function(event) {
        if (event.target.tagName.toLowerCase() === 'img') {
            handleImageError(event.target);
        }
    }, true);

    // Also proactively replace placeholder images in the admin dashboard
    setTimeout(proactivelyReplaceImages, 500);
}

/**
 * Handle image loading errors by providing appropriate fallbacks
 * @param {HTMLImageElement} img - The image element that failed to load
 */
function handleImageError(img) {
    const imgSrc = img.src;
    const parentElement = img.parentElement;

    // Check if it's a default avatar image
    if (imgSrc.includes('default-avatar.png')) {
        img.src = '/images/buyer-placeholder.svg';
        console.log('Replaced default-avatar.png with buyer-placeholder.svg');
    }
    // Check if it's a default store image
    else if (imgSrc.includes('default-store.png')) {
        img.src = '/images/store-placeholder.svg';
        console.log('Replaced default-store.png with store-placeholder.svg');
    }
    // Check if it's a seller image
    else if (imgSrc.includes('seller') || (parentElement && parentElement.closest('[data-seller-id]'))) {
        img.src = '/images/seller-placeholder.svg';
        console.log('Replaced seller image with seller-placeholder.svg');
    }
    // Check if it's an admin image
    else if (imgSrc.includes('admin') ||
            (parentElement && parentElement.closest('[data-admin-id]')) ||
            (window.location.pathname.includes('/admin/') && !imgSrc.includes('buyer') && !imgSrc.includes('seller') && !imgSrc.includes('store'))) {
        img.src = '/images/admin-placeholder.svg';
        console.log('Replaced admin image with admin-placeholder.svg');
    }
    // Check if it's a category image
    else if (imgSrc.includes('category') ||
            imgSrc.includes('fruits.jpg') ||
            imgSrc.includes('vegetables.jpg') ||
            imgSrc.includes('herbs.jpg') ||
            imgSrc.includes('dairy.jpg') ||
            imgSrc.includes('olive-oil.jpg') ||
            imgSrc.includes('seeds.jpg') ||
            imgSrc.includes('honey.jpg') ||
            imgSrc.includes('nuts.jpg')) {
        img.src = '/images/category-placeholder.svg';
        console.log('Replaced category image with category-placeholder.svg');
    }
    // Generic fallback
    else {
        img.src = '/images/default-profile.svg';
        console.log('Replaced image with default-profile.svg');
    }
}

/**
 * Proactively replace placeholder images in the admin dashboard
 */
function proactivelyReplaceImages() {
    // Replace admin images
    const adminImages = document.querySelectorAll('.admin-profile-image, [data-admin-id] img');
    adminImages.forEach(img => {
        if (img.src.includes('default-avatar.png') || !img.src || img.src === '') {
            img.src = '/images/admin-placeholder.svg';
        }
    });

    // Replace buyer images
    const buyerImages = document.querySelectorAll('[data-buyer-id] img');
    buyerImages.forEach(img => {
        if (img.src.includes('default-avatar.png') || !img.src || img.src === '') {
            img.src = '/images/buyer-placeholder.svg';
        }
    });

    // Replace seller images
    const sellerImages = document.querySelectorAll('[data-seller-id] img');
    sellerImages.forEach(img => {
        if (img.src.includes('default-avatar.png') || !img.src || img.src === '') {
            img.src = '/images/seller-placeholder.svg';
        }
    });

    // Replace store images
    const storeImages = document.querySelectorAll('.store-logo, .store-image');
    storeImages.forEach(img => {
        if (img.src.includes('default-store.png') || !img.src || img.src === '') {
            img.src = '/images/store-placeholder.svg';
        }
    });

    // Replace category images
    const categoryImages = document.querySelectorAll('.category-image, [data-category-id] img');
    categoryImages.forEach(img => {
        if (!img.src || img.src === '' ||
            img.src.includes('fruits.jpg') ||
            img.src.includes('vegetables.jpg') ||
            img.src.includes('herbs.jpg') ||
            img.src.includes('dairy.jpg') ||
            img.src.includes('olive-oil.jpg') ||
            img.src.includes('seeds.jpg') ||
            img.src.includes('honey.jpg') ||
            img.src.includes('nuts.jpg')) {
            img.src = '/images/category-placeholder.svg';
        }
    });
}
