// edu-web-frontend/profile/profile.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert, showConfirm } from '../assets/js/alert.js';

// Elementlar
const loadingMessage = document.getElementById('loading-message');
const profileContent = document.getElementById('profile-content');
const userAvatar = document.getElementById('user-avatar');
const topUsername = document.getElementById('top-username');
const profileAvatar = document.getElementById('profile-avatar');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const roleBadge = document.getElementById('role-badge');

// Ma'lumotlar elementlari
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const userAge = document.getElementById('user-age');
const userRole = document.getElementById('user-role');
const userId = document.getElementById('user-id');

// Tahrirlash elementlari
const editProfileBtn = document.getElementById('edit-profile-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');
const editFormSection = document.getElementById('edit-form-section');
const editProfileForm = document.getElementById('edit-profile-form');
const profileSection = document.querySelector('.profile-section');

// Form input elementlari
const editName = document.getElementById('edit-name');
const editEmail = document.getElementById('edit-email');
const editPhone = document.getElementById('edit-phone');
const editAge = document.getElementById('edit-age');

// Logout button
const logoutBtn = document.getElementById('logout-btn');

document.addEventListener('DOMContentLoaded', initializeProfile);

async function initializeProfile() {
    const token = localStorage.getItem('userToken');

    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    try {
        // Profil ma'lumotlarini olish
        const response = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        // Ma'lumotlarni ko'rsatish
        displayProfile(response.user);

    } catch (error) {
        console.error("Profil yuklashda xato:", error);
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
    }
}

function displayProfile(user) {
    const displayName = user.name || 'Foydalanuvchi';
    const initials = getInitials(displayName);

    // Header ma'lumotlari
    profileName.textContent = displayName;
    profileEmail.textContent = user.email || 'Email mavjud emas';
    
    // Avatar
    userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
    topUsername.textContent = displayName;
    profileAvatar.innerHTML = `<span style="font-size: 3rem; font-weight: 600;">${initials}</span>`;

    // Role badge
    const roleText = user.role || 'Foydalanuvchi';
    roleBadge.textContent = roleText;
    userRole.innerHTML = `<span class="role-badge">${roleText}</span>`;

    // Ma'lumotlar
    userName.textContent = displayName;
    userEmail.textContent = user.email || 'Mavjud emas';
    userPhone.textContent = user.phone || 'Mavjud emas';
    userAge.textContent = user.age ? `${user.age} yosh` : 'Mavjud emas';
    userId.textContent = user._id || 'Mavjud emas';

    // Loading holatini yashirish va kontentni ko'rsatish
    loadingMessage.style.display = 'none';
    profileContent.style.display = 'block';
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

// Tahrirlash tugmasini bosish
editProfileBtn.addEventListener('click', () => {
    const token = localStorage.getItem('userToken');
    
    // Joriy ma'lumotlarni formaga yozish
    editName.value = userName.textContent;
    editEmail.value = userEmail.textContent;
    editPhone.value = userPhone.textContent === 'Mavjud emas' ? '' : userPhone.textContent;
    editAge.value = userAge.textContent === 'Mavjud emas' ? '' : userAge.textContent.replace(' yosh', '');

    // Formani ko'rsatish
    profileSection.style.display = 'none';
    editFormSection.style.display = 'block';
});

// Bekor qilish tugmalari
cancelEditBtn.addEventListener('click', closeEditForm);
cancelSaveBtn.addEventListener('click', closeEditForm);

function closeEditForm() {
    editFormSection.style.display = 'none';
    profileSection.style.display = 'block';
}

// Formani yuborish
editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('userToken');
    
    // Ma'lumotlarni tozalash va yig'ish
    const updatedData = {};
    
    const nameValue = editName.value.trim();
    const emailValue = editEmail.value.trim();
    const phoneValue = editPhone.value.trim();
    const ageValue = editAge.value.trim();
    
    // Faqat to'ldirilgan maydonlarni qo'shish
    if (nameValue) {
        updatedData.name = nameValue;
    }
    
    if (emailValue) {
        updatedData.email = emailValue;
    }
    
    if (phoneValue) {
        updatedData.phone = phoneValue;
    }
    
    if (ageValue) {
        const ageNum = parseInt(ageValue);
        if (!isNaN(ageNum) && ageNum > 0) {
            updatedData.age = ageNum;
        }
    }

    // Hech bo'lmaganda bitta maydon to'ldirilganligini tekshirish
    if (Object.keys(updatedData).length === 0) {
        showAlert('Iltimos, kamida bitta maydonni to\'ldiring.', 'warning');
        return;
    }

    try {
        // Backendga so'rov yuborish
        console.log('Profilni yangilash so\'rovi yuborilmoqda:', updatedData);
        const response = await apiRequest('/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        console.log('Profil yangilandi:', response);
        showAlert(response.message || 'Profil muvaffaqiyatli yangilandi!', 'success');
        
        // Ma'lumotlarni qayta yuklash
        await initializeProfile();
        
        // Formani yopish
        closeEditForm();

    } catch (error) {
        console.error('Profilni yangilashda xato:', error);
        // 404 xatosi uchun maxsus xabar
        if (error.message && error.message.includes('404')) {
            showAlert('Backend serverda profil yangilash funksiyasi hali deploy qilinmagan. Iltimos, backend kodini yangilang.', 'error');
        } else {
            showAlert(error.message || 'Profilni yangilashda xato yuz berdi.', 'error');
        }
    }
});

// Logout funksiyasi
logoutBtn.addEventListener('click', async () => {
    const confirmed = await showConfirm('Tizimdan chiqishni tasdiqlaysizmi?', 'Tizimdan chiqish');
    if (confirmed) {
        localStorage.removeItem('userToken');
        showAlert('Tizimdan chiqdingiz.', 'success');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
    }
});
