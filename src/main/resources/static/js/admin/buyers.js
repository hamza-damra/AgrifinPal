function fetchBuyers() {
    console.log('Fetching buyers...');

    const buyersContainer = document.querySelector('[x-show="activeTab === \'buyers\'"]');
    if (!buyersContainer) {
        console.error('Buyers container not found');
        return;
    }

    buyersContainer.innerHTML = `
        <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    `;

    const token = localStorage.getItem('token');

    fetch('/api/admin/buyers', {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch buyers');
            }
            return response.json();
        })
        .then(buyers => {
            const container = document.createElement('div');
            container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

            const header = document.createElement('div');
            header.className = 'mb-6';
            header.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900">Buyers</h2>
                        <p class="text-sm text-gray-500 mt-1">Manage buyers and their accounts</p>
                    </div>
                </div>
            `;
            container.appendChild(header);

            const tableContainer = document.createElement('div');
            tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
            tableContainer.innerHTML = `
                <div class="overflow-x-auto">
                    <div class="py-2 align-middle inline-block min-w-full px-4">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${
                buyers.length > 0
                    ? buyers.map(buyer => `
                                            <tr>
                                                <td class="px-6 py-4 whitespace-nowrap">${buyer.fullName || 'N/A'}</td>
                                                <td class="px-6 py-4 whitespace-nowrap">${buyer.email || 'N/A'}</td>
                                                <td class="px-6 py-4 whitespace-nowrap">${buyer.status || 'active'}</td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <button class="text-blue-600" data-buyer-id="${buyer.userId}" data-action="view">View</button>
                                                    <button class="text-red-600" data-buyer-id="${buyer.userId}" data-action="delete">Delete</button>
                                                </td>
                                            </tr>
                                        `).join('')
                    : `
                                            <tr>
                                                <td colspan="4" class="px-6 py-12 whitespace-nowrap text-center">
                                                    <div class="flex flex-col items-center justify-center">
                                                        <i class="fas fa-users text-gray-300 text-5xl mb-4"></i>
                                                        <p class="text-lg font-medium text-gray-500 mb-1">No buyers registered yet</p>
                                                        <p class="text-sm text-gray-400">There are currently no buyers in the system</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        `
            }
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            container.appendChild(tableContainer);

            buyersContainer.innerHTML = '';
            buyersContainer.appendChild(container);

            const actionButtons = buyersContainer.querySelectorAll('button[data-buyer-id]');
            actionButtons.forEach(btn => {
                const buyerId = btn.getAttribute('data-buyer-id');
                const action = btn.getAttribute('data-action');
                btn.addEventListener('click', () => {
                    if (action === 'view') {
                        console.log('View buyer details:', buyerId);
                    } else if (action === 'delete') {
                        console.log('Delete buyer:', buyerId);
                    }
                });
            });

            const searchInput = document.getElementById('buyer-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const rows = buyersContainer.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const name = row.cells[0]?.textContent.toLowerCase();
                        const email = row.cells[1]?.textContent.toLowerCase();
                        row.style.display = name.includes(searchTerm) || email.includes(searchTerm) ? '' : 'none';
                    });
                });
            }

            const filterSelect = document.getElementById('buyer-filter');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    const filterValue = e.target.value.toLowerCase();
                    const rows = buyersContainer.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const statusText = row.cells[2]?.textContent.toLowerCase();
                        row.style.display = filterValue === 'all' || statusText.includes(filterValue) ? '' : 'none';
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error fetching buyers:', error);
            buyersContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 mx-4 sm:px-6 lg:px-8">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load buyers</h3>
                        <p class="text-gray-500 mb-4">${error.message}</p>
                        <button class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700" onclick="fetchBuyers()">
                            <i class="fas fa-sync-alt mr-2"></i> Try Again
                        </button>
                    </div>
                </div>
            `;
        });
}

// Example usage
const userType = 'buyer';
if (userType === 'buyer') {
    fetchBuyers();
}
