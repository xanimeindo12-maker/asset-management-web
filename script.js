const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec';

// ==========================================
// DETEKSI HALAMAN SAAT INI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'index.html' || currentPage === '') {
        initLoginPage();
    } else {
        initAppPage();
    }
});

// ==========================================
// LOGIKA KHUSUS HALAMAN LOGIN
// ==========================================
function initLoginPage() {
    // Auto redirect jika sudah login
    if (localStorage.getItem('asset_token') && localStorage.getItem('asset_user')) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        const msg = document.getElementById('login-msg');
        const originalText = 'Sign In';

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
        msg.textContent = '';

        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value
                })
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('asset_token', data.token);
                localStorage.setItem('asset_user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                msg.textContent = data.message || 'Invalid credentials';
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            console.error('Login Error:', err);
            msg.textContent = 'Connection failed. Please check network.';
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// ==========================================
// LOGIKA KHUSUS HALAMAN APP (Dashboard, Inventory, dll)
// ==========================================
function initAppPage() {
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');

    // Redirect ke login jika belum login
    if (!token || !userStr) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);
    loadSidebar(user);
}

// ==========================================
// LOAD SIDEBAR DINAMIS + SETUP INTERAKSI
// ==========================================
async function loadSidebar(user) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const response = await fetch('sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');
        
        container.innerHTML = await response.text();

        // Update info user di sidebar
        const nameEl = container.querySelector('.user-info .name');
        const roleEl = container.querySelector('.user-info .role');
        const avatarEl = container.querySelector('.avatar');
        
        if (nameEl) nameEl.textContent = user.displayName || user.username;
        if (roleEl) roleEl.textContent = user.role || 'USER';
        if (avatarEl) avatarEl.textContent = (user.displayName || user.username || 'U').charAt(0).toUpperCase();

        // Setup tombol logout
        const logoutBtn = container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.clear();
                window.location.href = 'index.html';
            });
        }

        // Highlight menu aktif berdasarkan URL
        highlightMenuFromURL();
        
        // ✅ PENTING: Setup interaksi dropdown & navigasi SETELAH sidebar dimuat
        setupSidebarInteractions();

    } catch (error) {
        console.error("Sidebar error:", error);
        container.innerHTML = '<p style="padding:20px;color:red;">Gagal memuat menu.</p>';
    }
}

// ==========================================
// HIGHLIGHT MENU BERDASARKAN URL
// ==========================================
function highlightMenuFromURL() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';

    // Reset semua state aktif
    document.querySelectorAll('.nav-link, .submenu a').forEach(el => {
        el.classList.remove('active', 'active-sub');
    });
    document.querySelectorAll('.nav-group').forEach(el => {
        el.classList.remove('open');
    });

    // Cari link yang cocok dengan halaman saat ini
    const activeLink = document.querySelector(`[data-target-file="${currentPage}.html"]`);
    
    if (activeLink) {
        if (activeLink.closest('.submenu')) {
            // Jika sub-menu, highlight dia & buka parent dropdown
            activeLink.classList.add('active-sub');
            const parentGroup = activeLink.closest('.nav-group');
            if (parentGroup) {
                parentGroup.classList.add('open');
                const toggle = parentGroup.querySelector('.dropdown-toggle');
                if (toggle) toggle.classList.add('active');
            }
        } else {
            // Jika menu utama, langsung highlight
            activeLink.classList.add('active');
        }
    }
}

// ==========================================
// SETUP INTERAKSI DROPDOWN & NAVIGASI
// ==========================================
function setupSidebarInteractions() {
    // 1. Handle klik pada dropdown toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault(); // Mencegah reload halaman
            
            const group = this.closest('.nav-group');
            const isOpen = group.classList.contains('open');
            
            // Tutup semua dropdown lain
            document.querySelectorAll('.nav-group').forEach(g => {
                g.classList.remove('open');
                const otherToggle = g.querySelector('.dropdown-toggle');
                if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
            });
            
            // Toggle dropdown yang diklik
            if (!isOpen) {
                group.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
                
                // Langsung arahkan ke sub-item pertama
                const firstSubLink = group.querySelector('.submenu a');
                if (firstSubLink) {
                    window.location.href = firstSubLink.href;
                }
            }
        });
    });

    // 2. Handle klik pada link submenu (biarkan navigasi normal)
    const submenuLinks = document.querySelectorAll('.submenu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Biarkan browser navigasi ke href
            // highlightMenuFromURL() akan dipanggil di halaman tujuan
        });
    });

    // 3. Handle klik pada link utama non-dropdown
    const mainLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    mainLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Biarkan navigasi normal
        });
    });
}
