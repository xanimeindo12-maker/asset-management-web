// ==========================================
// KONFIGURASI
// ==========================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec';
const WORKER_URL = 'https://dse-proxy.xanimeindo12.workers.dev';

// ==========================================
// DETEKSI HALAMAN - IMPROVED
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname;
    const currentPage = pathname.split('/').pop().toLowerCase();
    
    console.log('📄 Full pathname:', pathname);
    console.log('📄 Current page:', currentPage);

    // ✅ Deteksi halaman login
    if (currentPage === 'login.html' || currentPage === 'login') {
        console.log('🔐 Initializing LOGIN page...');
        initLoginPage();
    } 
    // ✅ Deteksi halaman index/root
    else if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
        console.log('📊 Initializing INDEX/DASHBOARD page...');
        handleIndexPage();
    } 
    // ✅ Halaman lainnya (dashboard, inventory, dll)
    else {
        console.log('📱 Initializing APP page:', currentPage);
        initAppPage();
    }
});

// ==========================================
// HANDLE INDEX PAGE
// ==========================================
function handleIndexPage() {
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');

    console.log('🔍 Checking auth - Token:', token ? 'exists' : 'null');

    // Kalau sudah login, load dashboard
    if (token && userStr) {
        console.log('✅ User logged in, loading dashboard...');
        initAppPage();
    } 
    // Kalau belum login, redirect ke login.html
    else {
        console.log('⚠️ Not logged in, redirecting to login.html...');
        window.location.href = 'login.html';
    }
}

// ==========================================
// LOGIKA LOGIN PAGE
// ==========================================
function initLoginPage() {
    console.log('🔐 initLoginPage() called');
    
    // Cek apakah sudah login
    const existingToken = localStorage.getItem('asset_token');
    const existingUser = localStorage.getItem('asset_user');
    
    console.log('🔍 Checking existing session...');
    
    if (existingToken && existingUser) {
        console.log('✅ Already logged in, redirecting to index.html');
        // Tunggu sebentar biar tidak terlalu cepat
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
        return;
    }

    console.log('📝 Setting up login form...');
    
    const form = document.getElementById('login-form');
    if (!form) {
        console.error('❌ Login form NOT found!');
        return;
    }

    // ✅ PENTING: Hapus semua event listener lama
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Tambahkan event listener yang baru
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📝 Login form submitted');
        
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

        console.log('🔑 Attempting login for:', username);

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
        msg.textContent = '';

        try {
            const url = `${APPS_SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            const proxyUrl = `${WORKER_URL}?url=${encodeURIComponent(url)}`;
            
            console.log('📡 Fetching:', proxyUrl);
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);

            if (data.success && data.data) {
                const { token, user } = data.data;
                
                console.log('✅ Login successful, saving to localStorage');
                localStorage.setItem('asset_token', token);
                localStorage.setItem('asset_user', JSON.stringify(user));
                
                msg.textContent = '✅ Login berhasil! Redirecting...';
                msg.style.color = 'green';
                
                // Delay redirect untuk UX yang lebih baik
                setTimeout(() => {
                    console.log('🚀 Redirecting to index.html');
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
    }, { passive: false });

    console.log('✅ Login form setup complete');
}

// ==========================================
// LOGIKA HALAMAN APP
// ==========================================
function initAppPage() {
    console.log('📱 initAppPage() called');
    
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');

    if (!token || !userStr) {
        console.log('⚠️ No auth found, redirecting to login.html');
        window.location.href = 'login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(userStr);
        console.log('👤 User loaded:', user);
    } catch (e) {
        console.error('❌ User data corrupt, clearing storage');
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
    console.log('📋 Loading sidebar...');
    
    const container = document.getElementById('sidebar-container');
    if (!container) {
        console.error('❌ Sidebar container not found');
        return;
    }

    try {
        const response = await fetch('sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');
        
        container.innerHTML = await response.text();
        console.log('✅ Sidebar loaded');

        const nameEl = container.querySelector('.user-info .name');
        const roleEl = container.querySelector('.user-info .role');
        const avatarEl = container.querySelector('.avatar');
        
        if (nameEl) nameEl.textContent = user.displayName || user.username;
        if (roleEl) roleEl.textContent = user.role || 'USER';
        if (avatarEl) avatarEl.textContent = (user.displayName || user.username || 'U').charAt(0).toUpperCase();

        const logoutBtn = container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🚪 User logging out');
                localStorage.clear();
                window.location.href = 'login.html';
            });
        }

        highlightMenuFromURL();
        setupSidebarInteractions();

    } catch (error) {
        console.error("❌ Sidebar error:", error);
        container.innerHTML = '<p style="padding:20px;color:red;">Gagal memuat menu.</p>';
    }
}

function highlightMenuFromURL() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

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
}
