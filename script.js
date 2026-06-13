// ==========================================
// KONFIGURASI
// ==========================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec';
const WORKER_URL = 'https://dse-proxy.xanimeindo12.workers.dev';

// ==========================================
// DETEKSI HALAMAN SAAT LOAD
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
// HANDLE INDEX PAGE (REDIRECT LOGIC)
// ==========================================
function handleIndexPage() {
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');

    if (token && userStr) {
        console.log('✅ User logged in, loading dashboard...');
        initAppPage();
    } else {
        console.log('⚠️ Not logged in, redirecting to login.html...');
        window.location.href = 'login.html';
    }
}

// ==========================================
// LOGIKA LOGIN PAGE
// ==========================================
function initLoginPage() {
    console.log('🔐 initLoginPage() called');
    
    const existingToken = localStorage.getItem('asset_token');
    const existingUser = localStorage.getItem('asset_user');
    
    if (existingToken && existingUser) {
        console.log('✅ Already logged in, redirecting to index.html');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
        return;
    }

    const form = document.getElementById('login-form');
    if (!form) {
        console.error('❌ Login form NOT found!');
        return;
    }

    // Toggle Password Visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Clone form untuk hapus event listener lama
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = document.getElementById('btn-login');
        const msg = document.getElementById('login-msg');
        const originalText = btn.innerHTML || 'Sign In';
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            msg.textContent = 'Username dan Password wajib diisi!';
            msg.style.color = 'red';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
        msg.textContent = '';

        try {
            const url = `${APPS_SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            const proxyUrl = `${WORKER_URL}?url=${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                redirect: 'follow',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);

            if (data.success && data.data) {
                const { token, user } = data.data;
                
                localStorage.setItem('asset_token', token);
                localStorage.setItem('asset_user', JSON.stringify(user));
                
                msg.textContent = '✅ Login berhasil! Redirecting...';
                msg.style.color = 'green';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                msg.textContent = data.message || 'Login gagal.';
                msg.style.color = 'red';
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            console.error('❌ Login Error:', err);
            msg.textContent = 'Error: ' + err.message;
            msg.style.color = 'red';
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// ==========================================
// LOGIKA HALAMAN APP (DASHBOARD, DLL)
// ==========================================
function initAppPage() {
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');

    if (!token || !userStr) {
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
    
    // Load data dashboard khusus
    updateDashboardUserInfo(user);
    loadActivityData();
}

// ==========================================
// LOAD SIDEBAR DARI sidebar.html
// ==========================================
async function loadSidebar(user) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch('sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');
        
        container.innerHTML = await response.text();

        // Update user info di sidebar
        const nameEl = container.querySelector('#user-name');
        const roleEl = container.querySelector('.user-role');
        const avatarEl = container.querySelector('.user-avatar');
        
        if (nameEl) nameEl.textContent = user.displayName || user.username;
        if (roleEl) roleEl.textContent = user.role || 'USER';
        if (avatarEl) avatarEl.textContent = (user.displayName || user.username || 'U').charAt(0).toUpperCase();

        // Setup logout button
        const logoutBtn = container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // ✅ SETUP SIDEBAR INTERACTIVE
        setupSidebarInteractive();
        
    } catch (error) {
        console.error("❌ Sidebar error:", error);
        container.innerHTML = '<p style="padding:20px;color:red;">Gagal memuat menu.</p>';
    }
}

// ==========================================
// SIDEBAR INTERACTIVE - FUNGSI UTAMA
// ==========================================
function setupSidebarInteractive() {
    console.log('🎯 Setting up sidebar interactions...');
    
    // 1. Highlight menu aktif berdasarkan URL
    highlightActiveMenu();
    
    // 2. Setup dropdown toggle handlers
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            const parentDropdown = this.closest('.nav-dropdown');
            const dropdownId = parentDropdown.getAttribute('data-dropdown');
            
            handleDropdownClick(dropdownId);
        });
    });
    
    // 3. Setup dropdown item click handlers
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            // Highlight item yang diklik
            document.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
            
            // Parent dropdown juga ikut aktif
            const parentDropdown = this.closest('.nav-dropdown');
            if (parentDropdown) {
                parentDropdown.classList.add('active');
            }
        });
    });
    
    // 4. Setup nav-item click handlers
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Reset semua
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('active'));
            document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            
            // Highlight yang diklik
            this.classList.add('active');
        });
    });
}

// ==========================================
// HIGHLIGHT MENU AKTIF BERDASARKAN URL
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('🎯 Highlighting menu for:', currentPage);
    
    // Reset semua active states
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
        if (menu) menu.classList.remove('show');
        if (toggle) toggle.classList.remove('active');
    });
    
    // Case 1: Halaman utama (index.html / dashboard)
    if (currentPage === 'index.html' || currentPage === '') {
        const dashboardLink = document.querySelector('.nav-item[data-page="dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
        return;
    }
    
    // Case 2: Halaman dengan dropdown (sub-page seperti inventory.html)
    const activeDropdownItem = document.querySelector(`.dropdown-item[href="${currentPage}"]`);
    if (activeDropdownItem) {
        // ✅ Highlight sub-item (jadi ungu)
        activeDropdownItem.classList.add('active');
        
        // ✅ Highlight parent dropdown (jadi ungu juga)
        const parentDropdown = activeDropdownItem.closest('.nav-dropdown');
        if (parentDropdown) {
            parentDropdown.classList.add('active');
            
            // ✅ Buka dropdown menu biar user lihat sub-item yang aktif
            const menu = parentDropdown.querySelector('.dropdown-menu');
            const toggle = parentDropdown.querySelector('.dropdown-toggle');
            
            if (menu) menu.classList.add('show');
            if (toggle) toggle.classList.add('active');
        }
        return;
    }
    
    // Case 3: Halaman nav-item biasa (management_user.html, dll)
    const activeNavItem = document.querySelector(`.nav-item[href="${currentPage}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

// ==========================================
// HANDLE DROPDOWN CLICK (TANPA AUTO-NAVIGATE)
// ==========================================
function handleDropdownClick(dropdownId) {
    const clickedDropdown = document.querySelector(`[data-dropdown="${dropdownId}"]`);
    if (!clickedDropdown) return;
    
    const dropdownMenu = clickedDropdown.querySelector('.dropdown-menu');
    const dropdownToggle = clickedDropdown.querySelector('.dropdown-toggle');
    
    const isOpen = dropdownMenu.classList.contains('show');
    
    // Close semua dropdown lain
    closeAllDropdowns();
    
    if (isOpen) {
        // Kalau sudah terbuka, tutup saja
        dropdownMenu.classList.remove('show');
        dropdownToggle.classList.remove('active');
        clickedDropdown.classList.remove('active');
    } else {
        // Buka dropdown ini - JANGAN AUTO-NAVIGATE
        dropdownMenu.classList.add('show');
        dropdownToggle.classList.add('active');
        clickedDropdown.classList.add('active');
        
        // ❌ HAPUS bagian setTimeout yang auto-navigate
        // User harus klik sub-item sendiri
    }
}

// ==========================================
// CLOSE ALL DROPDOWNS
// ==========================================
function closeAllDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.classList.remove('active');
    });
}

// ==========================================
// HANDLE LOGOUT
// ==========================================
function handleLogout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// ==========================================
// UPDATE USER INFO DI DASHBOARD
// ==========================================
function updateDashboardUserInfo(user) {
    const userName = document.getElementById('user-name');
    const welcomeName = document.getElementById('welcome-name');
    
    if (userName) userName.textContent = user.displayName || user.username;
    if (welcomeName) welcomeName.textContent = user.role || 'Desktop Support Engineer';
}

// ==========================================
// LOAD ACTIVITY DATA
// ==========================================
async function loadActivityData() {
    const container = document.getElementById('activity-list');
    if (!container) return;
    
    const activities = [
        {
            title: 'Jadwal PM - BTSJAGINB24005',
            badge: 'PM PROGRAM',
            desc: 'Rencana Pemeliharaan Berkala • PIC: Arief',
            date: '2026-06-08'
        },
        {
            title: 'Jadwal PM - BTSJAGINB24001',
            badge: 'PM PROGRAM',
            desc: 'Rencana Pemeliharaan Berkala • PIC: Waluyo',
            date: '2026-06-05'
        },
        {
            title: 'Jadwal PM - BTSJAGINB23009',
            badge: 'PM PROGRAM',
            desc: 'Rencana Pemeliharaan Berkala • PIC: Risky Tri',
            date: '2026-06-04'
        }
    ];

    container.innerHTML = activities.map(act => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fa-regular fa-clock"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${act.title}</div>
                <div class="activity-desc">${act.desc}</div>
                <div class="activity-meta">
                    <span class="activity-badge">${act.badge}</span>
                    <span class="activity-date">
                        <i class="fa-regular fa-calendar"></i>
                        ${act.date}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}
