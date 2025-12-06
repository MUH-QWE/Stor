// Authentication System for LUXE Store
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.loadCurrentUser();
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupPasswordStrength();
        this.setupSocialLogin();
        
        if (DEBUG_MODE) {
            console.log('Auth system initialized');
            console.log('Current user:', this.currentUser);
        }
    }

    loadCurrentUser() {
        if (DEVELOPER_MODE && typeof localStorage !== 'undefined') {
            const userData = localStorage.getItem('luxe-user');
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                    this.updateUIForLoggedInUser();
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        }
    }

    setupEventListeners() {
        // Toggle between login and register forms
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }
        
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }
        
        // Form submissions
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // Forgot password
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }

    setupFormValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => this.validateEmail(input));
        });
        
        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.id === 'reg-password') {
                    this.checkPasswordStrength(input.value);
                }
                this.validatePassword(input);
            });
        });
        
        // Confirm password validation
        const confirmPassword = document.getElementById('reg-confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                this.validateConfirmPassword();
            });
        }
        
        // Name validation
        const nameInput = document.getElementById('reg-name');
        if (nameInput) {
            nameInput.addEventListener('blur', () => this.validateName(nameInput));
        }
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('reg-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                const strengthBar = document.querySelector('.strength-bar');
                const strengthText = document.querySelector('.strength-text');
                
                if (strengthBar && strengthText) {
                    const strength = this.calculatePasswordStrength(e.target.value);
                    strengthBar.style.width = `${strength.percentage}%`;
                    strengthBar.style.backgroundColor = strength.color;
                    strengthText.textContent = strength.text;
                }
            });
        }
    }

    setupSocialLogin() {
        // Google login
        const googleBtn = document.querySelector('.google-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.handleSocialLogin('google');
            });
        }
        
        // Facebook login
        const facebookBtn = document.querySelector('.facebook-btn');
        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => {
                this.handleSocialLogin('facebook');
            });
        }
    }

    showLoginForm() {
        this.isLoginMode = true;
        document.querySelector('.login-form').style.display = 'block';
        document.querySelector('.register-form').style.display = 'none';
    }

    showRegisterForm() {
        this.isLoginMode = false;
        document.querySelector('.login-form').style.display = 'none';
        document.querySelector('.register-form').style.display = 'block';
    }

    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            this.showInputError(input, 'Please enter a valid email address');
            return false;
        }
        
        this.clearInputError(input);
        return true;
    }

    validatePassword(input) {
        const password = input.value.trim();
        
        if (password.length < 6) {
            this.showInputError(input, 'Password must be at least 6 characters');
            return false;
        }
        
        this.clearInputError(input);
        return true;
    }

    validateConfirmPassword() {
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const errorElement = document.getElementById('confirm-password-error');
        
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return false;
        }
        
        errorElement.textContent = '';
        return true;
    }

    validateName(input) {
        const name = input.value.trim();
        
        if (name.length < 2) {
            this.showInputError(input, 'Name must be at least 2 characters');
            return false;
        }
        
        this.clearInputError(input);
        return true;
    }

    showInputError(input, message) {
        this.clearInputError(input);
        input.style.borderColor = '#e74c3c';
        
        const errorId = `${input.id}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
    }

    clearInputError(input) {
        input.style.borderColor = '';
        const errorId = `${input.id}-error`;
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length check
        if (password.length >= 8) score += 25;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) score += 25;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) score += 25;
        
        // Contains numbers
        if (/[0-9]/.test(password)) score += 25;
        
        // Contains special characters
        if (/[^A-Za-z0-9]/.test(password)) score += 25;
        
        // Cap at 100
        score = Math.min(score, 100);
        
        let strength = {
            percentage: score,
            color: '#e74c3c', // red
            text: 'Weak'
        };
        
        if (score >= 75) {
            strength.color = '#2ecc71'; // green
            strength.text = 'Strong';
        } else if (score >= 50) {
            strength.color = '#f39c12'; // orange
            strength.text = 'Medium';
        } else if (score >= 25) {
            strength.color = '#f1c40f'; // yellow
            strength.text = 'Fair';
        }
        
        return strength;
    }

    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('remember-me')?.checked || false;
        
        // Validate inputs
        if (!this.validateEmail(document.getElementById('email'))) return;
        if (!this.validatePassword(document.getElementById('password'))) return;
        
        // Show loading state
        this.showLoading(true);
        
        try {
            if (USE_PHP_BACKEND) {
                // API login
                await this.apiLogin(email, password, rememberMe);
            } else {
                // Local storage login (for demo)
                await this.localLogin(email, password, rememberMe);
            }
        } catch (error) {
            this.showNotification(error.message || 'Login failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value.trim();
        const confirmPassword = document.getElementById('reg-confirm-password').value.trim();
        const acceptTerms = document.getElementById('accept-terms')?.checked || false;
        
        // Validate all inputs
        if (!this.validateName(document.getElementById('reg-name'))) return;
        if (!this.validateEmail(document.getElementById('reg-email'))) return;
        if (!this.validatePassword(document.getElementById('reg-password'))) return;
        if (!this.validateConfirmPassword()) return;
        
        if (!acceptTerms) {
            this.showNotification('Please accept the terms and conditions', 'error');
            return;
        }
        
        // Show loading state
        this.showLoading(true);
        
        try {
            if (USE_PHP_BACKEND) {
                // API registration
                await this.apiRegister(name, email, password);
            } else {
                // Local storage registration (for demo)
                await this.localRegister(name, email, password);
            }
        } catch (error) {
            this.showNotification(error.message || 'Registration failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async localLogin(email, password, rememberMe) {
        // For demo purposes - check against stored users
        const users = JSON.parse(localStorage.getItem('luxe-users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Create session
        const userSession = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'customer',
            createdAt: user.createdAt
        };
        
        // Store in localStorage
        if (rememberMe) {
            localStorage.setItem('luxe-user', JSON.stringify(userSession));
        } else {
            sessionStorage.setItem('luxe-user', JSON.stringify(userSession));
        }
        
        this.currentUser = userSession;
        this.updateUIForLoggedInUser();
        this.showNotification('Login successful!', 'success');
        
        // Redirect after successful login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    async localRegister(name, email, password) {
        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('luxe-users') || '[]');
        const existingUser = users.find(u => u.email === email);
        
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name: name,
            email: email,
            password: password, // In real app, this should be hashed
            role: 'customer',
            createdAt: new Date().toISOString(),
            verified: false
        };
        
        // Save to users list
        users.push(newUser);
        localStorage.setItem('luxe-users', JSON.stringify(users));
        
        // Auto login after registration
        const userSession = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        };
        
        localStorage.setItem('luxe-user', JSON.stringify(userSession));
        this.currentUser = userSession;
        
        this.showNotification('Registration successful! Welcome to LUXE!', 'success');
        
        // Redirect after successful registration
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    async apiLogin(email, password, rememberMe) {
        // This would make an API call in a real application
        // For now, we'll simulate with a timeout
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulated response
                const mockResponse = {
                    success: true,
                    user: {
                        id: '123',
                        name: 'Demo User',
                        email: email,
                        role: 'customer',
                        token: 'mock-jwt-token'
                    }
                };
                
                if (mockResponse.success) {
                    // Store user data
                    if (rememberMe) {
                        localStorage.setItem('luxe-user', JSON.stringify(mockResponse.user));
                        localStorage.setItem('luxe-token', mockResponse.user.token);
                    } else {
                        sessionStorage.setItem('luxe-user', JSON.stringify(mockResponse.user));
                        sessionStorage.setItem('luxe-token', mockResponse.user.token);
                    }
                    
                    this.currentUser = mockResponse.user;
                    this.updateUIForLoggedInUser();
                    this.showNotification('Login successful!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                    
                    resolve();
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    }

    async apiRegister(name, email, password) {
        // This would make an API call in a real application
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulated response
                const mockResponse = {
                    success: true,
                    message: 'Registration successful'
                };
                
                if (mockResponse.success) {
                    this.showNotification('Registration successful! Please check your email to verify your account.', 'success');
                    
                    // Switch to login form
                    setTimeout(() => {
                        this.showLoginForm();
                        document.getElementById('email').value = email;
                    }, 1500);
                    
                    resolve();
                } else {
                    reject(new Error('Registration failed'));
                }
            }, 1000);
        });
    }

    handleForgotPassword() {
        const email = prompt('Please enter your email address to reset your password:');
        
        if (email && this.validateEmail({ value: email })) {
            // In a real app, this would send a reset email
            this.showNotification(`Reset instructions sent to ${email}`, 'success');
            
            if (DEBUG_MODE) {
                console.log('Password reset requested for:', email);
            }
        } else if (email) {
            this.showNotification('Please enter a valid email address', 'error');
        }
    }

    handleSocialLogin(provider) {
        this.showNotification(`Signing in with ${provider}...`, 'info');
        
        // In a real app, this would redirect to OAuth provider
        // For demo, we'll simulate with a timeout
        setTimeout(() => {
            const mockUser = {
                id: `social-${Date.now()}`,
                name: 'Social User',
                email: `user@${provider}.com`,
                role: 'customer',
                provider: provider
            };
            
            localStorage.setItem('luxe-user', JSON.stringify(mockUser));
            this.currentUser = mockUser;
            
            this.showNotification(`Signed in with ${provider}!`, 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 1000);
    }

    updateUIForLoggedInUser() {
        // Update navbar if user is logged in
        const loginLink = document.querySelector('a[href="Login.html"]');
        if (loginLink && this.currentUser) {
            loginLink.textContent = this.currentUser.name;
            loginLink.href = '#profile';
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
            
            // Add logout option
            const logoutItem = document.createElement('li');
            logoutItem.innerHTML = '<a href="#" id="logout-link">Logout</a>';
            loginLink.parentNode.parentNode.appendChild(logoutItem);
            
            document.getElementById('logout-link').addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    showProfile() {
        if (this.currentUser) {
            alert(`Profile:\nName: ${this.currentUser.name}\nEmail: ${this.currentUser.email}`);
        }
    }

    logout() {
        // Clear user data
        localStorage.removeItem('luxe-user');
        localStorage.removeItem('luxe-token');
        sessionStorage.removeItem('luxe-user');
        sessionStorage.removeItem('luxe-token');
        
        this.currentUser = null;
        this.showNotification('Logged out successfully', 'success');
        
        // Reload page to update UI
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    showLoading(show) {
        const buttons = document.querySelectorAll('.btn-auth, #login-btn, #register-btn');
        buttons.forEach(button => {
            if (show) {
                button.disabled = true;
                const originalText = button.innerHTML;
                button.dataset.originalText = originalText;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            } else {
                button.disabled = false;
                if (button.dataset.originalText) {
                    button.innerHTML = button.dataset.originalText;
                }
            }
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

// Initialize auth system
function initAuth() {
    if (document.querySelector('[data-page="login"]')) {
        window.authSystem = new AuthSystem();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthSystem, initAuth };
}