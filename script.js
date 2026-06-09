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

// HELPER UI
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}