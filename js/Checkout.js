// Checkout Page Functionality for LUXE Store
class CheckoutPage {
    constructor() {
        this.cart = [];
        this.order = {
            contact: {},
            shipping: {},
            shippingMethod: 'standard-shipping',
            payment: {},
            items: []
        };
        this.shippingMethods = {
            'standard-shipping': { name: 'Standard Shipping', cost: 5.99, days: '5-7' },
            'express-shipping': { name: 'Express Shipping', cost: 14.99, days: '2-3' },
            'overnight-shipping': { name: 'Overnight Shipping', cost: 24.99, days: '1' }
        };
        this.init();
    }

    init() {
        this.loadCart();
        this.loadSavedInfo();
        this.renderCheckoutItems();
        this.setupEventListeners();
        this.updateOrderSummary();
        this.updateCartCount();
        
        if (DEBUG_MODE) {
            console.log('Checkout page initialized');
            console.log('Cart items:', this.cart);
        }
    }

    loadCart() {
        const cartData = localStorage.getItem('cart');
        this.cart = cartData ? JSON.parse(cartData) : [];
        this.order.items = [...this.cart];
    }

    loadSavedInfo() {
        // Load saved contact and shipping info from localStorage
        if (DEVELOPER_MODE && typeof localStorage !== 'undefined') {
            const savedContact = localStorage.getItem('checkout-contact');
            const savedShipping = localStorage.getItem('checkout-shipping');
            
            if (savedContact) {
                try {
                    this.order.contact = JSON.parse(savedContact);
                    this.populateForm('contact', this.order.contact);
                } catch (e) {
                    console.error('Error parsing saved contact:', e);
                }
            }
            
            if (savedShipping) {
                try {
                    this.order.shipping = JSON.parse(savedShipping);
                    this.populateForm('shipping', this.order.shipping);
                } catch (e) {
                    console.error('Error parsing saved shipping:', e);
                }
            }
        }
    }

    populateForm(formType, data) {
        Object.keys(data).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = data[key];
            }
        });
    }

    renderCheckoutItems() {
        const container = document.getElementById('checkout-items');
        if (!container) return;
        
        if (this.cart.length === 0) {
            container.innerHTML = '<div class="empty-message">Your cart is empty</div>';
            return;
        }
        
        container.innerHTML = '';
        
        this.cart.forEach(item => {
            const itemElement = this.createCheckoutItem(item);
            container.appendChild(itemElement);
        });
    }

    createCheckoutItem(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        
        const itemTotal = item.price * item.quantity;
        const options = [];
        if (item.size) options.push(`Size: ${item.size}`);
        if (item.color) options.push(`Color: ${item.color}`);
        
        itemElement.innerHTML = `
            <div class="item-info">
                <img src="${item.image || 'images/product-placeholder.jpg'}" 
                     alt="${item.name}"
                     class="item-image"
                     onerror="this.src='images/product-placeholder.jpg'">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    ${options.length > 0 ? `<p>${options.join(' | ')}</p>` : ''}
                    <p>Quantity: ${item.quantity}</p>
                </div>
            </div>
            <div class="item-price">$${itemTotal.toFixed(2)}</div>
        `;
        
        return itemElement;
    }

    setupEventListeners() {
        // Form inputs
        this.setupFormValidation();
        
        // Shipping method selection
        this.setupShippingMethods();
        
        // Continue to payment button
        const continueBtn = document.getElementById('continue-to-payment');
        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.validateAndProceed();
            });
        }
        
        // Back to cart link
        const backToCart = document.querySelector('.back-to-cart');
        if (backToCart) {
            backToCart.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        }
        
        // Save info checkbox
        const saveAddress = document.getElementById('save-address');
        if (saveAddress) {
            saveAddress.addEventListener('change', (e) => {
                if (e.target.checked && DEVELOPER_MODE) {
                    this.saveUserInfo();
                }
            });
        }
    }

    setupFormValidation() {
        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => this.validateEmail());
        }
        
        // Phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => this.validatePhone());
        }
        
        // ZIP code validation
        const zipInput = document.getElementById('zip');
        if (zipInput) {
            zipInput.addEventListener('blur', () => this.validateZIP());
        }
    }

    setupShippingMethods() {
        const shippingOptions = document.querySelectorAll('.shipping-option');
        const shippingRadios = document.querySelectorAll('input[name="shipping"]');
        
        shippingOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selected class from all options
                shippingOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Check the corresponding radio button
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                    this.order.shippingMethod = radio.id;
                    this.updateOrderSummary();
                }
            });
        });
        
        shippingRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.order.shippingMethod = e.target.id;
                    this.updateOrderSummary();
                }
            });
        });
    }

    validateEmail() {
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            this.showFieldError(emailInput, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(emailInput);
        this.order.contact.email = email;
        return true;
    }

    validatePhone() {
        const phoneInput = document.getElementById('phone');
        const phone = phoneInput.value.trim();
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            this.showFieldError(phoneInput, 'Please enter a valid phone number');
            return false;
        }
        
        this.clearFieldError(phoneInput);
        this.order.shipping.phone = phone;
        return true;
    }

    validateZIP() {
        const zipInput = document.getElementById('zip');
        const zip = zipInput.value.trim();
        
        if (zip.length < 3) {
            this.showFieldError(zipInput, 'Please enter a valid ZIP code');
            return false;
        }
        
        this.clearFieldError(zipInput);
        this.order.shipping.zip = zip;
        return true;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        input.style.borderColor = '#e74c3c';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '0.25rem';
        
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.style.borderColor = '';
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    validateAndProceed() {
        // Validate required fields
        const requiredFields = [
            'email', 'first-name', 'last-name', 'address', 
            'city', 'country', 'state', 'zip', 'phone'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate specific fields
        if (!this.validateEmail()) isValid = false;
        if (!this.validatePhone()) isValid = false;
        if (!this.validateZIP()) isValid = false;
        
        if (!isValid) {
            this.showNotification('Please fix the errors in the form', 'error');
            return;
        }
        
        // Collect form data
        this.collectFormData();
        
        // Save user info if checkbox is checked
        const saveAddress = document.getElementById('save-address');
        if (saveAddress && saveAddress.checked) {
            this.saveUserInfo();
        }
        
        // Process to next step (payment)
        this.processToPayment();
    }

    collectFormData() {
        // Contact info
        this.order.contact = {
            email: document.getElementById('email').value.trim(),
            subscribe: document.getElementById('email-offers')?.checked || false
        };
        
        // Shipping info
        this.order.shipping = {
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            address: document.getElementById('address').value.trim(),
            apartment: document.getElementById('apartment')?.value.trim() || '',
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value,
            state: document.getElementById('state').value.trim(),
            zip: document.getElementById('zip').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };
        
        // Shipping method
        const selectedShipping = document.querySelector('input[name="shipping"]:checked');
        if (selectedShipping) {
            this.order.shippingMethod = selectedShipping.id;
        }
    }

    saveUserInfo() {
        if (DEVELOPER_MODE && typeof localStorage !== 'undefined') {
            localStorage.setItem('checkout-contact', JSON.stringify(this.order.contact));
            localStorage.setItem('checkout-shipping', JSON.stringify(this.order.shipping));
            this.showNotification('Information saved for next time', 'success');
        }
    }

    processToPayment() {
        // In a real application, this would:
        // 1. Send order data to backend
        // 2. Process payment
        // 3. Redirect to payment gateway or confirmation page
        
        // For demo purposes, we'll simulate the process
        this.showNotification('Processing to payment...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            // Save order to localStorage for demo
            if (DEVELOPER_MODE) {
                const orderId = 'ORD-' + Date.now().toString().slice(-6);
                const orderData = {
                    id: orderId,
                    ...this.order,
                    subtotal: this.getSubtotal(),
                    shipping: this.getShippingCost(),
                    tax: this.getTax(),
                    total: this.getTotal(),
                    date: new Date().toISOString(),
                    status: 'pending'
                };
                
                // Save order
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));
                
                // Clear cart
                localStorage.removeItem('cart');
                
                // Redirect to confirmation page (or payment page in real app)
                this.showNotification('Order processed successfully!', 'success');
                
                // In a real app, you would redirect to a payment gateway
                // For demo, we'll redirect to a success page
                setTimeout(() => {
                    window.location.href = `order-confirmation.html?id=${orderId}`;
                }, 1500);
            } else {
                this.showNotification('Payment processing would happen here', 'info');
            }
        }, 1000);
    }

    updateOrderSummary() {
        const subtotal = this.getSubtotal();
        const shipping = this.getShippingCost();
        const tax = this.getTax();
        const total = subtotal + shipping + tax;
        
        // Update display
        document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('checkout-shipping').textContent = `$${shipping.toFixed(2)}`;
        document.getElementById('checkout-tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getShippingCost() {
        if (this.cart.length === 0) return 0;
        
        const method = this.shippingMethods[this.order.shippingMethod];
        return method ? method.cost : 5.99;
    }

    getTax() {
        const subtotal = this.getSubtotal();
        // Assuming 8% tax rate
        return subtotal * 0.08;
    }

    getTotal() {
        return this.getSubtotal() + this.getShippingCost() + this.getTax();
    }

    updateCartCount() {
        const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
        
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

// Initialize checkout page
function initCheckout() {
    if (document.querySelector('[data-page="checkout"]')) {
        window.checkoutPage = new CheckoutPage();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCheckout);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CheckoutPage, initCheckout };
}