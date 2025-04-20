
export function createAdminApp() {
    return {
        showAddAdminModal: false,
        showAddSellerModal: false,
        showViewSellerModal: false,

        fetchAdmins() {
            console.log('Fetching administrators...');
            const adminsContainer = document.querySelector('[x-show="activeTab === \'admins\'"]');
            if (!adminsContainer) {
                console.error('Administrators container not found');
                return;
            }

            adminsContainer.innerHTML = `
                <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            `;

            const token = localStorage.getItem('token');

            fetch('/api/admin/admins', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch administrators');
                    return res.json();
                })
                .then(admins => {
                    const container = document.createElement('div');
                    container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                    // You can insert the full table HTML here as needed

                    adminsContainer.innerHTML = '';
                    adminsContainer.appendChild(container);

                    const addAdminBtn = adminsContainer.querySelector('#add-admin-btn');
                    if (addAdminBtn) {
                        addAdminBtn.addEventListener('click', () => this.openAddAdminModal());
                    }

                    const actionButtons = adminsContainer.querySelectorAll('button[data-admin-id]');
                    actionButtons.forEach(btn => {
                        const adminId = btn.getAttribute('data-admin-id');
                        const action = btn.getAttribute('data-action');

                        btn.addEventListener('click', () => {
                            if (action === 'delete') {
                                this.deleteAdmin(adminId);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    adminsContainer.innerHTML = `
                        <div class="bg-white shadow rounded-lg p-6 mx-4 sm:mx-6 lg:px-8">
                            <div class="text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                                <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load administrators</h3>
                                <p class="text-gray-500">${error.message}</p>
                            </div>
                        </div>
                    `;
                });
        },

        deleteAdmin(adminId) {
            console.log('Deleting admin:', adminId);
            // Replace with your actual logic and refresh list
            this.fetchAdmins();
        },

        openAddAdminModal() {
            this.showAddAdminModal = true;
            setTimeout(() => {
                ['admin-username', 'admin-fullname', 'admin-email', 'admin-password', 'admin-phone'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
            }, 100);
        },

        addAdmin() {
            const username = document.getElementById('admin-username').value.trim();
            const fullName = document.getElementById('admin-fullname').value.trim();
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            const phone = document.getElementById('admin-phone').value.trim();

            if (!username || !fullName || !email || !password) {
                alert('Please fill all fields');
                return;
            }

            console.log('Adding admin:', { username, fullName, email, password, phone });
            this.showAddAdminModal = false;
            this.showSuccessToast?.('Administrator added successfully');
        },

        openAddSellerModal() {
            this.showAddSellerModal = true;
            setTimeout(() => {
                ['seller-name', 'seller-owner', 'seller-email', 'seller-phone'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
            }, 100);
        },

        openViewSellerModal(sellerId) {
            this.showViewSellerModal = true;
        },

        addSeller() {
            const name = document.getElementById('seller-name').value.trim();
            const owner = document.getElementById('seller-owner').value.trim();
            const email = document.getElementById('seller-email').value.trim();
            const phone = document.getElementById('seller-phone').value.trim();
            const location = document.getElementById('seller-location')?.value.trim();
            const status = document.getElementById('seller-status')?.value.trim();

            if (!name || !owner || !email) {
                alert('Please fill in all required fields');
                return;
            }

            console.log('Adding seller:', { name, owner, email, phone, location, status });
            this.showAddSellerModal = false;
            this.showSuccessToast?.('Seller added successfully');
        },

        showSuccessToast(message) {
            AdminToast.success?.(message);
        },
        showErrorToast(message) {
            AdminToast.error?.(message);
        },
        showWarningToast(message) {
            AdminToast.warning?.(message);
        },
        showInfoToast(message) {
            AdminToast.info?.(message);
        }
    };
}
