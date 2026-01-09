// edu-web-frontend/test-management/test-management.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert, showConfirm } from '../assets/js/alert.js';

const token = localStorage.getItem('userToken');
let currentUserRole = null;
let tests = [];
let optionCount = 0;

// Elementlar
const loadingMessage = document.getElementById('loading-message');
const testsContent = document.getElementById('tests-content');
const testsList = document.getElementById('tests-list');
const addTestBtn = document.getElementById('add-test-btn');
const testModal = document.getElementById('test-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const testForm = document.getElementById('test-form');
const modalTitle = document.getElementById('modal-title');
const optionsContainer = document.getElementById('options-container');
const addOptionBtn = document.getElementById('add-option-btn');
const correctAnswerSelect = document.getElementById('correct-answer');
const userAvatar = document.getElementById('user-avatar');
const topUsername = document.getElementById('top-username');
const userMenu = document.getElementById('user-menu');

document.addEventListener('DOMContentLoaded', initializeTestManagement);

async function initializeTestManagement() {
    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    try {
        // Foydalanuvchi rolini tekshirish
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        currentUserRole = profileResponse.user.role;
        
        // Faqat o'qituvchi va admin ko'ra oladi
        if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
            showAlert("Sizda bu sahifaga kirish huquqi yo'q.", 'error');
            setTimeout(() => {
                window.location.href = '../dashboard/dashboard.html';
            }, 2000);
            return;
        }

        // Avatar va ism
        const userName = profileResponse.user.name || 'Foydalanuvchi';
        const initials = getInitials(userName);
        userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
        topUsername.textContent = userName;
        
        // Current user ID ni saqlash
        const currentUserId = profileResponse.user._id;

        // Testlarni yuklash
        await loadTests(currentUserId);

    } catch (error) {
        console.error("Xato:", error);
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
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

// Testlarni yuklash
async function loadTests(currentUserId) {
    try {
        // Get user role if not set
        if (!currentUserRole) {
            const profileResponse = await apiRequest('/users/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            currentUserRole = profileResponse.user.role;
        }
        
        const response = await apiRequest('/tests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        tests = response.tests || [];
        
        // Faqat o'z testlarini ko'rsatish (admin barchasini ko'radi)
        if (currentUserRole !== 'admin' && currentUserId) {
            tests = tests.filter(test => {
                const creatorId = test.createdBy?._id || test.createdBy;
                return creatorId && creatorId.toString() === currentUserId.toString();
            });
        }

        loadingMessage.style.display = 'none';
        testsContent.style.display = 'block';
        
        displayTests();

    } catch (error) {
        console.error("Testlarni yuklashda xato:", error);
        showAlert("Testlarni yuklashda xato yuz berdi.", 'error');
    }
}

// Testlarni ko'rsatish
function displayTests() {
    testsList.innerHTML = '';

    if (tests.length === 0) {
        testsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-question"></i>
                <h3>Hozircha testlar mavjud emas</h3>
                <p>Yangi test qo&apos;shish uchun &quot;Yangi Test Qo&apos;shish&quot; tugmasini bosing.</p>
            </div>
        `;
        return;
    }

    tests.forEach(test => {
        const card = document.createElement('div');
        card.className = 'test-card';
        
        const difficultyColors = {
            easy: '#10b981',
            medium: '#f59e0b',
            hard: '#ef4444'
        };
        
        const difficultyLabels = {
            easy: 'Oson',
            medium: 'O\'rtacha',
            hard: 'Qiyin'
        };

        card.innerHTML = `
            <div class="test-card-header">
                <h3>${test.title}</h3>
                <div class="test-badges">
                    <span class="difficulty-badge" style="background: ${difficultyColors[test.difficulty] || '#64748b'}">
                        ${difficultyLabels[test.difficulty] || test.difficulty}
                    </span>
                    ${test.isActive ? '<span class="active-badge">Faol</span>' : '<span class="inactive-badge">Nofaol</span>'}
                </div>
            </div>
            <p class="test-question-preview">${test.question.substring(0, 100)}${test.question.length > 100 ? '...' : ''}</p>
            <div class="test-meta">
                <span><i class="fas fa-list-ul"></i> ${test.options.length} variant</span>
                <span><i class="fas fa-sort-numeric-down"></i> Tartib: ${test.order}</span>
            </div>
            <div class="test-actions">
                <button class="btn-edit" data-test-id="${test._id}">
                    <i class="fas fa-edit"></i>
                    Tahrirlash
                </button>
                <button class="btn-delete" data-test-id="${test._id}">
                    <i class="fas fa-trash"></i>
                    O'chirish
                </button>
            </div>
        `;
        
        testsList.appendChild(card);
    });

    // Event listener'larni qo'shish
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const testId = e.target.closest('.btn-edit').dataset.testId;
            editTest(testId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const testId = e.target.closest('.btn-delete').dataset.testId;
            deleteTest(testId);
        });
    });
}

// Yangi test qo'shish
addTestBtn.addEventListener('click', () => {
    modalTitle.textContent = "Yangi Test Qo'shish";
    testForm.reset();
    optionCount = 0;
    optionsContainer.innerHTML = '';
    correctAnswerSelect.innerHTML = '<option value="">Tanlang...</option>';
    document.getElementById('test-id').value = '';
    document.getElementById('test-is-active').checked = true;
    testModal.style.display = 'flex';
    addDefaultOptions();
});

// Variant qo'shish
addOptionBtn.addEventListener('click', () => {
    addOption();
});

function addOption(value = '') {
    optionCount++;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="text" class="option-input" placeholder="Variant ${optionCount}" value="${value}" data-option-index="${optionCount - 1}">
        <button type="button" class="btn-remove-option" data-option-index="${optionCount - 1}">
            <i class="fas fa-times"></i>
        </button>
    `;
    optionsContainer.appendChild(optionDiv);
    
    updateCorrectAnswerSelect();
    
    // O'chirish tugmasi
    optionDiv.querySelector('.btn-remove-option').addEventListener('click', (e) => {
        if (optionsContainer.children.length > 2) {
            optionDiv.remove();
            updateCorrectAnswerSelect();
        } else {
            showAlert('Kamida 2 ta variant bo\'lishi kerak.', 'warning');
        }
    });
}

function addDefaultOptions() {
    for (let i = 0; i < 4; i++) {
        addOption();
    }
}

// To'g'ri javob select'ni yangilash
function updateCorrectAnswerSelect() {
    const options = Array.from(optionsContainer.querySelectorAll('.option-input'));
    correctAnswerSelect.innerHTML = '<option value="">Tanlang...</option>';
    
    options.forEach((input, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Variant ${index + 1}${input.value ? ': ' + input.value.substring(0, 30) : ''}`;
        correctAnswerSelect.appendChild(option);
    });
}

// Option input'larda o'zgarish bo'lganda
optionsContainer.addEventListener('input', (e) => {
    if (e.target.classList.contains('option-input')) {
        updateCorrectAnswerSelect();
    }
});

// Modalni yopish
closeModalBtn.addEventListener('click', closeModal);
cancelFormBtn.addEventListener('click', closeModal);

function closeModal() {
    testModal.style.display = 'none';
    testForm.reset();
}

// Formani yuborish
testForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const testId = document.getElementById('test-id').value;
    const title = document.getElementById('test-title').value.trim();
    const question = document.getElementById('test-question').value.trim();
    const code = document.getElementById('test-code').value.trim();
    const explanation = document.getElementById('test-explanation').value.trim();
    const difficulty = document.getElementById('test-difficulty').value;
    const category = document.getElementById('test-category').value.trim();
    const order = parseInt(document.getElementById('test-order').value) || 0;
    const isActive = document.getElementById('test-is-active').checked;
    const correctAnswer = parseInt(document.getElementById('correct-answer').value);
    
    // Variantlarni yig'ish
    const options = Array.from(optionsContainer.querySelectorAll('.option-input'))
        .map(input => input.value.trim())
        .filter(opt => opt !== '');
    
    // Validatsiya
    if (!title || !question || options.length < 2 || correctAnswer === '' || isNaN(correctAnswer)) {
        showAlert('Iltimos, barcha majburiy maydonlarni to\'ldiring va kamida 2 ta variant qo\'shing.', 'warning');
        return;
    }
    
    if (correctAnswer < 0 || correctAnswer >= options.length) {
        showAlert('To\'g\'ri javob indeksi noto\'g\'ri.', 'error');
        return;
    }
    
    const testData = {
        title,
        question,
        code: code || undefined,
        options,
        correctAnswer,
        explanation: explanation || undefined,
        difficulty,
        category: category || 'general',
        order,
        isActive
    };
    
    try {
        if (testId) {
            // Yangilash
            const response = await apiRequest(`/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });
            
            showAlert('Test muvaffaqiyatli yangilandi!', 'success');
        } else {
            // Yaratish
            const response = await apiRequest('/tests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testData)
            });
            
            showAlert('Test muvaffaqiyatli yaratildi!', 'success');
        }
        
        closeModal();
        // Get current user ID for loadTests
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadTests(profileResponse.user._id);
        
    } catch (error) {
        console.error('Testni saqlashda xato:', error);
        showAlert(error.message || 'Testni saqlashda xato yuz berdi.', 'error');
    }
});

// Testni tahrirlash
async function editTest(testId) {
    try {
        const response = await apiRequest(`/tests/${testId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const test = response.test;
        
        // Formani to'ldirish
        document.getElementById('test-id').value = test._id;
        document.getElementById('test-title').value = test.title;
        document.getElementById('test-question').value = test.question;
        document.getElementById('test-code').value = test.code || '';
        document.getElementById('test-explanation').value = test.explanation || '';
        document.getElementById('test-difficulty').value = test.difficulty || 'medium';
        document.getElementById('test-category').value = test.category || '';
        document.getElementById('test-order').value = test.order || 0;
        document.getElementById('test-is-active').checked = test.isActive !== false;
        
        // Variantlarni qo'shish
        optionsContainer.innerHTML = '';
        optionCount = 0;
        test.options.forEach(opt => {
            addOption(opt);
        });
        
        // To'g'ri javobni tanlash
        correctAnswerSelect.value = test.correctAnswer;
        
        modalTitle.textContent = 'Testni Tahrirlash';
        testModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Testni yuklashda xato:', error);
        showAlert('Testni yuklashda xato yuz berdi.', 'error');
    }
}

// Testni o'chirish
async function deleteTest(testId) {
    const confirmed = await showConfirm('Haqiqatan ham bu testni o\'chirmoqchimisiz?', 'Testni o\'chirish');
    
    if (!confirmed) {
        return;
    }
    
    try {
        await apiRequest(`/tests/${testId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        showAlert('Test muvaffaqiyatli o\'chirildi!', 'success');
        // Get current user ID for loadTests
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadTests(profileResponse.user._id);
        
    } catch (error) {
        console.error('Testni o\'chirishda xato:', error);
        showAlert(error.message || 'Testni o\'chirishda xato yuz berdi.', 'error');
    }
}

// User menu click
if (userMenu) {
    userMenu.addEventListener('click', () => {
        window.location.href = '../profile/profile.html';
    });
}
