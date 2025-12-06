// Theme System for LUXE Store
class ThemeManager {
    constructor() {
        this.themes = ['spring', 'summer', 'autumn', 'winter'];
        this.currentTheme = this.getSavedTheme() || 'spring';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeSelector();
        this.setupThemePreview();
    }

    getSavedTheme() {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('luxe-theme');
        }
        return null;
    }

    saveTheme(theme) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('luxe-theme', theme);
        }
    }

    applyTheme(theme) {
        // Update data-theme attribute
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme selector if exists
        const themeSelect = document.getElementById('admin-theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        
        // Save to localStorage
        this.saveTheme(theme);
        this.currentTheme = theme;
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent();
    }

    setupThemeSelector() {
        const themeSelect = document.getElementById('admin-theme-select');
        if (themeSelect) {
            // Set current theme
            themeSelect.value = this.currentTheme;
            
            // Add change event listener
            themeSelect.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                this.applyTheme(selectedTheme);
            });
        }
    }

    setupThemePreview() {
        // Add theme preview styles
        const style = document.createElement('style');
        style.textContent = `
            .theme-preview {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            
            .theme-color {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
            }
            
            .theme-color.active {
                border-color: #333;
                transform: scale(1.1);
            }
            
            .theme-color.spring { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .theme-color.summer { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
            .theme-color.autumn { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            .theme-color.winter { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        `;
        document.head.appendChild(style);
    }

    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themeChange', {
            detail: { theme: this.currentTheme }
        });
        document.dispatchEvent(event);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
    }
}

// Initialize theme system
function initTheme() {
    window.themeManager = new ThemeManager();
    
    // Add theme toggle button for testing (remove in production)
    if (DEBUG_MODE) {
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Toggle Theme';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.zIndex = '9999';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.background = '#333';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.addEventListener('click', () => {
            window.themeManager.cycleTheme();
        });
        document.body.appendChild(toggleBtn);
    }
    
    console.log('Theme system initialized');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, initTheme };
}