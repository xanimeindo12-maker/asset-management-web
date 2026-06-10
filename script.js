// GANTI DENGAN URL DEPLOYMENT APPS SCRIPT KAMU
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxb_RaZ1V4C6jn8QDIiutCjdnVqEahh8w6iGvaH-8-5I_OZfVUF2MTgFFijX0AntlO/exec'; 

// STATE MANAGEMENT
let currentUser = null;
let currentToken = localStorage.getItem('asset_token');

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    if (currentToken) {
        validateSessionAndLoad();
    } else {
        showPage('login-page');
    }

    // Login Handler
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Navigation Handler
    document.querySelectorAll('.nav-link[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(e.currentTarget.dataset.target);
        });
    });

    // Logout Handler
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
});

// AUTH FUNCTIONS
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const msg = document.getElementById('login-msg');
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    msg.textContent = '';

    try {
        const res = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                username: document.getElementById('username').value,
                password: document.getElementById('password').value
            })
        });
        const data = await res.json();

        if (data.success) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('asset_token', currentToken);
            initApp();
        } else {
            msg.textContent = data.message;
        }
    } catch (err) {
        msg.textContent = 'Gagal terhubung ke server.';
    } finally {
        btn.innerHTML = 'Masuk <i class="fa-solid fa-arrow-right"></i>';
    }
}

async function validateSessionAndLoad() {
    // Di real app, kita validasi token ke backend dulu
    // Untuk simplifikasi, kita langsung load jika ada token
    initApp();
}

function handleLogout() {
    localStorage.removeItem('asset_token');
    currentToken = null;
    currentUser = null;
    location.reload();
}

// APP LOGIC
function initApp() {
    showPage('main-app');
    document.getElementById('user-display-name').textContent = currentUser.displayName;
    document.getElementById('user-role').textContent = currentUser.role;
    loadDashboardData();
}

function switchTab(targetId) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`.nav-link[data-target="${targetId}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.getElementById(targetId).classList.remove('hidden');
    
    document.getElementById('page-title').textContent = targetId.charAt(0).toUpperCase() + targetId.slice(1);
}

async function loadDashboardData() {
    try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getKPIData&token=${currentToken}`);
        const result = await res.json();
        
        if (result.success) {
            const kpi = result.data;
            
            // Update MOHH
            document.getElementById('kpi-mohh-percent').textContent = kpi.mohh.percentage + '%';
            document.getElementById('kpi-mohh-detail').textContent = `Actual: ${kpi.mohh.actual} / Total: ${kpi.mohh.total} Jam`;
            
            // Update PM Compliance
            document.getElementById('kpi-pm-percent').textContent = kpi.pmCompliance.percentage + '%';
            document.getElementById('kpi-pm-detail').textContent = `Selesai: ${kpi.pmCompliance.completed} / Target: ${kpi.pmCompliance.target}`;
            
            // Update Assets Count
            document.getElementById('kpi-assets-count').textContent = kpi.unitsInUse;
            
            // Update Period Label
            document.getElementById('current-period-label').textContent = kpi.period;
        }
    } catch (err) {
        console.error('Error loading KPI:', err);
    }
}
// 1. Load Sidebar saat aplikasi dimulai
async function loadSidebar() {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;
        
        // Setelah sidebar dimuat, aktifkan logika interaktifnya
        initSidebarLogic();
    } catch (error) {
        console.error("Gagal memuat sidebar:", error);
    }
}

// 2. Inisialisasi Logika Sidebar (Dropdown & Navigasi)
function initSidebarLogic() {
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    const navLinks = document.querySelectorAll('.nav-link[data-page], .submenu a');

    // LOGIKA DROPDOWN
    dropdowns.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const group = toggle.parentElement;
            
            // Cek apakah grup ini sedang terbuka
            const isOpen = group.classList.contains('open');

            // TUTUP SEMUA DROPDOWN LAINNYA (Auto-close behavior)
            document.querySelectorAll('.nav-group').forEach(g => {
                g.classList.remove('open');
            });

            // Jika tadi tertutup, sekarang buka & arahkan ke sub-item pertama
            if (!isOpen) {
                group.classList.add('open');
                
                // Cari link pertama di submenu dan simulasikan klik
                const firstSubLink = group.querySelector('.submenu a');
                if (firstSubLink) {
                    navigateToPage(firstSubLink.dataset.page, firstSubLink.textContent);
                    
                    // Highlight sub-item pertama
                    document.querySelectorAll('.submenu a').forEach(a => a.classList.remove('active-sub'));
                    firstSubLink.classList.add('active-sub');
                }
            }
        });
    });

    // LOGIKA NAVIGASI HALAMAN
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            const title = link.textContent.trim();
            
            navigateToPage(page, title);

            // Update status aktif di sidebar
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.submenu a').forEach(a => a.classList.remove('active-sub'));
            
            // Jika ini sub-item, highlight dia & parent-nya
            if (link.closest('.submenu')) {
                link.classList.add('active-sub');
                link.closest('.nav-group').querySelector('.dropdown-toggle').classList.add('active');
            } else {
                link.classList.add('active');
            }
        });
    });
}

// 3. Fungsi Navigasi Halaman (Simulasi SPA)
function navigateToPage(pageId, title) {
    document.getElementById('page-title').textContent = title;
    
    // Di sini nanti kita load konten spesifik berdasarkan pageId
    // Contoh sederhana:
    const contentDiv = document.getElementById('dynamic-content');
    
    if (pageId === 'dashboard') {
        contentDiv.innerHTML = '<div class="kpi-grid">...Konten Dashboard...</div>';
    } else if (pageId === 'all-assets') {
        contentDiv.innerHTML = '<h3>Semua Aset List</h3><p>Tabel aset akan muncul di sini.</p>';
    } else if (pageId === 'daily-logs') {
        contentDiv.innerHTML = '<h3>Daily Activity Logs</h3><p>Form input aktivitas harian.</p>';
    }
    // Tambahkan kondisi else-if untuk halaman lainnya...
}

// Panggil loadSidebar() setelah login berhasil di fungsi initApp()
function initApp() {
    showPage('main-app');
    loadSidebar(); // <-- TAMBAHKAN INI
    // ... kode user info lainnya ...
}
// HELPER UI
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}
// Fungsi untuk merender Dashboard Overview (Sesuai Gambar 1)
function renderDashboard() {
    return `
        <div class="welcome-banner">
            <h1>Welcome back, Desktop Support Engineer</h1>
            <p>Here is the latest status of your IT DSE Operations.</p>
        </div>

        <div class="kpi-grid">
            <!-- Card 1: Total Assets -->
            <div class="kpi-card">
                <div class="kpi-icon blue"><i class="fa-solid fa-database"></i></div>
                <div class="kpi-info">
                    <h3>Total Assets</h3>
                    <div class="value">181</div>
                    <div class="sub">IT devices in system</div>
                </div>
            </div>

            <!-- Card 2: Active Maintenance -->
            <div class="kpi-card">
                <div class="kpi-icon orange"><i class="fa-solid fa-wrench"></i></div>
                <div class="kpi-info">
                    <h3>Active Maintenance</h3>
                    <div class="value">3</div>
                    <div class="sub">Pending PM tasks</div>
                </div>
            </div>

            <!-- Card 3: Pending PM -->
            <div class="kpi-card">
                <div class="kpi-icon green"><i class="fa-regular fa-clock"></i></div>
                <div class="kpi-info">
                    <h3>Pending PM (Juni)</h3>
                    <div class="value">3</div>
                    <div class="sub">For the current month</div>
                </div>
            </div>
        </div>

        <div class="kpi-grid">
            <!-- Row 2 Cards -->
            <div class="kpi-card" style="justify-content: space-between;">
                <div class="kpi-info">
                    <h3>Assets In Use</h3>
                    <div class="value">176</div>
                </div>
                <span class="status-badge active">Active</span>
            </div>

            <div class="kpi-card" style="justify-content: space-between;">
                <div class="kpi-info">
                    <h3>Assets In Stok</h3>
                    <div class="value">4</div>
                </div>
                <span class="status-badge available">Available</span>
            </div>

            <div class="kpi-card" style="justify-content: space-between;">
                <div class="kpi-info">
                    <h3>Total Breakdown</h3>
                    <div class="value">1</div>
                </div>
                <span class="status-badge urgent">Urgent</span>
            </div>
        </div>
        
        <div class="kpi-grid" style="grid-template-columns: 1fr 1fr;">
             <div class="kpi-card" style="justify-content: space-between;">
                <div class="kpi-info">
                    <h3>Expiring Warranty</h3>
                    <div class="value">0</div>
                </div>
                <span class="status-badge" style="background:#fef3c7; color:#d97706">Action Req.</span>
            </div>
             <div class="kpi-card" style="justify-content: space-between;">
                <div class="kpi-info">
                    <h3>Avg Weekly PA</h3>
                    <div class="value">100.00%</div>
                </div>
                <span class="status-badge" style="background:#f3f4f6; color:#4b5563">Overall</span>
            </div>
        </div>
    `;
}

// Update fungsi navigateToPage di script.js sebelumnya
function navigateToPage(pageId, title) {
    document.querySelector('.current-page').textContent = title;
    const contentDiv = document.getElementById('dynamic-content');
    
    if (pageId === 'dashboard') {
        contentDiv.innerHTML = renderDashboard();
    } else {
        contentDiv.innerHTML = `<div class="welcome-banner"><h1>${title}</h1><p>Halaman ini sedang dalam pengembangan.</p></div>`;
    }
}
