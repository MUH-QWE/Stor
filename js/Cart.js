// Cart Page Functionality for LUXE Store
class CartPage {
    constructor() {
        this.cart = [];
        this.coupons = {
            'SAVE10': 0.10,
            'SAVE20': 0.20,
            'WELCOME': 0.15
        };
        this.activeCoupon = null;
        this.init();
    }

    init() {
        this.loadCart();
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCount();
        
        if (DEBUG_MODE) {
            console.log('Cart page initialized');
            console.log('Cart items:', this.cart);
        }
    }

    loadCart() {
        const cartData = localStorage.getItem('cart');
        this.cart = cartData ? JSON.parse(cartData) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        document.dispatchEvent(new CustomEvent('cartUpdated'));
    }

    renderCart() {
        const container = document.getElementById('cart-items-container');
        const itemCount = document.getElementById('item-count');
        const emptyMessage = document.querySelector('.empty-cart-message');
        
        if (!container) return;
        
        // Update item count
        if (itemCount) {
            itemCount.textContent = this.getTotalItems();
        }
        
        if (this.cart.length === 0) {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            container.innerHTML = '';
            this.updateOrderSummary();
            return;
        }
        
        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Render cart items
        this.cart.forEach((item, index) => {
            const cartItem = this.createCartItem(item, index);
            container.appendChild(cartItem);
        });
        
        this.updateOrderSummary();
    }

    createCartItem(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.dataset.index = index;
        
        const itemTotal = item.price * item.quantity;
        const options = [];
        if (item.size) options.push(`Size: ${item.size}`);
        if (item.color) options.push(`Color: ${item.color}`);
        
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image || 'images/product-placeholder.jpg'}" 
                     alt="${item.name}"
                     onerror="this.src='images/product-placeholder.jpg'">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-title">${item.name}</h4>
                ${options.length > 0 ? 
                    `<div class="cart-item-meta">${options.join(' | ')}</div>` : ''}
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="item-quantity">
                    <button class="qty-btn minus" data-index="${index}">-</button>
                    <input type="number" class="qty-input" value="${item.quantity}" 
                           min="1" max="10" data-index="${index}">
                    <button class="qty-btn plus" data-index="${index}">+</button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item" data-index="${index}" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return itemElement;
    }

    setupEventListeners() {
        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.closest('.qty-btn.minus')) {
                const index = parseInt(e.target.closest('.qty-btn').dataset.index);
                this.updateQuantity(index, -1);
            }
            
            if (e.target.closest('.qty-btn.plus')) {
                const index = parseInt(e.target.closest('.qty-btn').dataset.index);
                this.updateQuantity(index, 1);
            }
            
            if (e.target.closest('.remove-item')) {
                const index = parseInt(e.target.closest('.remove-item').dataset.index);
                this.removeItem(index);
            }
        });
        
        // Quantity input changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('qty-input')) {
                const index = parseInt(e.target.dataset.index);
                const newQuantity = parseInt(e.target.value);
                if (!isNaN(newQuantity) && newQuantity >= 1 && newQuantity <= 10) {
                    this.setQuantity(index, newQuantity);
                } else {
                    e.target.value = this.cart[index].quantity;
                }
            }
        });
        
        // Clear cart button
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }
        
        // Apply coupon button
        const applyCouponBtn = document.getElementById('apply-coupon');
        const couponInput = document.getElementById('coupon-code');
        
        if (applyCouponBtn && couponInput) {
            applyCouponBtn.addEventListener('click', () => this.applyCoupon());
            couponInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyCoupon();
                }
            });
        }
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.cart.length > 0) {
                    window.location.href = 'Checkout.html';
                } else {
                    this.showNotification('Your cart is empty', 'error');
                }
            });
        }
        
        // Continue shopping button
        const continueShopping = document.querySelector('.continue-shopping');
        if (continueShopping) {
            continueShopping.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'Products.html';
            });
        }
    }

    updateQuantity(index, change) {
        if (index >= 0 && index < this.cart.length) {
            const newQuantity = this.cart[index].quantity + change;
            if (newQuantity >= 1 && newQuantity <= 10) {
                this.cart[index].quantity = newQuantity;
                this.saveCart();
                this.renderCart();
                this.showNotification('Quantity updated', 'success');
            }
        }
    }

    setQuantity(index, quantity) {
        if (index >= 0 && index < this.cart.length) {
            this.cart[index].quantity = quantity;
            this.saveCart();
            this.renderCart();
        }
    }

    removeItem(index) {
        if (index >= 0 && index < this.cart.length) {
            const itemName = this.cart[index].name;
            this.cart.splice(index, 1);
            this.saveCart();
            this.renderCart();
            this.showNotification(`${itemName} removed from cart`, 'success');
        }
    }

    clearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.saveCart();
            this.renderCart();
            this.showNotification('Cart cleared', 'success');
        }
    }

    applyCoupon() {
        const couponInput = document.getElementById('coupon-code');
        if (!couponInput) return;
        
        const code = couponInput.value.trim().toUpperCase();
        
        if (!code) {
            this.showNotification('Please enter a coupon code', 'error');
            return;
        }
        
        if (this.activeCoupon === code) {
            this.showNotification('Coupon already applied', 'info');
            return;
        }
        
        if (this.coupons[code]) {
            this.activeCoupon = code;
            this.updateOrderSummary();
            this.showNotification(`Coupon ${code} applied!`, 'success');
            
            // Update UI
            couponInput.disabled = true;
            document.getElementById('apply-coupon').textContent = 'Applied';
        } else {
            this.showNotification('Invalid coupon code', 'error');
        }
    }

    updateOrderSummary() {
        const subtotal = this.getSubtotal();
        const shipping = this.getShippingCost();
        const tax = this.getTax(subtotal);
        const discount = this.getDiscount(subtotal);
        const total = subtotal + shipping + tax - discount;
        
        // Update display
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('discount').textContent = `-$${discount.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        
        // Update checkout button if exists
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = this.cart.length === 0;
            checkoutBtn.textContent = this.cart.length === 0 ? 
                'Cart is Empty' : `Proceed to Checkout ($${total.toFixed(2)})`;
        }
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getShippingCost() {
        const subtotal = this.getSubtotal();
        if (subtotal === 0) return 0;
        if (subtotal >= 100) return 0; // Free shipping over $100
        return 5.99; // Standard shipping
    }

    getTax(subtotal) {
        // Assuming 8% tax rate
        return subtotal * 0.08;
    }

    getDiscount(subtotal) {
        if (!this.activeCoupon || !this.coupons[this.activeCoupon]) return 0;
        return subtotal * this.coupons[this.activeCoupon];
    }

    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartCount() {
        const totalItems = this.getTotalItems();
        
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

// Initialize cart page
function initCart() {
    if (document.querySelector('[data-page="cart"]')) {
        window.cartPage = new CartPage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCart);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartPage, initCart };
}