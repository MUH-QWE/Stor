// Admin Panel for LUXE Store
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.orders = [];
        this.products = [];
        this.customers = [];
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        this.loadData();
        this.setupEventListeners();
        this.renderDashboard();
        this.setupCharts();
        
        if (DEBUG_MODE) {
            console.log('Admin panel initialized');
        }
    }

    async checkAdminAccess() {
        // Check if user is logged in as admin
        const userData = localStorage.getItem('luxe-user');
        
        if (!userData) {
            // Redirect to login if not logged in
            window.location.href = 'Login.html';
            return;
        }
        
        try {
            this.currentUser = JSON.parse(userData);
            
            // Check if user has admin role
            if (this.currentUser.role !== 'admin' && !DEVELOPER_MODE) {
                this.showNotification('Access denied. Admin privileges required.', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            
            // Update admin UI with user info
            this.updateAdminUI();
            
        } catch (error) {
            console.error('Error checking admin access:', error);
            window.location.href = 'Login.html';
        }
    }

    updateAdminUI() {
        // Update user info in header
        const userName = document.querySelector('.user-name');
        const userRole = document.querySelector('.user-role');
        
        if (userName) {
            userName.textContent = this.currentUser.name || 'Admin User';
        }
        
        if (userRole) {
            userRole.textContent = this.currentUser.role === 'admin' ? 'Administrator' : 'User';
        }
        
        // Update last login time
        const lastLogin = document.querySelector('.last-login');
        if (lastLogin) {
            const now = new Date();
            lastLogin.textContent = `Last login: ${now.toLocaleDateString()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    }

    async loadData() {
        try {
            // Load sample data for demo
            this.loadSampleData();
            
            if (USE_PHP_BACKEND) {
                // In a real app, load from API
                await this.loadFromAPI();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample orders
        this.orders = Array.from({ length: 12 }, (_, i) => ({
            id: `ORD-${1000 + i}`,
            customer: `Customer ${i + 1}`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 500) + 50,
            status: ['pending', 'processing', 'shipped', 'delivered'][i % 4],
            items: Math.floor(Math.random() * 5) + 1
        }));
        
        // Sample products
        this.products = Array.from({ length: 45 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            category: ['Men', 'Women', 'Accessories', 'Shoes'][i % 4],
            price: Math.floor(Math.random() * 200) + 30,
            stock: Math.floor(Math.random() * 100),
            status: i % 10 === 0 ? 'out-of-stock' : 'in-stock',
            sales: Math.floor(Math.random() * 100)
        }));
        
        // Sample customers
        this.customers = Array.from({ length: 128 }, (_, i) => ({
            id: i + 1,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            joinDate: new Date(Date.now() - i * 86400000 * 30).toISOString().split('T')[0],
            orders: Math.floor(Math.random() * 10),
            totalSpent: Math.floor(Math.random() * 1000) + 50
        }));
    }

    async loadFromAPI() {
        // This would load data from your PHP backend
        // For now, we'll use sample data
        return Promise.resolve();
    }

    setupEventListeners() {
        // Menu navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('href').replace('#', '');
                this.navigateToSection(section);
            });
        });
        
        // Refresh button
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Date range selector
        const dateRange = document.querySelector('.date-range');
        if (dateRange) {
            dateRange.addEventListener('click', () => this.showDateRangePicker());
        }
        
        // Chart filters
        const chartFilters = document.querySelectorAll('.chart-filter');
        chartFilters.forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.updateCharts();
            });
        });
        
        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => this.showAddProductForm());
        }
        
        // Quick action buttons
        const actionButtons = document.querySelectorAll('.action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.action-btn').querySelector('span').textContent;
                this.handleQuickAction(action);
            });
        });
        
        // View all links
        const viewAllLinks = document.querySelectorAll('.view-all');
        viewAllLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').replace('#', '');
                this.navigateToSection(section);
            });
        });
        
        // Logout
        const logoutLink = document.querySelector('.logout');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    navigateToSection(section) {
        this.currentSection = section;
        
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${section}`) {
                item.classList.add('active');
            }
        });
        
        // Update page title
        document.title = `${this.capitalizeFirstLetter(section)} - LUXE Admin`;
        
        // Load section content
        this.loadSectionContent(section);
    }

    loadSectionContent(section) {
        const contentArea = document.querySelector('.admin-content');
        if (!contentArea) return;
        
        // Show loading state
        contentArea.innerHTML = '<div class="loading">Loading...</div>';
        
        // Load content based on section
        setTimeout(() => {
            switch (section) {
                case 'dashboard':
                    this.renderDashboard();
                    break;
                case 'products':
                    this.renderProducts();
                    break;
                case 'orders':
                    this.renderOrders();
                    break;
                case 'customers':
                    this.renderCustomers();
                    break;
                case 'analytics':
                    this.renderAnalytics();
                    break;
                case 'add-product':
                    this.renderAddProductForm();
                    break;
                default:
                    this.renderDashboard();
            }
        }, 300);
    }

    renderDashboard() {
        const contentArea = document.querySelector('.admin-content');
        if (!contentArea) return;
        
        // Calculate stats
        const totalRevenue = this.orders.reduce((sum, order) => sum + order.amount, 0);
        const totalOrders = this.orders.length;
        const totalCustomers = this.customers.length;
        const totalProducts = this.products.length;
        
        // Update stat cards
        document.querySelector('.stat-value.revenue').textContent = `$${totalRevenue.toLocaleString()}`;
        document.querySelector('.stat-value.orders').textContent = totalOrders.toLocaleString();
        document.querySelector('.stat-value.customers').textContent = totalCustomers.toLocaleString();
        document.querySelector('.stat-value.products').textContent = totalProducts.toLocaleString();
        
        // Render recent orders table
        this.renderRecentOrders();
        
        // Render products table
        this.renderProductsTable();
        
        // Update charts
        this.updateCharts();
    }

    renderRecentOrders() {
        const tableBody = document.getElementById('recent-orders');
        if (!tableBody) return;
        
        // Get recent 5 orders
        const recentOrders = this.orders.slice(0, 5);
        
        let tableHTML = '';
        recentOrders.forEach(order => {
            tableHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${order.date}</td>
                    <td>$${order.amount.toFixed(2)}</td>
                    <td><span class="status ${order.status}">${this.capitalizeFirstLetter(order.status)}</span></td>
                    <td>
                        <button class="btn-action view" data-id="${order.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" data-id="${order.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
        // Add event listeners to action buttons
        this.setupTableActions();
    }

    renderProductsTable() {
        const tableBody = document.getElementById('products-table');
        if (!tableBody) return;
        
        // Get first 10 products
        const displayedProducts = this.products.slice(0, 10);
        
        let tableHTML = '';
        displayedProducts.forEach(product => {
            tableHTML += `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price.toFixed(2)}</td>
                    <td>${product.stock}</td>
                    <td><span class="status ${product.status}">${this.capitalizeFirstLetter(product.status.replace('-', ' '))}</span></td>
                    <td>
                        <button class="btn-action view" data-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action edit" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
        
        // Add event listeners to action buttons
        this.setupTableActions();
    }

    setupTableActions() {
        // View buttons
        document.querySelectorAll('.btn-action.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.viewItem(id);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.btn-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.editItem(id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.btn-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.deleteItem(id);
            });
        });
    }

    viewItem(id) {
        // Find item by ID
        const order = this.orders.find(o => o.id === id);
        const product = this.products.find(p => p.id == id);
        
        if (order) {
            this.showOrderDetails(order);
        } else if (product) {
            this.showProductDetails(product);
        }
    }

    editItem(id) {
        this.showNotification(`Editing item ${id}...`, 'info');
        // In a real app, this would open an edit form
    }

    deleteItem(id) {
        if (confirm(`Are you sure you want to delete item ${id}?`)) {
            this.showNotification(`Item ${id} deleted`, 'success');
            // In a real app, this would make an API call to delete
        }
    }

    showOrderDetails(order) {
        const details = `
            Order ID: ${order.id}
            Customer: ${order.customer}
            Date: ${order.date}
            Amount: $${order.amount.toFixed(2)}
            Status: ${order.status}
            Items: ${order.items}
        `;
        
        alert(details);
    }

    showProductDetails(product) {
        const details = `
            Product ID: ${product.id}
            Name: ${product.name}
            Category: ${product.category}
            Price: $${product.price.toFixed(2)}
            Stock: ${product.stock}
            Status: ${product.status}
            Sales: ${product.sales}
        `;
        
        alert(details);
    }

    setupCharts() {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeRevenueChart();
            this.initializeProductsChart();
        }
    }

    initializeRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;
        
        // Sample revenue data for last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenueData = months.map(() => Math.floor(Math.random() * 30000) + 10000);
        
        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    initializeProductsChart() {
        const ctx = document.getElementById('productsChart');
        if (!ctx) return;
        
        // Sample product categories data
        const categories = ['Men', 'Women', 'Accessories', 'Shoes', 'Other'];
        const salesData = categories.map(() => Math.floor(Math.random() * 100) + 20);
        
        this.productsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Sales',
                    data: salesData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateCharts() {
        // Update charts based on filters
        if (this.revenueChart) {
            // In a real app, this would update with filtered data
            this.revenueChart.update();
        }
        
        if (this.productsChart) {
            this.productsChart.update();
        }
    }

    refreshData() {
        this.showNotification('Refreshing data...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            this.loadSampleData();
            this.renderDashboard();
            this.showNotification('Data refreshed successfully', 'success');
        }, 1000);
    }

    showDateRangePicker() {
        // In a real app, this would show a date picker
        const range = prompt('Enter date range (e.g., "2024-01-01 to 2024-01-31"):');
        if (range) {
            this.showNotification(`Date range set to: ${range}`, 'info');
        }
    }

    showAddProductForm() {
        const formHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Add New Product</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="add-product-form">
                            <div class="form-group">
                                <label>Product Name</label>
                                <input type="text" id="product-name" required>
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <select id="product-category" required>
                                    <option value="">Select Category</option>
                                    <option value="men">Men's Fashion</option>
                                    <option value="women">Women's Fashion</option>
                                    <option value="accessories">Accessories</option>
                                    <option value="shoes">Shoes</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Price ($)</label>
                                <input type="number" id="product-price" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label>Stock Quantity</label>
                                <input type="number" id="product-stock" required>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="product-description" rows="3"></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Add Product</button>
                                <button type="button" class="btn-secondary cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', formHTML);
        
        // Add event listeners
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.querySelector('.modal-overlay').remove();
        });
        
        document.querySelector('.cancel').addEventListener('click', () => {
            document.querySelector('.modal-overlay').remove();
        });
        
        document.getElementById('add-product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddProduct();
        });
        
        // Close modal when clicking outside
        document.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    handleAddProduct() {
        // Get form values
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const stock = parseInt(document.getElementById('product-stock').value);
        const description = document.getElementById('product-description').value;
        
        // Validate
        if (!name || !category || isNaN(price) || isNaN(stock)) {
            this.showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Create new product
        const newProduct = {
            id: this.products.length + 1,
            name: name,
            category: category,
            price: price,
            stock: stock,
            description: description,
            status: stock > 0 ? 'in-stock' : 'out-of-stock',
            sales: 0
        };
        
        // Add to products array (in real app, this would be an API call)
        this.products.unshift(newProduct);
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        // Show success message
        this.showNotification(`Product "${name}" added successfully`, 'success');
        
        // Refresh products table
        this.renderProductsTable();
    }

    handleQuickAction(action) {
        switch (action) {
            case 'Send Newsletter':
                this.sendNewsletter();
                break;
            case 'Create Discount':
                this.createDiscount();
                break;
            case 'Generate Report':
                this.generateReport();
                break;
            case 'Export Data':
                this.exportData();
                break;
            default:
                this.showNotification(`Action "${action}" clicked`, 'info');
        }
    }

    sendNewsletter() {
        this.showNotification('Newsletter feature would open here', 'info');
    }

    createDiscount() {
        this.showNotification('Discount creation feature would open here', 'info');
    }

    generateReport() {
        this.showNotification('Generating report...', 'info');
        // In a real app, this would generate and download a report
        setTimeout(() => {
            this.showNotification('Report generated successfully', 'success');
        }, 2000);
    }

    exportData() {
        this.showNotification('Exporting data...', 'info');
        // In a real app, this would export data as CSV/Excel
        setTimeout(() => {
            this.showNotification('Data exported successfully', 'success');
        }, 1500);
    }

    logout() {
        // Clear admin session
        localStorage.removeItem('luxe-user');
        localStorage.removeItem('luxe-token');
        sessionStorage.clear();
        
        this.showNotification('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'Login.html';
        }, 1000);
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize admin panel
function initAdminPanel() {
    if (document.querySelector('[data-page="admin"]')) {
        window.adminPanel = new AdminPanel();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminPanel, initAdminPanel };
}