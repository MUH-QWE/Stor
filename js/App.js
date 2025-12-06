// ============================================
// LUXE STORE - MAIN APPLICATION (DUAL MODE)
// ============================================

window.LuxeApp = {
    // ==================== CONFIGURATION ====================
    config: {
        // Mode detection
        useDatabase: false,
        usePHPBackend: false,
        mode: 'local',
        
        // Application settings
        developerMode: true,
        debugMode: true,
        offlineMode: true,
        
        // API
        apiBaseUrl: 'luxe_api.php',
        apiVersion: '1.0',
        
        // Defaults
        defaultTheme: 'spring',
        cartKey: 'luxe_cart',
        userKey: 'luxe_user',
        tokenKey: 'luxe_token'
    },
    
    // ==================== STATE ====================
    state: {
        // User
        user: null,
        token: null,
        isAuthenticated: false,
        
        // Cart
        cart: [],
        cartCount: 0,
        cartTotal: 0,
        
        // Theme
        theme: 'spring',
        
        // Current page
        currentPage: 'home',
        
        // Loading state
        isLoading: false,
        
        // API mode
        apiMode: 'unknown'
    },
    
    // ==================== INITIALIZATION ====================
    init: async function() {
        console.log('🚀 LUXE Store Application Initializing...');
        
        try {
            // Load configuration
            this.loadConfig();
            
            // Detect API mode
            await this.detectApiMode();
            
            // Initialize core systems
            await this.initCore();
            
            // Load initial data
            await this.loadInitialData();
            
            // Setup global events
            this.setupGlobalEvents();
            
            // Initialize page
            this.initPage();
            
            console.log(`✅ LUXE Store Ready! Mode: ${this.config.mode.toUpperCase()}`);
            
            // Show mode indicator in debug
            if (this.config.debugMode) {
                this.showModeIndicator();
            }
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.showNotification('Application failed to load. Please refresh.', 'error');
        }
    },
    
    // Load configuration
    loadConfig: function() {
        // Load from global variables
        if (typeof DEVELOPER_MODE !== 'undefined') {
            this.config.developerMode = DEVELOPER_MODE;
        }
        if (typeof DEBUG_MODE !== 'undefined') {
            this.config.debugMode = DEBUG_MODE;
        }
        if (typeof OFFLINE_MODE !== 'undefined') {
            this.config.offlineMode = OFFLINE_MODE;
        }
        
        // Load saved config from localStorage
        if (this.config.developerMode) {
            const savedConfig = localStorage.getItem('luxe_config');
            if (savedConfig) {
                try {
                    Object.assign(this.config, JSON.parse(savedConfig));
                } catch (e) {
                    console.error('Error loading config:', e);
                }
            }
        }
        
        if (this.config.debugMode) {
            console.log('📋 App Configuration:', this.config);
        }
    },
    
    // Detect API mode (Database vs Local)
    detectApiMode: async function() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}?endpoint=mode`);
            const data = await response.json();
            
            this.config.useDatabase = data.useDatabase || false;
            this.config.usePHPBackend = this.config.useDatabase;
            this.config.mode = data.mode || 'local';
            this.state.apiMode = this.config.mode;
            
            if (this.config.debugMode) {
                console.log(`🔧 API Mode Detected: ${this.config.mode.toUpperCase()}`);
                console.log('📡 API Response:', data);
            }
            
        } catch (error) {
            console.warn('Mode detection failed, using local mode:', error);
            this.config.useDatabase = false;
            this.config.usePHPBackend = false;
            this.config.mode = 'local';
            this.state.apiMode = 'local';
        }
    },
    
    // Initialize core systems
    initCore: async function() {
        // Theme System
        this.initThemeSystem();
        
        // Cart System
        await this.initCartSystem();
        
        // User System
        await this.initUserSystem();
        
        // Navigation
        this.initNavigation();
        
        // Error Handling
        this.initErrorHandling();
        
        // UI Components
        this.initUIComponents();
    },
    
    // ==================== THEME SYSTEM ====================
    initThemeSystem: function() {
        // Load saved theme
        const savedTheme = localStorage.getItem('luxe_theme') || this.config.defaultTheme;
        this.state.theme = savedTheme;
        
        // Apply theme
        this.applyTheme(this.state.theme);
        
        // Setup theme selector
        this.setupThemeSelector();
        
        // Listen for theme changes
        document.addEventListener('themeChange', (e) => {
            this.state.theme = e.detail.theme;
            if (this.config.debugMode) {
                console.log('🎨 Theme changed to:', this.state.theme);
            }
        });
    },
    
    applyTheme: function(theme) {
        // Validate theme
        const validThemes = ['spring', 'summer', 'autumn', 'winter'];
        if (!validThemes.includes(theme)) {
            theme = this.config.defaultTheme;
        }
        
        // Update DOM
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme selector
        const themeSelect = document.getElementById('admin-theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        
        // Save to localStorage
        localStorage.setItem('luxe_theme', theme);
        this.state.theme = theme;
        
        // Dispatch event
        const event = new CustomEvent('themeChange', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
        
        if (this.config.debugMode) {
            console.log('Theme applied:', theme);
        }
    },
    
    setupThemeSelector: function() {
        const themeSelect = document.getElementById('admin-theme-select');
        if (themeSelect) {
            // Set current theme
            themeSelect.value = this.state.theme;
            
            // Add change event
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        }
    },
    
    // ==================== CART SYSTEM ====================
    initCartSystem: async function() {
        if (this.config.useDatabase && this.state.isAuthenticated) {
            // Load cart from database
            await this.loadCartFromAPI();
        } else {
            // Load cart from localStorage
            this.loadCartFromLocalStorage();
        }
        
        // Update UI
        this.updateCartUI();
        
        // Listen for cart updates
        this.setupCartListeners();
    },
    
    loadCartFromLocalStorage: function() {
        try {
            const cartData = localStorage.getItem(this.config.cartKey);
            this.state.cart = cartData ? JSON.parse(cartData) : [];
            this.calculateCartTotals();
            
            if (this.config.debugMode && this.state.cart.length > 0) {
                console.log('🛒 Cart loaded from localStorage:', this.state.cart);
            }
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            this.state.cart = [];
        }
    },
    
    async loadCartFromAPI() {
        if (!this.state.token) return;
        
        try {
            const response = await this.apiRequest('cart', 'GET', null, true);
            if (response.success) {
                this.state.cart = response.cart || [];
                this.calculateCartTotals();
                
                if (this.config.debugMode) {
                    console.log('🛒 Cart loaded from API:', this.state.cart);
                }
            }
        } catch (error) {
            console.error('Error loading cart from API:', error);
            this.state.cart = [];
        }
    },
    
    calculateCartTotals: function() {
        this.state.cartCount = this.state.cart.reduce((total, item) => total + (item.quantity || 1), 0);
        this.state.cartTotal = this.state.cart.reduce((total, item) => {
            return total + (item.price || 0) * (item.quantity || 1);
        }, 0);
    },
    
    updateCartUI: function() {
        // Update cart count
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = this.state.cartCount;
            element.style.display = this.state.cartCount > 0 ? 'flex' : 'none';
        });
        
        // Update cart total if element exists
        const cartTotalElement = document.getElementById('cart-total');
        if (cartTotalElement) {
            cartTotalElement.textContent = `$${this.state.cartTotal.toFixed(2)}`;
        }
    },
    
    setupCartListeners: function() {
        // Listen for localStorage changes (for multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.cartKey) {
                this.loadCartFromLocalStorage();
                this.updateCartUI();
            }
        });
        
        // Custom event for cart updates
        document.addEventListener('cartUpdated', () => {
            this.updateCartUI();
        });
    },
    
    // Add item to cart
    async addToCart(product, quantity = 1, options = {}) {
        if (!product || !product.id) {
            this.showNotification('Invalid product', 'error');
            return false;
        }
        
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || 'images/product-placeholder.jpg',
            quantity: quantity,
            ...options
        };
        
        if (this.config.useDatabase && this.state.isAuthenticated) {
            // Add to database cart
            return await this.addToCartAPI(cartItem);
        } else {
            // Add to localStorage cart
            return this.addToCartLocal(cartItem);
        }
    },
    
    addToCartLocal: function(cartItem) {
        // Check if item already exists
        const existingIndex = this.state.cart.findIndex(item => 
            item.id === cartItem.id && 
            item.size === cartItem.size && 
            item.color === cartItem.color
        );
        
        if (existingIndex > -1) {
            // Update quantity
            this.state.cart[existingIndex].quantity += cartItem.quantity;
        } else {
            // Add new item
            this.state.cart.push(cartItem);
        }
        
        // Save to localStorage
        localStorage.setItem(this.config.cartKey, JSON.stringify(this.state.cart));
        
        // Update totals and UI
        this.calculateCartTotals();
        this.updateCartUI();
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('cartUpdated'));
        
        this.showNotification(`${cartItem.name} added to cart!`, 'success');
        return true;
    },
    
    async addToCartAPI(cartItem) {
        try {
            const response = await this.apiRequest('cart', 'POST', {
                product_id: cartItem.id,
                quantity: cartItem.quantity,
                size: cartItem.size,
                color: cartItem.color
            }, true);
            
            if (response.success) {
                // Reload cart from API
                await this.loadCartFromAPI();
                this.updateCartUI();
                
                this.showNotification(response.message || 'Item added to cart', 'success');
                return true;
            }
        } catch (error) {
            console.error('Error adding to cart via API:', error);
            this.showNotification('Failed to add item to cart', 'error');
            return false;
        }
    },
    
    // Remove item from cart
    async removeFromCart(itemId, size = null, color = null) {
        if (this.config.useDatabase && this.state.isAuthenticated) {
            return await this.removeFromCartAPI(itemId, size, color);
        } else {
            return this.removeFromCartLocal(itemId, size, color);
        }
    },
    
    removeFromCartLocal: function(itemId, size, color) {
        const initialLength = this.state.cart.length;
        
        this.state.cart = this.state.cart.filter(item => 
            !(item.id === itemId && item.size === size && item.color === color)
        );
        
        if (this.state.cart.length < initialLength) {
            // Save to localStorage
            localStorage.setItem(this.config.cartKey, JSON.stringify(this.state.cart));
            
            // Update totals and UI
            this.calculateCartTotals();
            this.updateCartUI();
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('cartUpdated'));
            
            this.showNotification('Item removed from cart', 'success');
            return true;
        }
        
        return false;
    },
    
    // ==================== USER SYSTEM ====================
    initUserSystem: async function() {
        // Load user data
        await this.loadUserData();
        
        // Update UI based on auth state
        this.updateAuthUI();
    },
    
    async loadUserData() {
        // Load token
        this.state.token = localStorage.getItem(this.config.tokenKey) || 
                          sessionStorage.getItem(this.config.tokenKey);
        
        // Load user data
        const userData = localStorage.getItem(this.config.userKey) || 
                        sessionStorage.getItem(this.config.userKey);
        
        if (userData) {
            try {
                this.state.user = JSON.parse(userData);
                this.state.isAuthenticated = true;
                
                if (this.config.debugMode) {
                    console.log('👤 User loaded:', this.state.user);
                }
                
                // Validate token with API if using database
                if (this.config.useDatabase && this.state.token) {
                    await this.validateToken();
                }
                
            } catch (e) {
                console.error('Error parsing user data:', e);
                this.logout();
            }
        }
    },
    
    async validateToken() {
        try {
            const response = await this.apiRequest('auth', 'GET', { action: 'check' }, true);
            
            if (!response.success) {
                // Token invalid, logout
                this.logout();
                this.showNotification('Session expired. Please login again.', 'warning');
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            // Don't logout on network errors
        }
    },
    
    updateAuthUI: function() {
        const loginLink = document.querySelector('a[href="Login.html"]');
        if (!loginLink) return;
        
        if (this.state.isAuthenticated && this.state.user) {
            // User is logged in
            loginLink.textContent = this.state.user.name || 'My Account';
            loginLink.href = '#profile';
            loginLink.onclick = (e) => {
                e.preventDefault();
                this.showProfile();
            };
            
            // Add logout option if not exists
            if (!loginLink.parentNode.querySelector('.logout-link')) {
                const logoutItem = document.createElement('li');
                logoutItem.innerHTML = '<a href="#" class="logout-link">Logout</a>';
                loginLink.parentNode.appendChild(logoutItem);
                
                // Add logout event
                document.querySelector('.logout-link').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            // User is not logged in
            loginLink.textContent = 'Login';
            loginLink.href = 'Login.html';
            loginLink.onclick = null;
            
            // Remove logout option
            const logoutItem = loginLink.parentNode.querySelector('.logout-link');
            if (logoutItem) {
                logoutItem.remove();
            }
        }
    },
    
    // Login user
    async login(email, password, remember = false) {
        try {
            const response = await this.apiRequest('auth', 'POST', {
                action: 'login',
                email: email,
                password: password,
                remember: remember
            });
            
            if (response.success && response.user) {
                // Store user data
                this.state.user = response.user;
                this.state.token = response.token;
                this.state.isAuthenticated = true;
                
                // Store in storage
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem(this.config.userKey, JSON.stringify(response.user));
                if (response.token) {
                    storage.setItem(this.config.tokenKey, response.token);
                }
                
                // Update UI
                this.updateAuthUI();
                
                // Load user's cart from API if using database
                if (this.config.useDatabase) {
                    await this.loadCartFromAPI();
                }
                
                this.showNotification('Login successful!', 'success');
                return true;
            } else {
                this.showNotification(response.error || 'Login failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
            return false;
        }
    },
    
    // Register user
    async register(name, email, password) {
        try {
            const response = await this.apiRequest('auth', 'POST', {
                action: 'register',
                name: name,
                email: email,
                password: password
            });
            
            if (response.success) {
                this.showNotification('Registration successful!', 'success');
                return true;
            } else {
                this.showNotification(response.error || 'Registration failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
            return false;
        }
    },
    
    // Logout user
    logout: function() {
        // Clear state
        this.state.user = null;
        this.state.token = null;
        this.state.isAuthenticated = false;
        
        // Clear storage
        localStorage.removeItem(this.config.userKey);
        localStorage.removeItem(this.config.tokenKey);
        sessionStorage.removeItem(this.config.userKey);
        sessionStorage.removeItem(this.config.tokenKey);
        
        // If using database, notify API
        if (this.config.useDatabase && this.state.token) {
            this.apiRequest('auth', 'POST', { action: 'logout' }, true)
                .catch(console.error);
        }
        
        // Clear cart if using database mode
        if (this.config.useDatabase) {
            this.state.cart = [];
            this.calculateCartTotals();
            this.updateCartUI();
        }
        
        // Update UI
        this.updateAuthUI();
        
        this.showNotification('Logged out successfully', 'success');
        
        // Reload page to reset state
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },
    
    // ==================== API UTILITIES ====================
    apiRequest: async function(endpoint, method = 'GET', data = null, auth = false) {
        const url = new URL(this.config.apiBaseUrl, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        
        // Add action if present in data
        if (data && data.action) {
            url.searchParams.append('action', data.action);
            delete data.action;
        }
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        // Add auth token if needed
        if (auth && this.state.token) {
            options.headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        
        // Add data for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // Add GET parameters
        if (data && method === 'GET') {
            Object.keys(data).forEach(key => {
                url.searchParams.append(key, data[key]);
            });
        }
        
        if (this.config.debugMode) {
            console.log(`📡 API Request: ${method} ${url}`, options);
        }
        
        try {
            const response = await fetch(url.toString(), options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (this.config.debugMode) {
                console.log(`📡 API Response:`, result);
            }
            
            return result;
            
        } catch (error) {
            console.error('API Request failed:', error);
            
            // If API fails and we're in database mode, fallback to local
            if (this.config.useDatabase && !this.config.offlineMode) {
                console.warn('API failed, falling back to local mode for this request');
                return this.fallbackToLocal(endpoint, method, data);
            }
            
            throw error;
        }
    },
    
    fallbackToLocal: function(endpoint, method, data) {
        // Provide local fallbacks for common endpoints
        switch (endpoint) {
            case 'products':
                return this.getLocalProducts(data);
            case 'product':
                return this.getLocalProduct(data?.id);
            case 'categories':
                return this.getLocalCategories();
            case 'mode':
                return { useDatabase: false, mode: 'local' };
            default:
                return {
                    success: false,
                    error: 'API unavailable and no local fallback',
                    mode: 'local_fallback'
                };
        }
    },
    
    getLocalProducts: function(filters = {}) {
        const sampleProducts = [
            {
                id: 1,
                name: 'Sample Product 1',
                description: 'This is a sample product for local mode',
                price: 29.99,
                category: 'men',
                images: ['images/product-placeholder.jpg'],
                stock: 10,
                rating: 4.0
            }
            // Add more sample products as needed
        ];
        
        let filtered = [...sampleProducts];
        
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        return {
            products: filtered,
            pagination: {
                total: filtered.length,
                limit: filters.limit || 10,
                offset: filters.offset || 0,
                hasMore: false
            },
            mode: 'local_fallback'
        };
    },
    
    // ==================== NAVIGATION ====================
    initNavigation: function() {
        // Get current page
        this.state.currentPage = document.body.dataset.page || 
                                this.getPageFromURL() || 
                                'home';
        
        // Highlight active link
        this.highlightActiveLink();
        
        // Setup mobile menu
        this.setupMobileMenu();
        
        // Setup back to top
        this.setupBackToTop();
    },
    
    getPageFromURL: function() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '').toLowerCase();
        
        if (page === '' || page === 'index') return 'home';
        return page;
    },
    
    highlightActiveLink: function() {
        const navLinks = document.querySelectorAll('#navbar-links a');
        const currentPage = this.state.currentPage;
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const linkPage = href.replace('.html', '').toLowerCase();
            
            if (linkPage === currentPage || 
                (currentPage === 'home' && (linkPage === 'index' || linkPage === ''))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    // ==================== UI COMPONENTS ====================
    initUIComponents: function() {
        // Notifications
        this.initNotifications();
        
        // Loading states
        this.initLoadingStates();
        
        // Forms
        this.initForms();
        
        // Product cards
        this.initProductCards();
    },
    
    initNotifications: function() {
        // CSS for notifications
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .luxe-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    z-index: 99999;
                    animation: luxeNotificationSlideIn 0.3s ease;
                    max-width: 350px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .luxe-notification.success { 
                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                    border-left: 4px solid #27ae60;
                }
                
                .luxe-notification.error { 
                    background: linear-gradient(135deg, #e74c3c, #c0392b);
                    border-left: 4px solid #c0392b;
                }
                
                .luxe-notification.info { 
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    border-left: 4px solid #2980b9;
                }
                
                .luxe-notification.warning { 
                    background: linear-gradient(135deg, #f39c12, #e67e22);
                    border-left: 4px solid #e67e22;
                }
                
                .luxe-notification i {
                    font-size: 1.2em;
                }
                
                @keyframes luxeNotificationSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes luxeNotificationSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                
                /* Mode indicator */
                .mode-indicator {
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: bold;
                    z-index: 9999;
                    opacity: 0.8;
                }
                
                .mode-indicator.database { background: #2ecc71; color: white; }
                .mode-indicator.local { background: #e74c3c; color: white; }
            `;
            document.head.appendChild(style);
        }
    },
    
    showNotification: function(message, type = 'info', duration = 3000) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        
        const notification = document.createElement('div');
        notification.className = `luxe-notification ${type}`;
        notification.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.animation = 'luxeNotificationSlideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },
    
    showModeIndicator: function() {
        const indicator = document.createElement('div');
        indicator.className = `mode-indicator ${this.config.mode}`;
        indicator.textContent = `MODE: ${this.config.mode.toUpperCase()}`;
        indicator.title = `Click to toggle mode. Current: ${this.config.mode}`;
        
        indicator.addEventListener('click', () => {
            this.toggleMode();
        });
        
        document.body.appendChild(indicator);
    },
    
    toggleMode: async function() {
        const newMode = this.config.mode === 'database' ? 'local' : 'database';
        
        if (newMode === 'database') {
            // Switch to database mode
            const useDB = confirm('Switch to DATABASE mode? This requires:\n1. SQL Server running\n2. Database setup\n3. Valid credentials\n\nContinue?');
            
            if (useDB) {
                this.showNotification('Switching to database mode...', 'info');
                
                // In a real app, this would update config and reload
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } else {
            // Switch to local mode
            this.showNotification('Switching to local mode...', 'info');
            
            // Update config
            this.config.useDatabase = false;
            this.config.mode = 'local';
            
            // Save config
            localStorage.setItem('luxe_config', JSON.stringify(this.config));
            
            // Reload
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    },
    
    // ==================== LOAD INITIAL DATA ====================
    async loadInitialData() {
        // Load products for home page
        if (this.state.currentPage === 'home' || 
            this.state.currentPage === 'products') {
            await this.loadProducts();
        }
        
        // Load categories
        await this.loadCategories();
    },
    
    async loadProducts() {
        try {
            const response = await this.apiRequest('products', 'GET');
            
            if (response.products) {
                // Store products globally
                window.LuxeApp.products = response.products;
                
                if (this.config.debugMode) {
                    console.log('📦 Products loaded:', response.products.length);
                }
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    },
    
    async loadCategories() {
        try {
            const response = await this.apiRequest('categories', 'GET');
            
            if (response.categories) {
                window.LuxeApp.categories = response.categories;
                
                if (this.config.debugMode) {
                    console.log('🏷️ Categories loaded:', response.categories.length);
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    },
    
    // ==================== PAGE INITIALIZATION ====================
    initPage: function() {
        // Call page-specific init functions
        const pageInitMap = {
            'home': 'initHome',
            'products': 'initProducts',
            'product-detail': 'initProductDetail',
            'cart': 'initCart',
            'checkout': 'initCheckout',
            'login': 'initAuth',
            'admin': 'initAdminPanel'
        };
        
        const initFunction = pageInitMap[this.state.currentPage];
        if (initFunction && typeof window[initFunction] === 'function') {
            window[initFunction]();
        }
        
        // Initialize common components
        this.initCommonComponents();
    },
    
    initCommonComponents: function() {
        // Product cards
        this.initProductCards();
        
        // Forms
        this.initForms();
    },
    
    initProductCards: function() {
        // Add to cart functionality for all product cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const button = e.target.closest('.add-to-cart-btn');
                const productId = button.dataset.id;
                const product = this.findProductById(productId);
                
                if (product) {
                    const quantity = button.dataset.quantity || 1;
                    const size = button.dataset.size || null;
                    const color = button.dataset.color || null;
                    
                    this.addToCart(product, parseInt(quantity), { size, color });
                }
            }
        });
    },
    
    findProductById: function(id) {
        // Look in global products array
        if (window.LuxeApp.products) {
            return window.LuxeApp.products.find(p => p.id == id);
        }
        
        // Fallback to sample data
        return {
            id: id,
            name: `Product ${id}`,
            price: 99.99,
            images: ['images/product-placeholder.jpg']
        };
    },
    
    // ==================== GLOBAL EVENT HANDLERS ====================
    setupGlobalEvents: function() {
        // Global keyboard shortcuts (debug mode only)
        if (this.config.debugMode) {
            this.setupKeyboardShortcuts();
        }
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, refresh data
                this.refreshData();
            }
        });
    },
    
    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Alt+D: Toggle debug mode
            if (e.ctrlKey && e.altKey && e.key === 'd') {
                e.preventDefault();
                this.config.debugMode = !this.config.debugMode;
                this.showNotification(
                    `Debug mode ${this.config.debugMode ? 'ENABLED' : 'DISABLED'}`,
                    this.config.debugMode ? 'info' : 'warning'
                );
            }
            
            // Ctrl+Alt+T: Toggle theme
            if (e.ctrlKey && e.altKey && e.key === 't') {
                e.preventDefault();
                const themes = ['spring', 'summer', 'autumn', 'winter'];
                const currentIndex = themes.indexOf(this.state.theme);
                const nextIndex = (currentIndex + 1) % themes.length;
                this.applyTheme(themes[nextIndex]);
            }
            
            // Ctrl+Alt+M: Show mode info
            if (e.ctrlKey && e.altKey && e.key === 'm') {
                e.preventDefault();
                alert(`Current Mode: ${this.config.mode.toUpperCase()}\nUsing Database: ${this.config.useDatabase}\nAuthenticated: ${this.state.isAuthenticated}`);
            }
        });
    },
    
    refreshData: function() {
        // Refresh cart
        if (this.config.useDatabase && this.state.isAuthenticated) {
            this.loadCartFromAPI();
        }
        
        // Refresh user data
        if (this.state.isAuthenticated) {
            this.loadUserData();
        }
    },
    
    // ==================== ERROR HANDLING ====================
    initErrorHandling: function() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            
            if (this.config.debugMode) {
                this.showNotification(`Error: ${e.message}`, 'error');
            }
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
        
        // Network status
        window.addEventListener('online', () => {
            this.showNotification('You are back online', 'success');
            this.refreshData();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may be limited.', 'warning');
        });
    },
    
    // ==================== UTILITY METHODS ====================
    showProfile: function() {
        if (this.state.user) {
            const profileHTML = `
                <div class="profile-modal">
                    <h3>${this.state.user.name}</h3>
                    <p>Email: ${this.state.user.email}</p>
                    <p>Role: ${this.state.user.role}</p>
                    <button onclick="LuxeApp.logout()">Logout</button>
                </div>
            `;
            
            // You would implement a proper modal here
            alert(`Profile:\nName: ${this.state.user.name}\nEmail: ${this.state.user.email}\nRole: ${this.state.user.role}`);
        }
    },
    
    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Check if running on mobile
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Set loading state
    setLoading: function(loading) {
        this.state.isLoading = loading;
        
        if (loading) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    }
};

// ============================================
// START APPLICATION
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.LuxeApp.init();
    });
} else {
    window.LuxeApp.init();
}

// Make available globally
window.initApp = function() {
    window.LuxeApp.init();
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LuxeApp;
}