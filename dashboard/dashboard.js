import { apiRequest } from '../assets/js/api.js';
import { showAlert, showConfirm } from '../assets/js/alert.js';

// Elementlar
const welcomeName = document.getElementById('welcome-name');
const topUsername = document.getElementById('top-username');
const userAvatar = document.getElementById('user-avatar');
const userMenu = document.getElementById('user-menu');

// Statistikalar elementlari
const coursesCount = document.getElementById('courses-count');
const completedCount = document.getElementById('completed-count');
const progressCount = document.getElementById('progress-count');
const certificatesCount = document.getElementById('certificates-count');

document.addEventListener('DOMContentLoaded', initializeDashboard);

async function initializeDashboard() {
    // 1. Tokenni tekshirish
    const token = localStorage.getItem('userToken');

    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    try {
        // 2. Profil ma'lumotlarini olish
        const response = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
        });

        // 3. Ma'lumotlarni sahifada ko'rsatish
        displayProfile(response.user);
        
        // 4. Statistikani yuklash (agar API mavjud bo'lsa)
        // loadStatistics(token);
        
    } catch (error) {
        console.error("Profil yuklashda xato:", error);
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        handleLogout(); 
    }
}

function displayProfile(user) {
    // Ismni boshqa joylarda ham ko'rsatish
    const displayName = user.name || 'Foydalanuvchi';
    welcomeName.textContent = displayName;
    topUsername.textContent = displayName;
    
    // Avatar harflarini ko'rsatish
    const initials = getInitials(displayName);
    userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
    
    // O'qituvchi va admin uchun test boshqarish linkini ko'rsatish
    const testManagementNav = document.getElementById('test-management-nav-item');
    if (testManagementNav && (user.role === 'teacher' || user.role === 'admin')) {
        testManagementNav.style.display = 'flex';
    }
}

// Ismning birinchi harflarini olish
function getInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

// Statistikani yuklash (ixtiyoriy - agar backend API mavjud bo'lsa)
async function loadStatistics(token) {
    try {
        // Misol: Agar statistika API mavjud bo'lsa
        // const statsResponse = await apiRequest('/users/statistics', {
        //     method: 'GET',
        //     headers: {
        //         'Authorization': `Bearer ${token}`
        //     }
        // });
        
        // coursesCount.textContent = statsResponse.courses || 0;
        // completedCount.textContent = statsResponse.completed || 0;
        // progressCount.textContent = `${statsResponse.progress || 0}%`;
        // certificatesCount.textContent = statsResponse.certificates || 0;
        
        // Hozircha default qiymatlar
        coursesCount.textContent = '0';
        completedCount.textContent = '0';
        progressCount.textContent = '0%';
        certificatesCount.textContent = '0';
    } catch (error) {
        console.error("Statistika yuklashda xato:", error);
        // Xato bo'lsa ham default qiymatlar ko'rsatiladi
        coursesCount.textContent = '0';
        completedCount.textContent = '0';
        progressCount.textContent = '0%';
        certificatesCount.textContent = '0';
    }
}

// Chiqish (Logout) funksiyasi
async function handleLogout() {
    const confirmed = await showConfirm('Tizimdan chiqishni tasdiqlaysizmi?', 'Tizimdan chiqish');
    if (confirmed) {
        localStorage.removeItem('userToken');
        showAlert('Tizimdan chiqdingiz.', 'success');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
    }
}

// User menu ga click event qo'shish - profil sahifasiga o'tish
if (userMenu) {
    userMenu.addEventListener('click', () => {
        window.location.href = '../profile/profile.html';
    });
}

// Sidebar navigatsiya aktiv holatini boshqarish
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
    });
});
