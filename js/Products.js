// Products Page Functionality for LUXE Store
class ProductsPage {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.filters = {
            category: 'all',
            price: 'all',
            sort: 'default',
            search: ''
        };
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.setupFilters();
        this.renderProducts();
        this.setupPagination();
        this.updateCartCount();
        
        if (DEBUG_MODE) {
            console.log('Products page initialized');
            console.log('Loaded products:', this.products.length);
        }
    }

    async loadProducts() {
        try {
            if (OFFLINE_MODE || !USE_PHP_BACKEND) {
                this.loadSampleProducts();
            } else {
                await this.loadFromAPI();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.loadSampleProducts();
        }
    }

    loadSampleProducts() {
        // Generate sample products
        this.products = Array.from({ length: 48 }, (_, i) => ({
            id: i + 1,
            name: `Product ${i + 1}`,
            description: `Premium quality product ${i + 1} with excellent design and materials.`,
            price: Math.floor(Math.random() * 200) + 30,
            originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 300) + 50 : null,
            image: `images/product${(i % 12) + 1}.jpg`,
            category: ['men', 'women', 'accessories', 'shoes'][i % 4],
            rating: (Math.random() * 2 + 3).toFixed(1),
            stock: Math.floor(Math.random() * 50) + 10,
            featured: i % 10 === 0,
            new: i < 12
        }));
        
        this.filteredProducts = [...this.products];
    }

    async loadFromAPI() {
        try {
            const response = await fetch('luxe_api.php?endpoint=products');
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            this.products = data.products || [];
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Add to cart buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const button = e.target.closest('.add-to-cart-btn');
                const productId = button.dataset.id;
                this.addToCart(productId);
            }
            
            if (e.target.closest('.view-details-btn')) {
                const button = e.target.closest('.view-details-btn');
                const productId = button.dataset.id;
                this.viewProductDetails(productId);
            }
        });

        // Search input
        const searchInput = document.getElementById('product-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.applyFilters());
        }
    }

    setupFilters() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Price filter
        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filters.price = e.target.value;
                this.applyFilters();
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }
    }

    applyFilters() {
        let filtered = [...this.products];

        // Apply category filter
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(product => product.category === this.filters.category);
        }

        // Apply price filter
        if (this.filters.price !== 'all') {
            const [min, max] = this.filters.price.split('-').map(Number);
            if (this.filters.price.endsWith('+')) {
                filtered = filtered.filter(product => product.price >= 200);
            } else {
                filtered = filtered.filter(product => product.price >= min && product.price <= max);
            }
        }

        // Apply search filter
        if (this.filters.search.trim() !== '') {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        filtered = this.sortProducts(filtered, this.filters.sort);

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
        this.setupPagination();
    }

    sortProducts(products, sortType) {
        const sorted = [...products];
        
        switch (sortType) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'newest':
                return sorted.sort((a, b) => b.id - a.id);
            default:
                return sorted;
        }
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        // Clear container
        container.innerHTML = '';

        if (pageProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button class="btn-primary" id="clear-filters">Clear Filters</button>
                </div>
            `;
            
            const clearBtn = document.getElementById('clear-filters');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearFilters());
            }
            return;
        }

        // Render products
        pageProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id;
        
        const imageSrc = product.image || 'images/product-placeholder.jpg';
        const imageAlt = product.name || 'Product Image';
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const discountPercent = hasDiscount ? 
            Math.round((1 - product.price / product.originalPrice) * 100) : 0;
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${imageSrc}" alt="${imageAlt}" onerror="this.src='images/product-placeholder.jpg'">
                ${hasDiscount ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                ${product.new ? `<span class="new-badge">NEW</span>` : ''}
                ${product.featured ? `<span class="featured-badge">FEATURED</span>` : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-category">${this.formatCategory(product.category)}</div>
                <div class="product-rating">
                    ${this.generateStarRating(product.rating)}
                    <span class="rating-value">${product.rating}</span>
                </div>
                <div class="product-price">
                    ${hasDiscount ? 
                        `<span class="original-price">$${product.originalPrice}</span>` : ''}
                    <span class="current-price">$${product.price}</span>
                </div>
                <div class="product-stock">
                    <i class="fas ${product.stock > 10 ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
                    ${product.stock > 10 ? 'In Stock' : 'Low Stock'}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-primary add-to-cart-btn" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn-secondary view-details-btn" data-id="${product.id}">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        `;

        return card;
    }

    formatCategory(category) {
        const categories = {
            'men': "Men's Fashion",
            'women': "Women's Fashion",
            'accessories': "Accessories",
            'shoes': "Shoes"
        };
        return categories[category] || category;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    setupPagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination) return;
        
        const prevBtn = pagination.querySelector('.prev-btn');
        const nextBtn = pagination.querySelector('.next-btn');
        const pageNumbers = pagination.querySelector('.page-numbers');
        
        // Update button states
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        
        // Update page numbers
        pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('span');
            pageBtn.textContent = i;
            pageBtn.className = i === this.currentPage ? 'current-page' : '';
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderProducts();
                this.setupPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pageNumbers.appendChild(pageBtn);
        }
        
        // Add event listeners
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderProducts();
                this.setupPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderProducts();
                this.setupPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    async addToCart(productId) {
        try {
            const product = this.products.find(p => p.id == productId);
            
            if (!product) {
                console.error('Product not found:', productId);
                this.showNotification('Product not found', 'error');
                return;
            }

            let cart = JSON.parse(localStorage.getItem('cart')) || [];
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

            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartCount();
            this.showNotification(`${product.name} added to cart!`, 'success');
            document.dispatchEvent(new CustomEvent('cartUpdated'));
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Failed to add product to cart', 'error');
        }
    }

    viewProductDetails(productId) {
        // Navigate to product detail page
        window.location.href = `ProductDetail.html?id=${productId}`;
    }

    clearFilters() {
        this.filters = {
            category: 'all',
            price: 'all',
            sort: 'default',
            search: ''
        };
        
        // Reset form elements
        document.getElementById('category-filter').value = 'all';
        document.getElementById('price-filter').value = 'all';
        document.getElementById('sort-filter').value = 'default';
        document.getElementById('product-search').value = '';
        
        this.applyFilters();
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
    }

    showNotification(message, type = 'info') {
        // Same notification function as home.js
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

// Initialize products page
function initProducts() {
    if (document.querySelector('[data-page="products"]')) {
        window.productsPage = new ProductsPage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initProducts);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductsPage, initProducts };
}