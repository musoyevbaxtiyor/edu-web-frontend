import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

// DOM Elements
const userMenu = document.getElementById('user-menu');
const userAvatar = document.getElementById('user-avatar');
const topUsername = document.getElementById('top-username');
const refreshBtn = document.getElementById('refresh-btn');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const statisticsContent = document.getElementById('statistics-content');
const searchInput = document.getElementById('search-input');
const ratingsTbody = document.getElementById('ratings-tbody');

// Statistics summary elements
const totalStudentsEl = document.getElementById('total-students');
const totalLessonsEl = document.getElementById('total-lessons');
const totalTestsEl = document.getElementById('total-tests');
const averageScoreEl = document.getElementById('average-score');

// Global state
let allRatings = [];
let filteredRatings = [];

document.addEventListener('DOMContentLoaded', initializeStatistics);

async function initializeStatistics() {
    // 1. Check authentication
    const token = localStorage.getItem('userToken');
    
    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    try {
        // 2. Load user profile
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        displayUserInfo(profileResponse.user);

        // 3. Load ratings
        await loadRatings(token);

    } catch (error) {
        console.error("Statistika yuklashda xato:", error);
        showAlert("Ma'lumotlarni yuklashda xato yuz berdi.", 'error');
        showEmptyState();
    }
}

function displayUserInfo(user) {
    const displayName = user.name || 'Foydalanuvchi';
    topUsername.textContent = displayName;
    
    const initials = getInitials(displayName);
    userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
}

function getInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

async function loadRatings(token) {
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        statisticsContent.style.display = 'none';

        const response = await apiRequest('/users/ratings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.success || !response.ratings || response.ratings.length === 0) {
            showEmptyState();
            return;
        }

        allRatings = response.ratings;
        filteredRatings = [...allRatings];

        displayStatistics(response.ratings);

        loadingState.style.display = 'none';
        statisticsContent.style.display = 'block';

    } catch (error) {
        console.error("Reyting yuklashda xato:", error);
        showAlert("Reyting ma'lumotlarini yuklashda xato yuz berdi.", 'error');
        showEmptyState();
    }
}

function showEmptyState() {
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    statisticsContent.style.display = 'none';
}

function displayStatistics(ratings) {
    // Update summary cards
    const totalStudents = ratings.length;
    const totalLessons = ratings.reduce((sum, r) => sum + r.completedLessons, 0);
    const totalTests = ratings.reduce((sum, r) => sum + r.totalTests, 0);
    const averageScore = ratings.length > 0
        ? Math.round(ratings.reduce((sum, r) => sum + r.totalScore, 0) / ratings.length)
        : 0;

    totalStudentsEl.textContent = totalStudents;
    totalLessonsEl.textContent = totalLessons;
    totalTestsEl.textContent = totalTests;
    averageScoreEl.textContent = averageScore;

    // Render ratings table
    renderRatingsTable(ratings);
}

function renderRatingsTable(ratings) {
    if (!ratings || ratings.length === 0) {
        ratingsTbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    Hech qanday ma'lumot topilmadi
                </td>
            </tr>
        `;
        return;
    }

    ratingsTbody.innerHTML = ratings.map((rating, index) => {
        const rank = rating.rank || index + 1;
        const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
        
        const studentInitials = getInitials(rating.student.name);
        const accuracyPercent = rating.testAccuracy || 0;

        return `
            <tr>
                <td class="rank-cell ${rankClass}">${rank}</td>
                <td>
                    <div class="student-cell">
                        <div class="student-avatar">${studentInitials}</div>
                        <div class="student-info">
                            <h4>${rating.student.name}</h4>
                            <p>${rating.student.email}</p>
                        </div>
                    </div>
                </td>
                <td class="score-cell">
                    <span class="badge badge-info">${rating.submissionScore || 0}</span>
                </td>
                <td class="score-cell">
                    <span class="badge badge-warning">${rating.testScore || 0}</span>
                </td>
                <td class="score-cell">
                    <span class="badge badge-success">${rating.totalScore || 0}</span>
                </td>
                <td>${rating.completedLessons || 0}</td>
                <td>
                    <div class="accuracy-bar">
                        <span>${accuracyPercent}%</span>
                        <div class="accuracy-progress">
                            <div class="accuracy-progress-fill" style="width: ${accuracyPercent}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="view-btn" onclick="viewStudentDetails('${rating.student._id}')">
                        <i class="fas fa-eye"></i> Ko'rish
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredRatings = [...allRatings];
    } else {
        filteredRatings = allRatings.filter(rating => 
            rating.student.name.toLowerCase().includes(searchTerm) ||
            rating.student.email.toLowerCase().includes(searchTerm)
        );
    }

    displayStatistics(filteredRatings);
});

// Refresh button
refreshBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('userToken');
    if (token) {
        await loadRatings(token);
        showAlert('Ma\'lumotlar yangilandi!', 'success');
    }
});

// View student details (placeholder function)
window.viewStudentDetails = function(studentId) {
    // TODO: Implement student detail view
    showAlert('Talaba tafsilotlari sahifasi tez orada qo\'shiladi.', 'info');
};

// User menu click
if (userMenu) {
    userMenu.addEventListener('click', () => {
        window.location.href = '../profile/profile.html';
    });
}
