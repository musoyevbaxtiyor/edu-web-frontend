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
const coinsCount = document.getElementById('coins-count');
const totalScore = document.getElementById('total-score');

// Ballar elementlari
const scoresSection = document.getElementById('scores-section');
const submissionScore = document.getElementById('submission-score');
const testScore = document.getElementById('test-score');
const totalScoreDetail = document.getElementById('total-score-detail');
const rank = document.getElementById('rank');
const completedLessonsScore = document.getElementById('completed-lessons-score');
const testAccuracy = document.getElementById('test-accuracy');

// Xabarlar elementlari
const dashboardView = document.getElementById('dashboard-view');
const notificationsView = document.getElementById('notifications-view');
const notificationsNavItem = document.getElementById('notifications-nav-item');
const notificationsBadge = document.getElementById('notifications-badge');
const notificationsList = document.getElementById('notifications-list');
const notificationsLoading = document.getElementById('notifications-loading');
const notificationsEmpty = document.getElementById('notifications-empty');
const refreshNotificationsBtn = document.getElementById('refresh-notifications-btn');

let currentUserRole = null;

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
        currentUserRole = response.user.role;
        
        // 4. Statistikani yuklash
        await loadStatistics(token);
        
        // 5. Ballarni yuklash (faqat studentlar uchun)
        if (currentUserRole === 'student') {
            await loadMyScores(token);
        }
        
        // 6. Xabarlar sonini yuklash
        await loadNotificationsCount(token);
        
        // 7. Event listener'larni qo'shish
        setupEventListeners(token);
        
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

// Statistikani yuklash
async function loadStatistics(token) {
    try {
        const statsResponse = await apiRequest('/users/statistics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Statistikalarni ko'rsatish
        if (coursesCount) {
            coursesCount.textContent = statsResponse.courses || 0;
        }
        if (completedCount) {
            completedCount.textContent = statsResponse.completed || 0;
        }
        if (progressCount) {
            progressCount.textContent = `${statsResponse.progress || 0}%`;
        }
        if (certificatesCount) {
            certificatesCount.textContent = statsResponse.certificates || 0;
        }
        if (coinsCount) {
            coinsCount.textContent = statsResponse.coins || 0;
        }
    } catch (error) {
        console.error("Statistika yuklashda xato:", error);
        // Xato bo'lsa ham default qiymatlar ko'rsatiladi
        if (coursesCount) coursesCount.textContent = '0';
        if (completedCount) completedCount.textContent = '0';
        if (progressCount) progressCount.textContent = '0%';
        if (certificatesCount) certificatesCount.textContent = '0';
        if (coinsCount) coinsCount.textContent = '0';
    }
}

// Ballarni yuklash (faqat studentlar uchun)
async function loadMyScores(token) {
    try {
        const scoresResponse = await apiRequest('/users/my-scores', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Stats card'da umumiy ballni ko'rsatish
        if (totalScore) {
            totalScore.textContent = scoresResponse.totalScore || 0;
        }

        // Ballar bo'limini ko'rsatish
        if (scoresSection) {
            scoresSection.style.display = 'block';
        }

        // Ballarni ko'rsatish
        if (submissionScore) {
            submissionScore.textContent = scoresResponse.submissionScore || 0;
        }
        if (testScore) {
            testScore.textContent = scoresResponse.testScore || 0;
        }
        if (totalScoreDetail) {
            totalScoreDetail.textContent = scoresResponse.totalScore || 0;
        }
        if (rank) {
            rank.textContent = scoresResponse.rank || '-';
        }
        if (completedLessonsScore) {
            completedLessonsScore.textContent = scoresResponse.completedLessons || 0;
        }
        if (testAccuracy) {
            testAccuracy.textContent = `${scoresResponse.testAccuracy || 0}%`;
        }

    } catch (error) {
        console.error("Ballar yuklashda xato:", error);
        // Xato bo'lsa ham default qiymatlar ko'rsatiladi
        if (totalScore) totalScore.textContent = '0';
        if (submissionScore) submissionScore.textContent = '0';
        if (testScore) testScore.textContent = '0';
        if (totalScoreDetail) totalScoreDetail.textContent = '0';
        if (rank) rank.textContent = '-';
        if (completedLessonsScore) completedLessonsScore.textContent = '0';
        if (testAccuracy) testAccuracy.textContent = '0%';
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

// Event listener'larni sozlash
function setupEventListeners(token) {
    // Xabarlar nav item
    if (notificationsNavItem) {
        notificationsNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            showNotificationsView(token);
        });
    }

    // Refresh notifications button
    if (refreshNotificationsBtn) {
        refreshNotificationsBtn.addEventListener('click', () => {
            loadNotifications(token);
        });
    }

    // Sidebar navigatsiya aktiv holatini boshqarish
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.id !== 'notifications-nav-item') {
            item.addEventListener('click', function(e) {
                if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                }
                // Dashboard view'ni ko'rsatish
                if (dashboardView) dashboardView.style.display = 'block';
                if (notificationsView) notificationsView.style.display = 'none';
            });
        }
    });
}

// Xabarlar ko'rinishini ko'rsatish
async function showNotificationsView(token) {
    if (dashboardView) dashboardView.style.display = 'none';
    if (notificationsView) notificationsView.style.display = 'block';
    
    // Aktiv holatni o'zgartirish
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (notificationsNavItem) notificationsNavItem.classList.add('active');
    
    // Xabarlarni yuklash
    await loadNotifications(token);
}

// Xabarlar sonini yuklash
async function loadNotificationsCount(token) {
    try {
        const response = await apiRequest('/users/notifications', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const count = response.notifications?.length || 0;
        if (notificationsBadge) {
            notificationsBadge.textContent = count;
            if (count === 0) {
                notificationsBadge.style.display = 'none';
            } else {
                notificationsBadge.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error("Xabarlar sonini yuklashda xato:", error);
    }
}

// Xabarlarni yuklash va ko'rsatish
async function loadNotifications(token) {
    try {
        if (notificationsLoading) notificationsLoading.style.display = 'flex';
        if (notificationsEmpty) notificationsEmpty.style.display = 'none';
        if (notificationsList) notificationsList.innerHTML = '';

        const response = await apiRequest('/users/notifications', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const notifications = response.notifications || [];

        if (notificationsLoading) notificationsLoading.style.display = 'none';

        if (notifications.length === 0) {
            if (notificationsEmpty) notificationsEmpty.style.display = 'block';
            if (notificationsList) notificationsList.innerHTML = '';
        } else {
            if (notificationsEmpty) notificationsEmpty.style.display = 'none';
            displayNotifications(notifications);
        }

        // Badge'ni yangilash
        if (notificationsBadge) {
            notificationsBadge.textContent = notifications.length;
            if (notifications.length === 0) {
                notificationsBadge.style.display = 'none';
            } else {
                notificationsBadge.style.display = 'flex';
            }
        }

    } catch (error) {
        console.error("Xabarlarni yuklashda xato:", error);
        if (notificationsLoading) notificationsLoading.style.display = 'none';
        if (notificationsEmpty) notificationsEmpty.style.display = 'block';
        showAlert("Xabarlarni yuklashda xato yuz berdi.", 'error');
    }
}

// Xabarlarni ko'rsatish
function displayNotifications(notifications) {
    if (!notificationsList) return;

    notificationsList.innerHTML = notifications.map(notif => {
        const date = new Date(notif.date).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = notif.status === 'approved' ? 'notification-success' : 
                           notif.status === 'rejected' ? 'notification-error' : 
                           'notification-info';
        
        const icon = notif.status === 'approved' ? 'fa-check-circle' :
                    notif.status === 'rejected' ? 'fa-times-circle' :
                    'fa-bell';

        let actionButton = '';
        if (currentUserRole === 'student' && notif.status === 'approved' && notif.courseId) {
            actionButton = `<a href="../lesson-view/lesson-view.html?courseId=${notif.courseId}" class="notification-action-btn">
                <i class="fas fa-eye"></i> Kursni Ko'rish
            </a>`;
        } else if ((currentUserRole === 'teacher' || currentUserRole === 'admin') && (notif.status === 'submitted' || notif.status === 'in_review')) {
            actionButton = `<a href="../teacher-panel/teacher-panel.html" class="notification-action-btn">
                <i class="fas fa-check"></i> Tekshirish
            </a>`;
        }

        return `
            <div class="notification-item ${statusClass}">
                <div class="notification-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <h4>${escapeHtml(notif.title)}</h4>
                    <p>${escapeHtml(notif.message)}</p>
                    <div class="notification-meta">
                        <span class="notification-course">${escapeHtml(notif.course)}</span>
                        <span class="notification-date">${date}</span>
                    </div>
                    ${notif.coins && notif.coins > 0 ? `
                        <div class="notification-coins">
                            <i class="fas fa-coins"></i>
                            <span>+${notif.coins} coins</span>
                        </div>
                    ` : ''}
                </div>
                ${actionButton ? `<div class="notification-actions">${actionButton}</div>` : ''}
            </div>
        `;
    }).join('');
}

// HTML xavfsizligi uchun funksiya
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
