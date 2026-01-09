// edu-web-frontend/my-courses/my-courses.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const myCoursesList = document.getElementById('my-courses-list');
const loadingMessage = document.getElementById('loading-message');
const coursesCount = document.getElementById('courses-count');
const userAvatar = document.getElementById('user-avatar');

document.addEventListener('DOMContentLoaded', initializeMyCourses);

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
        
        // Kurslarni yuklash
        await fetchMyEnrolledCourses(token);
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

// 1. Ro'yxatdan o'tilgan kurslarni Backenddan yuklash funksiyasi
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

// 2. Kurslarni HTMLga joylash
function displayCourses(courses) {
    myCoursesList.innerHTML = '';

    if (courses.length === 0) {
        displayEmptyState();
        return;
    }

    courses.forEach(course => {
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
    
    // Tugmalar mantiqini qo'shamiz
    addContentViewListeners();
}

// Bo'sh holatni ko'rsatish
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

// 3. Tugmalarni tinglovchi funksiya
function addContentViewListeners() {
    // myCoursesList konteyneriga klik hodisasi tinglovchisini qo'shamiz
    myCoursesList.addEventListener('click', (e) => {
        // Agar bosilgan element "view-content-btn" klassiga ega bo'lsa
        if (e.target.classList.contains('view-content-btn') || e.target.closest('.view-content-btn')) {
            const button = e.target.classList.contains('view-content-btn') 
                ? e.target 
                : e.target.closest('.view-content-btn');
            const courseId = button.dataset.courseId;
            
            if (courseId) {
                // Kurs materiallari sahifasiga yo'naltiramiz
                window.location.href = `../lesson-view/lesson-view.html?courseId=${courseId}`;
            }
        }
    });
}
