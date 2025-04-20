const adminApp = {
    // ... other properties

    fetchOrders() {
        console.log('Fetching orders...');

        const ordersContainer = document.querySelector('[x-show="activeTab === \'orders\'"]');
        if (!ordersContainer) {
            console.error('Orders container not found');
            return;
        }

        ordersContainer.innerHTML = `
            <div class="flex justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        `;

        const token = localStorage.getItem('token');

        fetch('/api/admin/orders', {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch orders');
                return response.json();
            })
            .then(orders => {
                const container = document.createElement('div');
                container.className = 'space-y-6 px-4 sm:px-6 lg:px-8';

                const tableContainer = document.createElement('div');
                tableContainer.className = 'flex flex-col bg-white rounded-lg shadow-md overflow-hidden';
                tableContainer.innerHTML = `
                <div class="overflow-x-auto">
                    <div class="py-2 align-middle inline-block min-w-full px-4">
                        <div class="shadow-lg overflow-hidden border-b border-gray-200 sm:rounded-lg bg-white">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${orders.map(order => `
                                        <tr>
                                            <td class="px-6 py-4 whitespace-nowrap">${order.id}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${order.customerName}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">${new Date(order.date).toLocaleDateString()}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">$${order.total.toFixed(2)}</td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">${order.status}</span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button class="text-primary-600 hover:text-primary-900">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

                container.appendChild(tableContainer);
                ordersContainer.innerHTML = '';
                ordersContainer.appendChild(container);
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                ordersContainer.innerHTML = `
                <div class="bg-white shadow rounded-lg p-6 text-center">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
                    <p class="text-gray-500">${error.message}</p>
                    <button class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700" onclick="adminApp.fetchOrders()">
                        <i class="fas fa-sync-alt mr-2"></i> Try Again
                    </button>
                </div>
            `;
            });
    }
};