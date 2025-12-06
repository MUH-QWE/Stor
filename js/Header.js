// js/HeaderLoader.js
class HeaderLoader {
    constructor() {
        this.headerLoaded = false;
        this.headerPath = 'includes/header.html'; // مسار ملف الهيدر
        this.init();
    }

    init() {
        this.loadHeader();
        this.setupGlobalHeader();
    }

    loadHeader() {
        if (document.getElementById('main-header')) {
            console.log('Header already exists');
            return;
        }

        fetch(this.headerPath)
            .then(response => response.text())
            .then(html => {
                // إضافة الهيدر في بداية body
                document.body.insertAdjacentHTML('afterbegin', html);
                this.headerLoaded = true;
                
                // تهيئة الهيدر بعد تحميله
                this.initializeHeader();
                
                // تشغيل NavigationManager بعد تحميل الهيدر
                if (typeof navigationManager !== 'undefined') {
                    navigationManager.init();
                }
                
                console.log('Header loaded successfully');
            })
            .catch(error => {
                console.error('Error loading header:', error);
                this.createFallbackHeader();
            });
    }

    createFallbackHeader() {
        const fallbackHeader = `
            <header id="main-header">
                <div class="container">
                    <div class="logo">
                        <a href="home.html">
                            <i class="fas fa-crown"></i>
                            <span>LUXE</span>
                        </a>
                    </div>
                    <div class="header-actions">
                        <a href="Cart.html" class="cart-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </a>
                        <a href="LogIn.html" class="login-btn">Login</a>
                    </div>
                </div>
            </header>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', fallbackHeader);
    }

    initializeHeader() {
        // إضافة event listeners
        this.setupMobileMenu();
        this.setupSearch();
        this.setupThemeToggle();
    }

    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileOverlay = document.getElementById('mobile-nav-overlay');
        const mobileClose = document.querySelector('.mobile-nav-close');

        if (mobileToggle && mobileOverlay) {
            mobileToggle.addEventListener('click', () => {
                mobileOverlay.classList.add('active');
                mobileToggle.setAttribute('aria-expanded', 'true');
            });
        }

        if (mobileClose && mobileOverlay) {
            mobileClose.addEventListener('click', () => {
                mobileOverlay.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        }

        // إغلاق عند النقر خارج القائمة
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', (e) => {
                if (e.target === mobileOverlay) {
                    mobileOverlay.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query.length >= 2) {
                        localStorage.setItem('search_query', query);
                        window.location.href = `Search.html?q=${encodeURIComponent(query)}`;
                    }
                }
            });
        }
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = localStorage.getItem('luxe_theme') || 'spring';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                localStorage.setItem('luxe_theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
                
                // تغيير الأيقونة
                const icon = themeToggle.querySelector('i');
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                
                // إرسال حدث لتحديث كل الصفحات
                document.dispatchEvent(new CustomEvent('themeChanged', {
                    detail: { theme: newTheme }
                }));
            });
            
            // تعيين الأيقونة الصحيحة عند التحميل
            const currentTheme = localStorage.getItem('luxe_theme') || 'spring';
            const icon = themeToggle.querySelector('i');
            icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// تحميل الهيدر عند بداية الصفحة
let headerLoader;
document.addEventListener('DOMContentLoaded', function() {
    headerLoader = new HeaderLoader();
});