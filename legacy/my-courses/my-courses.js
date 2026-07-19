// edu-web-frontend/my-courses/my-courses.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const myCoursesList = document.getElementById('my-courses-list');
const loadingMessage = document.getElementById('loading-message');
const coursesCount = document.getElementById('courses-count');
const userAvatar = document.getElementById('user-avatar');

let currentUserRole = null; // Foydalanuvchi roli

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners(); // Bir marta event listener qo'shish
    initializeMyCourses();
});

// Event listener'ni bir marta qo'shish (event delegation)
function initializeEventListeners() {
    if (myCoursesList) {
        myCoursesList.addEventListener('click', (e) => {
            // Talaba kurslari uchun "Kurs Materiallariga O'tish" tugmasi
            if (e.target.classList.contains('view-content-btn') || e.target.closest('.view-content-btn')) {
                const button = e.target.classList.contains('view-content-btn') 
                    ? e.target 
                    : e.target.closest('.view-content-btn');
                const courseId = button.dataset.courseId;
                
                if (courseId) {
                    window.location.href = `../lesson-view/lesson-view.html?courseId=${courseId}`;
                }
                return;
            }
            
            // O'qituvchi kurslari uchun "Kursni Ko'rish" tugmasi
            if (e.target.classList.contains('view-btn') || e.target.closest('.view-btn')) {
                const button = e.target.classList.contains('view-btn') 
                    ? e.target 
                    : e.target.closest('.view-btn');
                const courseId = button.dataset.courseId;
                
                if (courseId) {
                    window.location.href = `../course-page/course.html?id=${courseId}`;
                }
                return;
            }
        });
    }
}

// Boshlanish funksiyasi
async function initializeMyCourses() {
    const token = localStorage.getItem('userToken');

    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    try {
        // Foydalanuvchi ma'lumotlarini olish
        await loadUserProfile(token);
        
        // Rolega qarab kurslarni yuklash
        if (currentUserRole === 'teacher' || currentUserRole === 'admin') {
            await fetchMyCreatedCourses(token);
        } else {
            await fetchMyEnrolledCourses(token);
        }
    } catch (error) {
        console.error("Xato:", error);
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        localStorage.removeItem('userToken');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
    }
}

// Foydalanuvchi profilini yuklash
async function loadUserProfile(token) {
    try {
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // User avatar ni ko'rsatish
        const userName = profileResponse.user.name || 'Foydalanuvchi';
        currentUserRole = profileResponse.user.role; // Rolni saqlash
        const initials = getInitials(userName);
        if (userAvatar) {
            userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
        }
    } catch (error) {
        console.error("Profil yuklashda xato:", error);
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

// 1. O'qituvchining yaratgan kurslarini Backenddan yuklash funksiyasi
async function fetchMyCreatedCourses(token) {
    try {
        const response = await apiRequest('/courses/teacher/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const courses = response.courses || [];
        
        // Loading holatini yashirish
        loadingMessage.style.display = 'none';
        
        // Kurslar sonini yangilash
        updateCoursesCount(courses.length);
        
        // Kurslarni ko'rsatish
        displayTeacherCourses(courses);
        
    } catch (error) {
        // Avtorizatsiya xatosi yoki boshqa xatolar uchun
        console.error("Mening kurslarimni yuklashda xato:", error);
        loadingMessage.innerHTML = '<p>Kurslarni yuklashda xato yuz berdi. Iltimos, qayta kiring.</p>';
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        localStorage.removeItem('userToken');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
    }
}

// 2. Talabaning ro'yxatdan o'tilgan kurslarini Backenddan yuklash funksiyasi
async function fetchMyEnrolledCourses(token) {
    try {
        const response = await apiRequest('/enroll/my-courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const courses = response.courses || [];
        
        // Loading holatini yashirish
        loadingMessage.style.display = 'none';
        
        // Kurslar sonini yangilash
        updateCoursesCount(courses.length);
        
        // Kurslarni ko'rsatish
        displayCourses(courses);
        
    } catch (error) {
        // Avtorizatsiya xatosi yoki boshqa xatolar uchun
        console.error("Mening kurslarimni yuklashda xato:", error);
        loadingMessage.innerHTML = '<p>Kurslarni yuklashda xato yuz berdi. Iltimos, qayta kiring.</p>';
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        localStorage.removeItem('userToken');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
    }
}

// Kurslar sonini yangilash
function updateCoursesCount(count) {
    if (coursesCount) {
        coursesCount.textContent = count;
    }
}

// 2. O'qituvchi kurslarini HTMLga joylash
function displayTeacherCourses(courses) {
    myCoursesList.innerHTML = '';

    if (courses.length === 0) {
        displayEmptyStateForTeacher();
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card enrolled-card';
        
        // Yaratilgan sanani formatlash
        const createdAt = course.createdAt 
            ? new Date(course.createdAt).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Noma\'lum';
        
        // Status badge
        const statusBadge = course.isPublished 
            ? '<span class="status-badge published"><i class="fas fa-check-circle"></i> Nashr qilingan</span>'
            : '<span class="status-badge draft"><i class="fas fa-edit"></i> Qoralama</span>';
        
        card.innerHTML = `
            <h4>${course.title || 'Noma\'lum Kurs'}</h4>
            <p>${course.description || 'Tavsif mavjud emas'}</p>
            <div class="course-meta">
                <div class="status">
                    ${statusBadge}
                </div>
                <div class="teacher">
                    <i class="fas fa-calendar"></i>
                    <span>Yaratilgan sana: ${createdAt}</span>
                </div>
                ${course.price ? `
                <div class="price-info">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Narx: ${course.price.toLocaleString('uz-UZ')} so'm</span>
                </div>
                ` : ''}
            </div>
            <div class="course-actions-teacher">
                <a href="../lesson-management/lesson-management.html?courseId=${course._id}" class="action-btn manage-btn">
                    <i class="fas fa-book"></i>
                    Darslarni Boshqarish
                </a>
                <button class="action-btn view-btn" data-course-id="${course._id}">
                    <i class="fas fa-eye"></i>
                    Kursni Ko'rish
                </button>
            </div>
        `;
        myCoursesList.appendChild(card);
    });
}

// 3. Talaba kurslarini HTMLga joylash
function displayCourses(courses) {
    myCoursesList.innerHTML = '';

    // Null kurslarni filtrlash (xavfsizlik uchun)
    const validCourses = courses.filter(course => course && course._id);

    if (validCourses.length === 0) {
        displayEmptyState();
        return;
    }

    validCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card enrolled-card';
        
        // Ro'yxatdan o'tish sanasini formatlash
        const enrollmentDate = course.enrollmentDate 
            ? new Date(course.enrollmentDate).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Noma\'lum';
        
        card.innerHTML = `
            <h4>${course.title || 'Noma\'lum Kurs'}</h4>
            <p>${course.description || 'Tavsif mavjud emas'}</p>
            <div class="course-meta">
                <div class="teacher">
                    <i class="fas fa-user-tie"></i>
                    <span>O'qituvchi: ${course.teacher?.name || 'Noma\'lum'}</span>
                </div>
                <div class="status">
                    <i class="fas fa-calendar-check"></i>
                    <span>Ro'yxatdan o'tish sanasi: ${enrollmentDate}</span>
                </div>
            </div>
            <button class="view-content-btn" data-course-id="${course._id}">
                <i class="fas fa-book-open"></i>
                Kurs Materiallariga O'tish
            </button>
        `;
        myCoursesList.appendChild(card);
    });
}

// Bo'sh holatni ko'rsatish (Talaba uchun)
function displayEmptyState() {
    myCoursesList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-folder-open"></i>
            <h3>Hozirda kurslar mavjud emas</h3>
            <p>Siz hali hech qanday kursga ro'yxatdan o'tmagansiz.</p>
            <a href="../courses/courses.html" class="btn-primary">
                <i class="fas fa-search"></i>
                Kurslarni Ko'rish
            </a>
        </div>
    `;
}

// Bo'sh holatni ko'rsatish (O'qituvchi uchun)
function displayEmptyStateForTeacher() {
    myCoursesList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <h3>Hozirda kurslar mavjud emas</h3>
            <p>Siz hali hech qanday kurs yaratmagansiz. Birinchi kursingizni yarating!</p>
            <a href="../course-manager/course-manager.html" class="btn-primary">
                <i class="fas fa-plus"></i>
                Yangi Kurs Yaratish
            </a>
        </div>
    `;
}

