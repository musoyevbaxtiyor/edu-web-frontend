import { apiRequest, BASE_SERVER_URL } from '../assets/js/api.js';
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

// Vazifalar jadvali (o'qituvchi)
const tasksTableView = document.getElementById('tasks-table-view');
const tasksTableNavItem = document.getElementById('tasks-table-nav-item');
const tasksTableLoading = document.getElementById('tasks-table-loading');
const tasksTableEmpty = document.getElementById('tasks-table-empty');
const tasksTableWrapper = document.getElementById('tasks-table-wrapper');
const tasksTableBody = document.getElementById('tasks-table-body');
const refreshTasksTableBtn = document.getElementById('refresh-tasks-table-btn');

// User Info (admin)
const userInfoView = document.getElementById('user-info-view');
const userInfoNavItem = document.getElementById('user-info-nav-item');
const userInfoLoading = document.getElementById('user-info-loading');
const userInfoEmpty = document.getElementById('user-info-empty');
const userInfoWrapper = document.getElementById('user-info-wrapper');
const userInfoBody = document.getElementById('user-info-body');
const refreshUserInfoBtn = document.getElementById('refresh-user-info-btn');

const userEditModal = document.getElementById('user-edit-modal');
const userEditModalClose = document.getElementById('user-edit-modal-close');
const userEditModalCancel = document.getElementById('user-edit-modal-cancel');
const userEditModalBackdrop = document.querySelector('.user-edit-modal-backdrop');
const userEditInfoGrid = document.getElementById('user-edit-info-grid');
const userEditPasswordForm = document.getElementById('user-edit-password-form');
const userEditNewPassword = document.getElementById('user-edit-new-password');
const userEditConfirmPassword = document.getElementById('user-edit-confirm-password');

// Telegram bot elementlari
const telegramCard = document.getElementById('telegram-card');
const telegramStatus = document.getElementById('telegram-status');
const telegramConnectBtn = document.getElementById('telegram-connect-btn');

let currentUserRole = null;
let lastLoadedUsers = [];
let userInfoToken = null;
let currentEditUser = null;

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
        
        // 6. Telegram bot ma'lumotlarini yuklash
        await loadTelegramBotInfo(token);
        
        // 7. Telegram bot tugmasiga event listener qo'shish
        if (telegramConnectBtn) {
            telegramConnectBtn.addEventListener('click', () => handleTelegramConnect(token));
        }
        
        // 8. Xabarlar sonini yuklash
        await loadNotificationsCount(token);
        
        // 9. Event listener'larni qo'shish
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
    
    // O'qituvchi va admin uchun test boshqarish
    const testManagementNav = document.getElementById('test-management-nav-item');
    if (testManagementNav && (user.role === 'teacher' || user.role === 'admin')) {
        testManagementNav.style.display = 'flex';
    }
    // Admin uchun User Info
    const userInfoNav = document.getElementById('user-info-nav-item');
    if (userInfoNav && user.role === 'admin') {
        userInfoNav.style.display = 'flex';
    }
    // Vazifalar jadvali hammaga ko'rinadi
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

    // Vazifalar jadvali nav item
    if (tasksTableNavItem) {
        tasksTableNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            showTasksTableView(token);
        });
    }

    // User Info nav item (admin)
    if (userInfoNavItem) {
        userInfoNavItem.addEventListener('click', (e) => {
            e.preventDefault();
            showUserInfoView(token);
        });
    }

    // Refresh notifications button
    if (refreshNotificationsBtn) {
        refreshNotificationsBtn.addEventListener('click', () => {
            loadNotifications(token);
        });
    }

    // Refresh tasks table button
    if (refreshTasksTableBtn) {
        refreshTasksTableBtn.addEventListener('click', () => {
            loadTasksTable(token);
        });
    }

    // Vazifa yuklab olish: API orqali (ZIP va boshqa formatlar ishlaydi), yangi tab ochilmasdan
    if (tasksTableBody) {
        tasksTableBody.addEventListener('click', async (e) => {
            const link = e.target.closest('.tasks-download-link');
            if (!link) return;
            e.preventDefault();
            const url = link.getAttribute('data-download-url');
            const name = link.getAttribute('data-download-name') || 'vazifa-fayl';
            if (!url) return;
            const t = localStorage.getItem('userToken');
            if (!t) {
                showAlert('Avtorizatsiya kerak.', 'error');
                return;
            }
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${t}` }
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || 'Fayl yuklanmadi');
                }
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = name;
                a.click();
                URL.revokeObjectURL(a.href);
            } catch (err) {
                showAlert('Faylni yuklab olish mumkin emas. ' + (err.message || ''), 'error');
            }
        });
    }

    // Refresh user info button
    if (refreshUserInfoBtn) {
        refreshUserInfoBtn.addEventListener('click', () => {
            userInfoToken = token;
            loadUserInfo(token);
        });
    }

    // User Info: qator bosish (modal)
    setupUserInfoRowClick();

    // User Edit Modal: yopish, form submit
    if (userEditModalClose) userEditModalClose.addEventListener('click', closeUserEditModal);
    if (userEditModalCancel) userEditModalCancel.addEventListener('click', closeUserEditModal);
    if (userEditModalBackdrop) userEditModalBackdrop.addEventListener('click', closeUserEditModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && userEditModal && userEditModal.style.display === 'flex') closeUserEditModal();
    });
    if (userEditPasswordForm) {
        userEditPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPw = userEditNewPassword?.value?.trim();
            const confirmPw = userEditConfirmPassword?.value?.trim();
            if (!newPw || newPw.length < 6) {
                showAlert('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak.', 'warning');
                return;
            }
            if (newPw !== confirmPw) {
                showAlert('Parol va tasdiqlash mos kelmadi.', 'warning');
                return;
            }
            if (!currentEditUser?._id || !userInfoToken) return;
            try {
                await apiRequest(`/users/admin/${currentEditUser._id}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfoToken}` },
                    body: JSON.stringify({ newPassword: newPw })
                });
                showAlert('Parol muvaffaqiyatli o\'zgartirildi.', 'success');
                closeUserEditModal();
                await loadUserInfo(userInfoToken);
            } catch (err) {
                console.error('Parol o\'zgartirishda xato:', err);
                showAlert(err.message || 'Parol o\'zgartirishda xato yuz berdi.', 'error');
            }
        });
    }

    // Sidebar navigatsiya aktiv holatini boshqarish
    document.querySelectorAll('.nav-item').forEach(item => {
        const specialIds = ['notifications-nav-item', 'tasks-table-nav-item', 'user-info-nav-item'];
        if (!specialIds.includes(item.id)) {
            item.addEventListener('click', function(e) {
                if (this.getAttribute('href') === '#') {
                    e.preventDefault();
                }
                if (dashboardView) dashboardView.style.display = 'block';
                if (notificationsView) notificationsView.style.display = 'none';
                if (tasksTableView) tasksTableView.style.display = 'none';
                if (userInfoView) userInfoView.style.display = 'none';
            });
        }
    });
}

// Xabarlar ko'rinishini ko'rsatish
async function showNotificationsView(token) {
    if (dashboardView) dashboardView.style.display = 'none';
    if (notificationsView) notificationsView.style.display = 'block';
    if (tasksTableView) tasksTableView.style.display = 'none';
    if (userInfoView) userInfoView.style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (notificationsNavItem) notificationsNavItem.classList.add('active');
    await loadNotifications(token);
}

// Vazifalar jadvali ko'rinishini ko'rsatish
async function showTasksTableView(token) {
    if (dashboardView) dashboardView.style.display = 'none';
    if (notificationsView) notificationsView.style.display = 'none';
    if (tasksTableView) tasksTableView.style.display = 'block';
    if (userInfoView) userInfoView.style.display = 'none';
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (tasksTableNavItem) tasksTableNavItem.classList.add('active');
    await loadTasksTable(token);
}

// User Info ko'rinishini ko'rsatish (admin)
async function showUserInfoView(token) {
    userInfoToken = token;
    if (dashboardView) dashboardView.style.display = 'none';
    if (notificationsView) notificationsView.style.display = 'none';
    if (tasksTableView) tasksTableView.style.display = 'none';
    if (userInfoView) userInfoView.style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (userInfoNavItem) userInfoNavItem.classList.add('active');
    await loadUserInfo(token);
}

// User Info yuklash
async function loadUserInfo(token) {
    if (!userInfoLoading || !userInfoEmpty || !userInfoWrapper || !userInfoBody) return;
    userInfoLoading.style.display = 'flex';
    userInfoEmpty.style.display = 'none';
    userInfoWrapper.style.display = 'none';
    userInfoBody.innerHTML = '';

    try {
        const res = await apiRequest('/users/admin/all', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = res.users || [];
        lastLoadedUsers = users;
        userInfoLoading.style.display = 'none';

        if (users.length === 0) {
            userInfoEmpty.style.display = 'block';
        } else {
            userInfoWrapper.style.display = 'block';
            displayUserInfoTable(users);
        }
    } catch (err) {
        console.error('User Info yuklashda xato:', err);
        userInfoLoading.style.display = 'none';
        userInfoEmpty.style.display = 'block';
        showAlert('Foydalanuvchilarni yuklashda xato yuz berdi.', 'error');
    }
}

// User Info jadvalini ko'rsatish
function displayUserInfoTable(users) {
    if (!userInfoBody) return;
    const roleLabels = { student: 'O\'quvchi', teacher: 'O\'qituvchi', admin: 'Admin' };

    userInfoBody.innerHTML = users.map((u, i) => {
        const role = roleLabels[u.role] || u.role || '—';
        const name = u.name || '—';
        const age = u.age != null ? u.age : '—';
        const email = u.email || '—';
        const phone = u.phone || '—';
        const coins = u.coins != null ? u.coins : '—';
        const createdAt = u.createdAt ? new Date(u.createdAt).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        return `<tr class="user-info-row" data-user-id="${escapeHtml(u._id)}" title="Bosib parolni o'zgartirish">
            <td>${i + 1}</td>
            <td><span class="user-role-badge user-role-${u.role || 'student'}">${escapeHtml(role)}</span></td>
            <td>${escapeHtml(name)}</td>
            <td>${age}</td>
            <td>${escapeHtml(email)}</td>
            <td>${escapeHtml(phone)}</td>
            <td>••••••</td>
            <td>${coins}</td>
            <td>${escapeHtml(createdAt)}</td>
        </tr>`;
    }).join('');
}

// User Edit Modal: ochish
function openUserEditModal(user) {
    if (!userEditModal || !userEditInfoGrid) return;
    currentEditUser = user;
    const roleLabels = { student: 'O\'quvchi', teacher: 'O\'qituvchi', admin: 'Admin' };
    const role = roleLabels[user.role] || user.role || '—';
    const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    userEditInfoGrid.innerHTML = `
        <div class="user-edit-info-item"><strong>Ism:</strong> ${escapeHtml(user.name || '—')}</div>
        <div class="user-edit-info-item"><strong>Rol:</strong> <span class="user-role-badge user-role-${user.role || 'student'}">${escapeHtml(role)}</span></div>
        <div class="user-edit-info-item"><strong>Yosh:</strong> ${user.age != null ? user.age : '—'}</div>
        <div class="user-edit-info-item"><strong>Email:</strong> ${escapeHtml(user.email || '—')}</div>
        <div class="user-edit-info-item"><strong>Telefon:</strong> ${escapeHtml(user.phone || '—')}</div>
        <div class="user-edit-info-item"><strong>Coins:</strong> ${user.coins != null ? user.coins : '—'}</div>
        <div class="user-edit-info-item"><strong>Ro'yxatdan o'tgan:</strong> ${escapeHtml(createdAt)}</div>
        <div class="user-edit-info-item"><strong>Parol:</strong> <span class="text-muted">•••••• (yashirilgan)</span></div>
    `;
    if (userEditPasswordForm) userEditPasswordForm.reset();
    userEditModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// User Edit Modal: yopish
function closeUserEditModal() {
    if (!userEditModal) return;
    userEditModal.style.display = 'none';
    document.body.style.overflow = '';
    currentEditUser = null;
    if (userEditPasswordForm) userEditPasswordForm.reset();
}

// ============================================
// TELEGRAM BOT FUNKSIYALARI
// ============================================

// Telegram bot ma'lumotlarini yuklash
async function loadTelegramBotInfo(token) {
    try {
        const response = await apiRequest('/telegram/token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.success) {
            if (response.isConnected) {
                if (telegramStatus) {
                    telegramStatus.textContent = 'Ulangan';
                }
                if (telegramCard) {
                    telegramCard.classList.add('connected');
                }
                if (telegramConnectBtn) {
                    telegramConnectBtn.innerHTML = '<i class="fab fa-telegram"></i> Botga O\'tish';
                }
            } else {
                if (telegramStatus) {
                    telegramStatus.textContent = 'Ulanmagan';
                }
                if (telegramCard) {
                    telegramCard.classList.remove('connected');
                }
            }
        }
    } catch (error) {
        console.error('Telegram bot ma\'lumotlarini yuklashda xato:', error);
        if (telegramStatus) {
            telegramStatus.textContent = 'Xato';
        }
    }
}

// Telegram botga ulash
async function handleTelegramConnect(token) {
    try {
        const response = await apiRequest('/telegram/token', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.success && response.botLink) {
            // Bot linkini ochish
            window.open(response.botLink, '_blank');
            
            showAlert(
                'Telegram bot linki ochildi! Botda /start tugmasini bosing yoki link orqali avtomatik ulanasiz.',
                'info',
                5000
            );
            
            // 3 soniyadan keyin statusni yangilash
            setTimeout(() => {
                loadTelegramBotInfo(token);
            }, 3000);
        }
    } catch (error) {
        console.error('Telegram botga ulashda xato:', error);
        showAlert('Telegram botga ulashda xato yuz berdi.', 'error');
    }
}

// User Info qatoriga bosish (modal ochish)
function setupUserInfoRowClick() {
    if (!userInfoBody) return;
    userInfoBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr.user-info-row');
        if (!row || !row.dataset.userId) return;
        const userId = row.dataset.userId;
        const user = lastLoadedUsers.find((u) => u._id === userId);
        if (user) openUserEditModal(user);
    });
}

// Vazifalar jadvalini yuklash
async function loadTasksTable(token) {
    if (!tasksTableLoading || !tasksTableEmpty || !tasksTableWrapper || !tasksTableBody) return;
    tasksTableLoading.style.display = 'flex';
    tasksTableEmpty.style.display = 'none';
    tasksTableWrapper.style.display = 'none';
    tasksTableBody.innerHTML = '';

    const endpoint = (currentUserRole === 'teacher' || currentUserRole === 'admin')
        ? '/submissions/teacher/all'
        : '/submissions/my';

    try {
        const res = await apiRequest(endpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const submissions = res.submissions || [];
        tasksTableLoading.style.display = 'none';

        if (submissions.length === 0) {
            tasksTableEmpty.style.display = 'block';
        } else {
            tasksTableWrapper.style.display = 'block';
            displayTasksTable(submissions);
        }
    } catch (err) {
        console.error('Vazifalar jadvali yuklashda xato:', err);
        tasksTableLoading.style.display = 'none';
        tasksTableEmpty.style.display = 'block';
        showAlert('Vazifalarni yuklashda xato yuz berdi.', 'error');
    }
}

// Vazifalar jadvalini ko'rsatish
function displayTasksTable(submissions) {
    if (!tasksTableBody) return;
    const statusLabels = { submitted: 'Yuborilgan', in_review: 'Tekshirilmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan' };
    const statusClass = { submitted: 'status-submitted', in_review: 'status-review', approved: 'status-approved', rejected: 'status-rejected' };

    tasksTableBody.innerHTML = submissions.map((s, i) => {
        const studentName = s.user?.name || s.user?.email || '—';
        const lessonTitle = s.lesson?.title || '—';
        const grade = s.grade != null ? s.grade : '—';
        const status = statusLabels[s.status] || s.status || '—';
        const date = s.createdAt ? new Date(s.createdAt).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        const sc = statusClass[s.status] || '';
        const fileUrl = (s.submissionUrl && BASE_SERVER_URL) ? (BASE_SERVER_URL + s.submissionUrl) : null;
        const apiDownloadUrl = (s._id && BASE_SERVER_URL) ? (BASE_SERVER_URL + '/api/submissions/file/' + s._id) : null;
        const fileName = (s.submissionUrl && s.submissionUrl.split('/').pop()) ? decodeURIComponent(s.submissionUrl.split('/').pop()) : 'vazifa-fayl';
        const fileCell = apiDownloadUrl
            ? `<a href="${escapeHtml(apiDownloadUrl)}" class="tasks-download-link" data-download-url="${escapeHtml(apiDownloadUrl)}" data-download-name="${escapeHtml(fileName)}" title="Vazifa faylini yuklab olish"><i class="fas fa-download"></i> Yuklab olish</a>`
            : '<span class="tasks-no-file">—</span>';
        return `<tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(studentName)}</td>
            <td>${escapeHtml(lessonTitle)}</td>
            <td>${grade}</td>
            <td><span class="tasks-status-badge ${sc}">${escapeHtml(status)}</span></td>
            <td>${escapeHtml(date)}</td>
            <td>${fileCell}</td>
        </tr>`;
    }).join('');
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
