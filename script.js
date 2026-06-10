const APPS_SCRIPT_URL = 'YOUR_GAS_WEB_APP_URL_HERE';

// 1. FUNGSI INISIALISASI HALAMAN (Panggil ini di setiap halaman HTML)
function initPage(activePageId) {
    // Cek Session
    const token = localStorage.getItem('asset_token');
    const userStr = localStorage.getItem('asset_user');
    
    if (!token || !userStr) {
        window.location.href = 'index.html'; // Redirect ke login jika belum login
        return;
    }

    const user = JSON.parse(userStr);
    
    // Load Sidebar
    loadSidebar(activePageId, user);
    
    // Update nama user di sidebar jika perlu
    const nameEl = document.querySelector('.user-info .name');
    if(nameEl) nameEl.textContent = user.displayName || user.username;
}

// 2. FUNGSI LOAD SIDEBAR DINAMIS
async function loadSidebar(activePageId, user) {
    try {
        const response = await fetch('sidebar.html');
        const html = await response.text();
        document.getElementById('sidebar-container').innerHTML = html;
        
        // Highlight menu yang aktif
        highlightMenu(activePageId);
        
        // Setup Logout
        document.querySelector('.logout-btn').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });

    } catch (error) {
        console.error("Sidebar error:", error);
    }
}

// 3. FUNGSI HIGHLIGHT MENU
function highlightMenu(pageId) {
    // Reset semua active state
    document.querySelectorAll('.nav-link, .submenu a').forEach(el => {
        el.classList.remove('active', 'active-sub');
    });
    document.querySelectorAll('.nav-group').forEach(el => el.classList.remove('open'));

    // Cari link yang cocok dengan pageId
    const activeLink = document.querySelector(`[data-page="${pageId}"]`);
    
    if (activeLink) {
        // Jika dia sub-menu
        if (activeLink.closest('.submenu')) {
            activeLink.classList.add('active-sub');
            const parentGroup = activeLink.closest('.nav-group');
            parentGroup.classList.add('open'); // Buka dropdownnya
            parentGroup.querySelector('.dropdown-toggle').classList.add('active');
        } 
        // Jika dia menu utama (seperti Dashboard)
        else {
            activeLink.classList.add('active');
        }
    }
}
// Fungsi untuk highlight menu berdasarkan URL saat ini
function highlightMenuFromURL() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Reset semua
    document.querySelectorAll('.nav-link, .submenu a').forEach(el => {
        el.classList.remove('active', 'active-sub');
    });
    document.querySelectorAll('.nav-group').forEach(el => el.classList.remove('open'));

    // Cari link yang cocok dengan nama file
    const link = document.querySelector(`[data-target-file="${currentPage}.html"]`);
    if (link) {
        link.classList.add('active');
        
        // Jika dia sub-menu, buka parent-nya
        if (link.closest('.submenu')) {
            const group = link.closest('.nav-group');
            group.classList.add('open');
            group.querySelector('.dropdown-toggle').classList.add('active');
            link.classList.add('active-sub');
        }
    }
}

// Panggil di DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Load sidebar dulu
    loadSidebar();
    
    // Lalu highlight menu berdasarkan halaman yang sedang dibuka
    setTimeout(highlightMenuFromURL, 100);
});
