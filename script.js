// ==========================================
// KONFIGURASI
// ==========================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec';

// ✅ CORS Proxy untuk bypass masalah CORS dari GitHub Pages
const CORS_PROXY = 'https://corsproxy.io/?';

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
// HELPER: Fetch dengan CORS Proxy Fallback
// ==========================================
async function fetchWithProxy(url) {
    // Coba langsung dulu (Apps Script seharusnya support CORS untuk GET)
    try {
        const res = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (res.ok) {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                throw new Error('Response bukan JSON valid');
            }
        }
        throw new Error(`HTTP ${res.status}`);
    } catch (directError) {
        console.warn('⚠️ Direct fetch gagal, coba via proxy...', directError.message);
        
        // Fallback: pakai CORS proxy
        const proxyUrl = CORS_PROXY + encodeURIComponent(url);
        const res = await fetch(proxyUrl, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (!res.ok) {
            throw new Error(`Proxy juga gagal: HTTP ${res.status}`);
        }
        
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            throw new Error('Response dari proxy bukan JSON valid');
        }
    }
}

// ==========================================
// LOGIKA KHUSUS HALAMAN LOGIN
// ==========================================
function initLoginPage() {
    // Kalau sudah login, langsung redirect
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
            // ✅ Gunakan GET dengan query parameters
            const url = `${APPS_SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            
            console.log('🔍 Fetching URL:', url);
            
            // ✅ Pakai helper yang sudah handle CORS
            const response = await fetchWithProxy(url);
            
            console.log('📦 Response dari server:', response);

            // ✅ Response dibungkus { success, message, data: { token, user } }
            if (response.success && response.data) {
                const { token, user } = response.data;
                
                localStorage.setItem('asset_token', token);
                localStorage.setItem('asset_user', JSON.stringify(user));
                
                msg.textContent = 'Login berhasil! Redirecting...';
                msg.style.color = 'green';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                msg.textContent = response.message || 'Login gagal.';
                msg.style.color = 'red';
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            console.error('❌ Login Error:', err);
            msg.textContent = 'Gagal terhubung ke server: ' + err.message;
            msg.style.color = 'red';
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

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        console.error('❌ User data corrupt, clearing...');
        localStorage.clear();
        window.location.href = 'index.html';
        return;
    }
    
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
        
        // Setup interaksi dropdown & navigasi
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

    document.querySelectorAll('.nav-link, .submenu a').forEach(el => {
        el.classList.remove('active', 'active-sub');
    });
    document.querySelectorAll('.nav-group').forEach(el => {
        el.classList.remove('open');
    });

    const activeLink = document.querySelector(`[data-target-file="${currentPage}.html"]`);
    
    if (activeLink) {
        if (activeLink.closest('.submenu')) {
            activeLink.classList.add('active-sub');
            const parentGroup = activeLink.closest('.nav-group');
            if (parentGroup) {
                parentGroup.classList.add('open');
                const toggle = parentGroup.querySelector('.dropdown-toggle');
                if (toggle) toggle.classList.add('active');
            }
        } else {
            activeLink.classList.add('active');
        }
    }
}

// ==========================================
// SETUP INTERAKSI DROPDOWN & NAVIGASI
// ==========================================
function setupSidebarInteractions() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            const group = this.closest('.nav-group');
            const isOpen = group.classList.contains('open');
            
            document.querySelectorAll('.nav-group').forEach(g => {
                g.classList.remove('open');
                const otherToggle = g.querySelector('.dropdown-toggle');
                if (otherToggle) otherToggle.setAttribute('aria-expanded', 'false');
            });
            
            if (!isOpen) {
                group.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
                
                const firstSubLink = group.querySelector('.submenu a');
                if (firstSubLink) {
                    window.location.href = firstSubLink.href;
                }
            }
        });
    });

    const submenuLinks = document.querySelectorAll('.submenu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Navigasi normal
        });
    });

    const mainLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    mainLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Navigasi normal
        });
    });
}
