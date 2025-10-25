// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.isAdmin = false;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = storage.getCurrentUser();
        if (savedUser) {
            if (savedUser.isAdmin) {
                this.isAdmin = true;
                // Jangan redirect otomatis, biarkan user memilih
                console.log('Admin logged in');
            } else {
                this.currentUser = savedUser;
                // Jangan redirect otomatis
                console.log('User logged in');
            }
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching - hanya di halaman auth
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout buttons
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Header logout buttons
        const headerLogoutBtn = document.querySelector('[id="logout-btn"]');
        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    switchTab(tab) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show active form
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Validasi input
        if (!username || !password) {
            this.showMessage('Username dan password harus diisi', 'error');
            return;
        }

        // Check admin login
        if (storage.validateAdmin(username, password)) {
            const adminUser = { username, isAdmin: true };
            storage.setCurrentUser(adminUser);
            this.isAdmin = true;
            this.showMessage('Login admin berhasil!', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
            return;
        }

        // Check user login
        const user = storage.getUserByUsername(username);
        if (user && user.password === password) {
            storage.setCurrentUser(user);
            this.currentUser = user;
            this.showMessage('Login berhasil!', 'success');
            setTimeout(() => {
                window.location.href = 'user-dashboard.html';
            }, 1000);
        } else {
            this.showMessage('Username atau password salah', 'error');
        }
    }

    handleRegister() {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;

        // Validasi input
        if (!username || !password || !confirmPassword) {
            this.showMessage('Semua field harus diisi', 'error');
            return;
        }

        if (username.length < 3) {
            this.showMessage('Username minimal 3 karakter', 'error');
            return;
        }

        if (password.length < 4) {
            this.showMessage('Password minimal 4 karakter', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Password dan konfirmasi password tidak cocok', 'error');
            return;
        }

        // Check if username already exists
        if (storage.getUserByUsername(username)) {
            this.showMessage('Username sudah digunakan', 'error');
            return;
        }

        // Create new user
        const newUser = storage.addUser({ username, password });
        storage.setCurrentUser(newUser);
        this.currentUser = newUser;
        
        this.showMessage('Registrasi berhasil!', 'success');
        setTimeout(() => {
            window.location.href = 'user-dashboard.html';
        }, 1000);
    }

    handleLogout() {
        storage.clearCurrentUser();
        this.currentUser = null;
        this.isAdmin = false;
        window.location.href = 'index.html';
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'error') {
            messageDiv.style.background = '#f44336';
        } else if (type === 'success') {
            messageDiv.style.background = '#4CAF50';
        } else {
            messageDiv.style.background = '#2196F3';
        }

        document.body.appendChild(messageDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});