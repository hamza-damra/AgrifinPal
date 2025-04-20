/**
 * User Status Manager
 * 
 * This script provides functions for managing user status in the admin dashboard.
 */

// Create a global function for updating user status
window.updateUserStatus = function(userId, status, userType) {
    if (!userId || !status || !userType) {
        console.error('Missing required parameters for updateUserStatus');
        return;
    }
    
    console.log(`Updating ${userType} status: ${userId} to ${status}`);

    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Determine the API endpoint based on user type
    let endpoint;
    if (userType === 'admin') {
        endpoint = `/api/admin/admins/${userId}/status?status=${status}`;
    } else if (userType === 'buyer' || userType === 'seller') {
        endpoint = `/api/admin/users/${userId}/update-status?status=${status}`;
    } else {
        console.error('Invalid user type:', userType);
        return;
    }
    
    // Show loading state
    const statusCell = document.querySelector(`#status-menu-button-${userId}`);
    if (!statusCell) {
        console.error(`Could not find status button for user ${userId}`);
        return;
    }
    
    const statusCellParent = statusCell.closest('td');
    const originalContent = statusCellParent.innerHTML;
    statusCellParent.innerHTML = `
        <div class="flex justify-center items-center py-2">
            <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    `;
    
    // Call API to update status
    fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to update ${userType} status`);
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        if (window.AdminToast) {
            AdminToast.success(data.message || `${userType.charAt(0).toUpperCase() + userType.slice(1)} status updated successfully`);
        } else {
            console.log('Success:', data.message || `${userType.charAt(0).toUpperCase() + userType.slice(1)} status updated successfully`);
        }
        
        // Refresh the page to show updated status
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    })
    .catch(error => {
        console.error(`Error updating ${userType} status:`, error);
        
        if (window.AdminToast) {
            AdminToast.error(`Failed to update ${userType} status`);
        } else {
            console.error(`Failed to update ${userType} status`);
        }
        
        // Restore original content
        statusCellParent.innerHTML = originalContent;
    });
};
