// Navigation System for LUXE Store
class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.cart = this.getCart();
        this.init();
    }

    init() {
        this.highlightActiveLink();
        this.setupCartIcon();
        this.setupMobileMenu();
        this.setupScrollEffects();
    }

    getCurrentPage() {
        // Get page name from URL or data attribute
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '').toLowerCase();
        
        // Special cases
        if (page === '' || page === 'index') return 'home';
        return page;
    }

    highlightActiveLink() {
        const navLinks = document.querySelectorAll('#navbar-links a');
        const currentPage = this.currentPage;
        
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
    }

    getCart() {
        if (typeof localStorage !== 'undefined') {
            const cartData = localStorage.getItem('cart');
            return cartData ? JSON.parse(cartData) : [];
        }
        return [];
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    setupCartIcon() {
        this.updateCartCount();
        
        // Listen for cart updates
        window.addEventListener('storage', (e) => {
            if (e.key === 'cart') {
                this.cart = this.getCart();
                this.updateCartCount();
            }
        });
        
        // Custom event for cart updates within same window
        document.addEventListener('cartUpdated', () => {
            this.cart = this.getCart();
            this.updateCartCount();
        });
    }

    setupMobileMenu() {
        // Create mobile menu button
        const header = document.getElementById('main-header');
        if (!header || window.innerWidth > 768) return;
        
        const menuBtn = document.createElement('button');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.style.cssText = `
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--primary-color);
            cursor: pointer;
        `;
        
        // Insert before header content
        const container = header.querySelector('.container');
        if (container) {
            container.insertBefore(menuBtn, container.firstChild);
        }
        
        // Show/hide based on screen size
        this.toggleMobileMenu(menuBtn);
        window.addEventListener('resize', () => this.toggleMobileMenu(menuBtn));
        
        // Toggle menu on click
        menuBtn.addEventListener('click', () => {
            const nav = document.getElementById('navbar-links');
            if (nav) {
                nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }

    toggleMobileMenu(menuBtn) {
        const nav = document.getElementById('navbar-links');
        if (!nav) return;
        
        if (window.innerWidth <= 768) {
            menuBtn.style.display = 'block';
            nav.style.display = 'none';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'white';
            nav.style.padding = '1rem';
            nav.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        } else {
            menuBtn.style.display = 'none';
            nav.style.display = 'flex';
            nav.style.flexDirection = 'row';
            nav.style.position = 'static';
            nav.style.background = 'transparent';
            nav.style.padding = '0';
            nav.style.boxShadow = 'none';
        }
    }

    setupScrollEffects() {
        let lastScroll = 0;
        const header = document.getElementById('main-header');
        
        if (!header) return;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add/remove shadow based on scroll
            if (currentScroll > 10) {
                header.style.boxShadow = '0 2px 10px var(--shadow-color)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }
            
            // Hide/show header on scroll
            if (currentScroll > lastScroll && currentScroll > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
        });
    }

    navigateTo(page) {
        window.location.href = `${page}.html`;
    }
}

// Initialize navigation
function initNavbar() {
    window.navManager = new NavigationManager();
    
    // Add navigation event listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Handle back button
        const backButtons = document.querySelectorAll('.back-button, .go-back');
        backButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        });
        
        // Handle external links
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        externalLinks.forEach(link => {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        });
    });
    
    console.log('Navigation system initialized');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager, initNavbar };
}