// ==========================================
// IT COMMAND CENTER - COMPLETE JAVASCRIPT
// ==========================================

// ==========================================
// CONFIGURATION
// ==========================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec';
const WORKER_URL = 'https://dse-proxy.xanimeindo12.workers.dev';

// ==========================================
// PAGE INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    const currentPage = pathname.split('/').pop().toLowerCase();
    
    console.log('📄 Current page:', currentPage);

    if (currentPage === 'login.html' || currentPage === 'login') {
        console.log('🔐 Initializing LOGIN page...');
        initLoginPage();
    } 
    else if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
        console.log('📊 Initializing DASHBOARD page...');
        handleIndexPage();
    } 
    else {
        console.log('📱 Initializing APP page:', currentPage);
        initAppPage();
    }
});

// ==========================================
// HANDLE INDEX PAGE
// ==========================================
function handleIndexPage() {
    const token = localStorage.getItem('itcc-current-user');
    
    if (token) {
        console.log('✅ User logged in, loading dashboard...');
        initAppPage();
    } else {
        console.log('⚠️ Not logged in, redirecting to login.html...');
        window.location.href = 'login.html';
    }
}

// ==========================================
// LOGIN PAGE
// ==========================================
function initLoginPage() {
    console.log('🔐 initLoginPage() called');
    
    const existingUser = localStorage.getItem('itcc-current-user');
    
    if (existingUser) {
        console.log('✅ Already logged in, redirecting to dashboard.html');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 100);
        return;
    }

    const form = document.getElementById('loginForm');
    if (!form) {
        console.error('❌ Login form NOT found!');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        if (!username || !password) {
            if (errorDiv) {
                errorDiv.textContent = 'Username dan password wajib diisi!';
                errorDiv.style.display = 'block';
            }
            return;
        }

        // Simple authentication (in production, this would call an API)
        const user = {
            name: username,
            role: 'Administrator'
        };
        
        localStorage.setItem('itcc-current-user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    });
}

// ==========================================
// APP PAGE INITIALIZATION
// ==========================================
function initAppPage() {
    const userStr = localStorage.getItem('itcc-current-user');

    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    
    loadSidebar(user);
}

// ==========================================
// LOAD SIDEBAR
// ==========================================
async function loadSidebar(user) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch('sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');
        
        container.innerHTML = await response.text();
        console.log('✅ Sidebar HTML loaded');

        // Update user info
        const nameEl = container.querySelector('#user-name');
        const roleEl = container.querySelector('.user-role');
        const avatarEl = container.querySelector('.user-avatar');
        
        if (nameEl) nameEl.textContent = user.name || 'Administrator';
        if (roleEl) roleEl.textContent = user.role || 'ADMIN';
        if (avatarEl) {
            const initials = (user.name || 'AD').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            avatarEl.textContent = initials;
        }

        // Setup logout
        const logoutBtn = container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Setup sidebar interactions
        setTimeout(() => {
            setupSidebarInteractive();
        }, 200);
        
    } catch (error) {
        console.error("❌ Sidebar error:", error);
        container.innerHTML = '<p style="padding:20px;color:red;">Gagal memuat menu.</p>';
    }
}

// ==========================================
// SIDEBAR INTERACTIONS
// ==========================================
function setupSidebarInteractive() {
    console.log('🎯 Setting up sidebar interactions...');
    
    // Highlight active menu
    highlightActiveMenu();
    
    // Setup dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const parentDropdown = this.closest('.nav-dropdown');
            const dropdownMenu = parentDropdown.querySelector('.dropdown-menu');
            const firstItem = dropdownMenu.querySelector('.dropdown-item');
            
            const isOpen = dropdownMenu.classList.contains('show');
            
            // Close all other dropdowns
            document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
                if (dropdown !== parentDropdown) {
                    dropdown.classList.remove('active');
                    const menu = dropdown.querySelector('.dropdown-menu');
                    const toggle = dropdown.querySelector('.dropdown-toggle');
                    if (menu) {
                        menu.classList.remove('show');
                        menu.style.display = 'none';
                    }
                    if (toggle) toggle.classList.remove('active');
                }
            });
            
            // Close nav-items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            if (isOpen) {
                // Close this dropdown
                dropdownMenu.classList.remove('show');
                dropdownMenu.style.display = 'none';
                this.classList.remove('active');
                parentDropdown.classList.remove('active');
                
                // Highlight dashboard
                const dashboardLink = document.querySelector('.nav-item[data-page="dashboard"]');
                if (dashboardLink) dashboardLink.classList.add('active');
            } else {
                // Open this dropdown
                dropdownMenu.classList.add('show');
                dropdownMenu.style.display = 'block';
                this.classList.add('active');
                parentDropdown.classList.add('active');
                
                // Auto-navigate to first item
                if (firstItem) {
                    setTimeout(() => {
                        const href = firstItem.getAttribute('href');
                        if (href && href !== '#') {
                            console.log(' Auto-navigating to:', href);
                            window.location.href = href;
                        }
                    }, 300);
                }
            }
        });
    });
    
    // Setup dropdown item clicks
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
            
            const parentDropdown = this.closest('.nav-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('active');
            }
        });
    });
    
    // Setup nav-item clicks
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('active'));
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ==========================================
// HIGHLIGHT ACTIVE MENU
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('🎯 Highlighting menu for:', currentPage);
    
    // Reset all
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
        const menu = dropdown.querySelector('.dropdown-menu');
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (menu) {
            menu.classList.remove('show');
            menu.style.display = 'none';
        }
        if (toggle) toggle.classList.remove('active');
    });
    
    // Dashboard
    if (currentPage === 'dashboard.html' || currentPage === 'index.html' || currentPage === '') {
        const dashboardLink = document.querySelector('.nav-item[data-page="dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
        return;
    }
    
    // Sub-page
    const activeDropdownItem = document.querySelector(`.dropdown-item[href="${currentPage}"]`);
    
    if (activeDropdownItem) {
        console.log('✅ Found active dropdown item:', activeDropdownItem.textContent.trim());
        
        activeDropdownItem.classList.add('active');
        
        const parentDropdown = activeDropdownItem.closest('.nav-dropdown');
        if (parentDropdown) {
            console.log('✅ Forcing parent dropdown open...');
            
            parentDropdown.classList.add('active');
            
            const menu = parentDropdown.querySelector('.dropdown-menu');
            const toggle = parentDropdown.querySelector('.dropdown-toggle');
            
            if (menu) {
                menu.style.display = 'block';
                menu.classList.add('show');
                console.log('✅ Menu forced open');
            }
            if (toggle) {
                toggle.classList.add('active');
                console.log('✅ Toggle activated');
            }
        }
        return;
    }
    
    // Nav-item biasa
    const activeNavItem = document.querySelector(`.nav-item[href="${currentPage}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// ==========================================
// HANDLE LOGOUT
// ==========================================
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('itcc-current-user');
        window.location.href = 'login.html';
    }
}
