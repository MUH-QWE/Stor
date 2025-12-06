// Home Page Functionality for LUXE Store
class HomePage {
    constructor() {
        this.saleProducts = [];
        this.bestProducts = [];
        this.newProducts = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.setupAnimations();
        this.updateCartCount();
        
        if (DEBUG_MODE) {
            console.log('Home page initialized');
        }
    }

    async loadProducts() {
        try {
            if (OFFLINE_MODE || !USE_PHP_BACKEND) {
                // Load sample data
                this.loadSampleData();
            } else {
                // Load from API
                await this.loadFromAPI();
            }
            
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.loadSampleData();
            this.renderProducts();
        }
    }

    loadSampleData() {
        // Sample sale products
        this.saleProducts = [
            { id: 1, name: 'Premium T-Shirt', price: 75, originalPrice: 100, image: 'images/product1.jpg', category: 'men' },
            { id: 2, name: 'Designer Dress', price: 120, originalPrice: 150, image: 'images/product2.jpg', category: 'women' },
            { id: 3, name: 'Leather Jacket', price: 200, originalPrice: 250, image: 'images/product3.jpg', category: 'men' },
            { id: 4, name: 'Summer Dress', price: 89, originalPrice: 110, image: 'images/product4.jpg', category: 'women' }
        ];

        // Sample best sellers
        this.bestProducts = [
            { id: 5, name: 'Classic Watch', price: 80, image: 'images/product5.jpg', category: 'accessories' },
            { id: 6, name: 'Sneakers', price: 95, image: 'images/product6.jpg', category: 'shoes' },
            { id: 7, name: 'Handbag', price: 150, image: 'images/product7.jpg', category: 'accessories' },
            { id: 8, name: 'Sunglasses', price: 65, image: 'images/product8.jpg', category: 'accessories' }
        ];

        // Sample new arrivals
        this.newProducts = [
            { id: 9, name: 'Winter Coat', price: 180, image: 'images/product9.jpg', category: 'women' },
            { id: 10, name: 'Formal Shirt', price: 70, image: 'images/product10.jpg', category: 'men' },
            { id: 11, name: 'Running Shoes', price: 110, image: 'images/product11.jpg', category: 'shoes' },
            { id: 12, name: 'Evening Gown', price: 220, image: 'images/product12.jpg', category: 'women' }
        ];
    }

    async loadFromAPI() {
        try {
            const response = await fetch('luxe_api.php?endpoint=products&type=home');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            this.saleProducts = data.sale || [];
            this.bestProducts = data.best || [];
            this.newProducts = data.new || [];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    renderProducts() {
        this.renderProductSection('sale-products', this.saleProducts, true);
        this.renderProductSection('best-products', this.bestProducts, false);
        this.renderProductSection('new-products', this.newProducts, false);
    }

    renderProductSection(containerId, products, showOriginalPrice) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Clear loading message
        container.innerHTML = '';

        if (!products || products.length === 0) {
            container.innerHTML = '<div class="no-products">No products available</div>';
            return;
        }

        products.forEach(product => {
            const productCard = this.createProductCard(product, showOriginalPrice);
            container.appendChild(productCard);
        });
    }

    createProductCard(product, showOriginalPrice) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        
        const imageSrc = product.image || 'images/product-placeholder.jpg';
        const imageAlt = product.name || 'Product Image';
        
        card.innerHTML = `
            <img src="${imageSrc}" alt="${imageAlt}" onerror="this.src='images/product-placeholder.jpg'">
            <h3>${product.name || 'Unnamed Product'}</h3>
            <div class="price">
                ${showOriginalPrice && product.originalPrice ? 
                    `<span class="original-price">$${product.originalPrice}</span>` : ''}
                <span class="discounted-price">$${product.price || 0}</span>
            </div>
            <button class="btn-primary add-to-cart-btn" data-id="${product.id}">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        `;

        return card;
    }

    setupEventListeners() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const button = e.target.closest('.add-to-cart-btn');
                const productId = button.dataset.id;
                this.addToCart(productId);
            }
        });

        // Hero button
        const heroBtn = document.querySelector('.btn-hero');
        if (heroBtn) {
            heroBtn.addEventListener('click', () => {
                window.location.href = 'Products.html';
            });
        }

        // Category filter buttons (if any)
        const categoryFilters = document.querySelectorAll('.category-filter');
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.target.dataset.category;
                this.filterProducts(category);
            });
        });
    }

    async addToCart(productId) {
        try {
            // Find the product
            const allProducts = [...this.saleProducts, ...this.bestProducts, ...this.newProducts];
            const product = allProducts.find(p => p.id == productId);
            
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }

            // Get current cart
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Check if product already in cart
            const existingItem = cart.find(item => item.id == productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Update cart count
            this.updateCartCount();
            
            // Show success message
            this.showNotification(`${product.name} added to cart!`, 'success');
            
            // Dispatch cart updated event
            document.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add product to cart', 'error');
        }
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
    }

    filterProducts(category) {
        // Filter logic would go here
        console.log('Filtering by category:', category);
        // In a real implementation, this would filter the displayed products
    }

    setupAnimations() {
        // Add scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe product sections
        const sections = document.querySelectorAll('.products-grid, .feature-card');
        sections.forEach(section => {
            observer.observe(section);
        });

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .products-grid, .feature-card {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            
            .products-grid.animate-in, .feature-card.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        // Add animation styles
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize home page
function initHome() {
    if (document.querySelector('[data-page="home"]')) {
        window.homePage = new HomePage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initHome);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HomePage, initHome };
}