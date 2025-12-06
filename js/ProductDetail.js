// Product Detail Page Functionality for LUXE Store
class ProductDetailPage {
    constructor() {
        this.product = null;
        this.selectedSize = '';
        this.selectedColor = '';
        this.quantity = 1;
        this.relatedProducts = [];
        this.productId = this.getProductIdFromURL();
        this.init();
    }

    async init() {
        await this.loadProduct();
        this.setupEventListeners();
        this.renderProductDetails();
        this.loadRelatedProducts();
        this.setupImageGallery();
        this.setupTabs();
        this.updateCartCount();
        
        if (DEBUG_MODE) {
            console.log('Product detail page initialized');
            console.log('Product:', this.product);
        }
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 1;
    }

    async loadProduct() {
        try {
            if (OFFLINE_MODE || !USE_PHP_BACKEND) {
                this.loadSampleProduct();
            } else {
                await this.loadFromAPI();
            }
        } catch (error) {
            console.error('Error loading product:', error);
            this.loadSampleProduct();
        }
    }

    loadSampleProduct() {
        // Sample product data
        this.product = {
            id: this.productId,
            name: 'Premium Fashion Item',
            description: 'This is a premium quality fashion item made with the finest materials. Perfect for any occasion, this product combines style, comfort, and durability.',
            detailedDescription: 'Crafted from 100% premium materials, this fashion item features exquisite design elements that make it stand out. The attention to detail is evident in every stitch, ensuring both beauty and longevity. Perfect for everyday wear or special occasions.',
            price: 129.99,
            originalPrice: 179.99,
            images: [
                'images/product-detail-1.jpg',
                'images/product-detail-2.jpg',
                'images/product-detail-3.jpg',
                'images/product-detail-4.jpg'
            ],
            category: 'men',
            colors: ['Black', 'Navy', 'Gray', 'Brown'],
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            rating: 4.5,
            reviews: 128,
            stock: 25,
            sku: `PROD-${this.productId.toString().padStart(3, '0')}`,
            features: [
                'Premium Quality Materials',
                'Handcrafted Design',
                'Comfortable Fit',
                'Easy Maintenance'
            ],
            specifications: {
                material: 'Premium Cotton Blend',
                care: 'Machine wash cold, tumble dry low',
                origin: 'Made in Italy',
                weight: '0.5 kg',
                dimensions: '30 x 40 x 5 cm'
            },
            isOnSale: true
        };
    }

    async loadFromAPI() {
        try {
            const response = await fetch(`luxe_api.php?endpoint=product&id=${this.productId}`);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            this.product = data.product;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    loadRelatedProducts() {
        // Load related products (in real app, this would come from API)
        this.relatedProducts = Array.from({ length: 4 }, (_, i) => ({
            id: parseInt(this.productId) + i + 1,
            name: `Related Product ${i + 1}`,
            price: Math.floor(Math.random() * 100) + 50,
            image: `images/product${(i % 4) + 1}.jpg`,
            category: this.product.category
        }));
        
        this.renderRelatedProducts();
    }

    renderProductDetails() {
        if (!this.product) return;

        // Update breadcrumb
        const breadcrumb = document.getElementById('product-category');
        const nameBreadcrumb = document.getElementById('product-name-breadcrumb');
        if (breadcrumb) breadcrumb.textContent = this.formatCategory(this.product.category);
        if (nameBreadcrumb) nameBreadcrumb.textContent = this.product.name;

        // Update main product info
        document.getElementById('product-title').textContent = this.product.name;
        document.getElementById('product-sku').textContent = this.product.sku;
        document.getElementById('product-availability').textContent = 
            this.product.stock > 0 ? 'In Stock' : 'Out of Stock';
        document.getElementById('product-availability').className = 
            this.product.stock > 0 ? 'availability in-stock' : 'availability out-of-stock';
        
        // Update price
        document.getElementById('current-price').textContent = `$${this.product.price.toFixed(2)}`;
        if (this.product.originalPrice && this.product.isOnSale) {
            document.getElementById('original-price').textContent = `$${this.product.originalPrice.toFixed(2)}`;
            const discount = Math.round((1 - this.product.price / this.product.originalPrice) * 100);
            document.getElementById('discount-percentage').textContent = `${discount}% OFF`;
        } else {
            document.querySelector('.original-price').style.display = 'none';
            document.getElementById('discount-percentage').style.display = 'none';
        }
        
        // Update description
        document.getElementById('product-description-text').textContent = this.product.description;
        document.getElementById('detailed-description').textContent = this.product.detailedDescription;
        
        // Update rating
        this.updateRatingDisplay(this.product.rating, this.product.reviews);
        
        // Update specifications
        this.updateSpecifications();
        
        // Update options
        this.renderSizeOptions();
        this.renderColorOptions();
    }

    updateRatingDisplay(rating, reviewCount) {
        const starsContainer = document.querySelector('.stars');
        if (!starsContainer) return;
        
        starsContainer.innerHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            if (i < fullStars) {
                star.className = 'fas fa-star';
            } else if (i === fullStars && hasHalfStar) {
                star.className = 'fas fa-star-half-alt';
            } else {
                star.className = 'far fa-star';
            }
            starsContainer.appendChild(star);
        }
        
        const ratingText = document.querySelector('.rating-text');
        if (ratingText) {
            ratingText.textContent = `${rating.toFixed(1)} (${reviewCount} reviews)`;
        }
    }

    updateSpecifications() {
        document.getElementById('spec-material').textContent = this.product.specifications.material;
        document.getElementById('spec-care').textContent = this.product.specifications.care;
        document.getElementById('spec-origin').textContent = this.product.specifications.origin;
    }

    renderSizeOptions() {
        const sizeSelect = document.getElementById('size-select');
        if (!sizeSelect) return;
        
        sizeSelect.innerHTML = '<option value="">Select Size</option>';
        
        this.product.sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `${size} (${this.getSizeDescription(size)})`;
            sizeSelect.appendChild(option);
        });
        
        sizeSelect.addEventListener('change', (e) => {
            this.selectedSize = e.target.value;
        });
    }

    renderColorOptions() {
        const colorContainer = document.getElementById('color-options');
        if (!colorContainer) return;
        
        colorContainer.innerHTML = '';
        
        this.product.colors.forEach((color, index) => {
            const colorOption = document.createElement('div');
            colorOption.className = `color-option ${index === 0 ? 'selected' : ''}`;
            colorOption.dataset.color = color.toLowerCase();
            colorOption.style.backgroundColor = this.getColorValue(color);
            colorOption.title = color;
            
            colorOption.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                colorOption.classList.add('selected');
                this.selectedColor = color;
            });
            
            colorContainer.appendChild(colorOption);
        });
        
        // Set default color
        this.selectedColor = this.product.colors[0];
    }

    getColorValue(colorName) {
        const colors = {
            'black': '#000000',
            'navy': '#000080',
            'gray': '#808080',
            'brown': '#8B4513',
            'white': '#FFFFFF',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#008000'
        };
        return colors[colorName.toLowerCase()] || '#CCCCCC';
    }

    getSizeDescription(size) {
        const descriptions = {
            'XS': 'Extra Small',
            'S': 'Small',
            'M': 'Medium',
            'L': 'Large',
            'XL': 'Extra Large',
            'XXL': 'Double Extra Large'
        };
        return descriptions[size] || 'Standard';
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

    setupImageGallery() {
        const mainImage = document.getElementById('main-product-image');
        const thumbnailsContainer = document.getElementById('image-thumbnails');
        
        if (!this.product.images || this.product.images.length === 0) return;
        
        // Set main image
        if (mainImage) {
            mainImage.src = this.product.images[0];
            mainImage.alt = this.product.name;
        }
        
        // Create thumbnails
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
            
            this.product.images.forEach((image, index) => {
                const img = document.createElement('img');
                img.src = image;
                img.alt = `${this.product.name} - View ${index + 1}`;
                img.onerror = () => {
                    img.src = 'images/product-placeholder.jpg';
                };
                
                if (index === 0) {
                    img.classList.add('active');
                }
                
                img.addEventListener('click', () => {
                    // Update main image
                    if (mainImage) {
                        mainImage.src = image;
                        mainImage.style.opacity = '0';
                        setTimeout(() => {
                            mainImage.style.opacity = '1';
                        }, 10);
                    }
                    
                    // Update active thumbnail
                    document.querySelectorAll('#image-thumbnails img').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    img.classList.add('active');
                });
                
                thumbnailsContainer.appendChild(img);
            });
        }
    }

    setupTabs() {
        const tabHeaders = document.querySelectorAll('.tab-header');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const tabId = header.dataset.tab;
                
                // Remove active class from all headers and panes
                tabHeaders.forEach(h => h.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked header and corresponding pane
                header.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                // Load reviews if reviews tab is clicked
                if (tabId === 'reviews') {
                    this.loadReviews();
                }
            });
        });
    }

    loadReviews() {
        const reviewsTab = document.getElementById('reviews-tab');
        if (!reviewsTab) return;
        
        // Sample reviews (in real app, this would come from API)
        const reviews = [
            { name: 'Alex Johnson', rating: 5, date: '2024-01-15', comment: 'Excellent quality! Fits perfectly and looks great.' },
            { name: 'Maria Garcia', rating: 4, date: '2024-01-10', comment: 'Very comfortable and stylish. Would recommend!' },
            { name: 'David Chen', rating: 5, date: '2024-01-05', comment: 'Best purchase I\'ve made in a while. Worth every penny.' }
        ];
        
        let reviewsHTML = '<div class="reviews-list">';
        
        reviews.forEach(review => {
            reviewsHTML += `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <strong>${review.name}</strong>
                            <div class="review-rating">
                                ${this.generateStarRating(review.rating)}
                            </div>
                        </div>
                        <div class="review-date">${review.date}</div>
                    </div>
                    <div class="review-comment">
                        ${review.comment}
                    </div>
                </div>
            `;
        });
        
        reviewsHTML += '</div>';
        reviewsTab.innerHTML = `<h3>Customer Reviews</h3>${reviewsHTML}`;
    }

    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i - 0.5 === rating) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    renderRelatedProducts() {
        const container = document.getElementById('related-products');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.relatedProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}" onerror="this.src='images/product-placeholder.jpg'">
                <h3>${product.name}</h3>
                <div class="price">
                    <span class="discounted-price">$${product.price}</span>
                </div>
                <button class="btn-primary view-related-btn" data-id="${product.id}">
                    View Details
                </button>
            `;
            
            container.appendChild(productCard);
        });
        
        // Add event listeners to related product buttons
        document.querySelectorAll('.view-related-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('button').dataset.id;
                window.location.href = `ProductDetail.html?id=${productId}`;
            });
        });
    }

    setupEventListeners() {
        // Quantity controls
        const qtyMinus = document.getElementById('qty-minus');
        const qtyPlus = document.getElementById('qty-plus');
        const quantityInput = document.getElementById('quantity');
        
        if (qtyMinus) {
            qtyMinus.addEventListener('click', () => {
                if (this.quantity > 1) {
                    this.quantity--;
                    quantityInput.value = this.quantity;
                }
            });
        }
        
        if (qtyPlus) {
            qtyPlus.addEventListener('click', () => {
                if (this.quantity < 10) {
                    this.quantity++;
                    quantityInput.value = this.quantity;
                }
            });
        }
        
        if (quantityInput) {
            quantityInput.addEventListener('change', (e) => {
                let value = parseInt(e.target.value);
                if (isNaN(value) || value < 1) value = 1;
                if (value > 10) value = 10;
                this.quantity = value;
                e.target.value = value;
            });
        }
        
        // Add to cart button
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Buy now button
        const buyNowBtn = document.getElementById('buy-now-btn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => this.buyNow());
        }
        
        // Wishlist button
        const wishlistBtn = document.getElementById('wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => this.addToWishlist());
        }
    }

    addToCart() {
        if (!this.product) return;
        
        // Validate options
        if (!this.selectedSize && this.product.sizes.length > 0) {
            this.showNotification('Please select a size', 'error');
            return;
        }
        
        if (!this.selectedColor && this.product.colors.length > 0) {
            this.showNotification('Please select a color', 'error');
            return;
        }
        
        // Get current cart
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Create cart item
        const cartItem = {
            id: this.product.id,
            name: this.product.name,
            price: this.product.price,
            image: this.product.images ? this.product.images[0] : 'images/product-placeholder.jpg',
            quantity: this.quantity,
            size: this.selectedSize,
            color: this.selectedColor,
            sku: this.product.sku
        };
        
        // Check if same item already in cart (same product, size, and color)
        const existingItemIndex = cart.findIndex(item => 
            item.id === cartItem.id && 
            item.size === cartItem.size && 
            item.color === cartItem.color
        );
        
        if (existingItemIndex > -1) {
            // Update quantity of existing item
            cart[existingItemIndex].quantity += this.quantity;
        } else {
            // Add new item
            cart.push(cartItem);
        }
        
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        this.updateCartCount();
        
        // Show success message
        this.showNotification(`${this.product.name} added to cart!`, 'success');
        
        // Dispatch cart updated event
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    buyNow() {
        // Add to cart first
        this.addToCart();
        
        // Then redirect to checkout
        setTimeout(() => {
            window.location.href = 'Cart.html';
        }, 1000);
    }

    addToWishlist() {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        
        // Check if already in wishlist
        const exists = wishlist.some(item => item.id === this.product.id);
        
        if (!exists) {
            wishlist.push({
                id: this.product.id,
                name: this.product.name,
                price: this.product.price,
                image: this.product.images ? this.product.images[0] : 'images/product-placeholder.jpg'
            });
            
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            this.showNotification('Added to wishlist!', 'success');
            
            // Update wishlist button
            const wishlistBtn = document.getElementById('wishlist-btn');
            if (wishlistBtn) {
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
                wishlistBtn.classList.add('in-wishlist');
            }
        } else {
            this.showNotification('Already in wishlist', 'info');
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

// Initialize product detail page
function initProductDetail() {
    if (document.querySelector('[data-page="product-detail"]')) {
        window.productDetailPage = new ProductDetailPage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initProductDetail);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ProductDetailPage, initProductDetail };
}