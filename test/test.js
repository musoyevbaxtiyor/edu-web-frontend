// edu-web-frontend/test/test.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const token = localStorage.getItem('userToken');
let tests = [];
let index = 0;
let solved = new Set();
let userAnswers = new Map(); // Foydalanuvchi javoblarini saqlash

// Elementlar
const progressNumber = document.getElementById('progressNumber');
const progressTotal = document.getElementById('progressTotal');
const progressBar = document.getElementById('progressBar');
const testTitle = document.getElementById('testTitle');
const testQuestion = document.getElementById('testQuestion');
const testCode = document.getElementById('testCode');
const testOptions = document.getElementById('testOptions');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', async () => {
    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    await loadTests();
});

// Testlarni yuklash
async function loadTests() {
    try {
        const response = await apiRequest('/tests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        tests = response.tests || [];
        
        // Faqat faol testlarni ko'rsatish
        tests = tests.filter(test => test.isActive !== false);
        
        if (tests.length === 0) {
            testTitle.textContent = 'Testlar mavjud emas';
            testQuestion.textContent = 'Hozircha testlar qo\'shilmagan.';
            testOptions.innerHTML = '<p style="color: #64748b; padding: 20px;">Iltimos, keyinroq qayta kiring.</p>';
            return;
        }

        // Progress yangilash
        updateProgress();
        
        // Birinchi testni ko'rsatish
        index = 0;
        renderTest();

    } catch (error) {
        console.error("Testlarni yuklashda xato:", error);
        showAlert("Testlarni yuklashda xato yuz berdi.", 'error');
    }
}

// Testni ko'rsatish
function renderTest() {
    if (tests.length === 0) return;
    
    const t = tests[index];
    
    testTitle.textContent = t.title || 'Test';
    testQuestion.textContent = t.question || '';
    
    // Kod mavjud bo'lsa ko'rsatish
    if (t.code) {
        testCode.textContent = t.code;
        testCode.parentElement.style.display = 'block';
    } else {
        testCode.parentElement.style.display = 'none';
    }

    // Variantlarni ko'rsatish
    testOptions.innerHTML = "";
    
    t.options.forEach((opt, i) => {
        const div = document.createElement("div");
        div.className = "test-option";
        
        // Agar foydalanuvchi bu testga javob bergan bo'lsa
        const userAnswer = userAnswers.get(index);
        if (userAnswer !== undefined) {
            if (i === t.correctAnswer) {
                div.classList.add("correct");
            } else if (i === userAnswer && i !== t.correctAnswer) {
                div.classList.add("wrong");
            }
            div.style.pointerEvents = 'none';
        } else {
            div.onclick = () => checkAnswer(div, i, t._id);
        }
        
        div.textContent = opt;
        testOptions.appendChild(div);
    });

    // Prism highlight
    if (window.Prism) {
        Prism.highlightAll();
    }

    // Navigation tugmalarini yangilash
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === tests.length - 1;
}

// Javobni tekshirish
async function checkAnswer(el, answerIndex, testId) {
    const options = document.querySelectorAll(".test-option");
    
    // Barcha variantlarni bloklash
    options.forEach(o => {
        o.onclick = null;
        o.style.pointerEvents = 'none';
    });

    try {
        // Backend'ga javobni yuborish va tekshirish
        const response = await apiRequest(`/tests/${testId}/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ answerIndex })
        });

        const t = tests[index];
        
        if (response.isCorrect) {
            el.classList.add("correct");
            solved.add(index);
            showAlert('To\'g\'ri javob! 🎉', 'success', 2000);
        } else {
            el.classList.add("wrong");
            options[t.correctAnswer].classList.add("correct");
            showAlert('Noto\'g\'ri javob. To\'g\'ri javob belgilandi.', 'error', 3000);
        }

        // Foydalanuvchi javobini saqlash
        userAnswers.set(index, answerIndex);
        
        // Tushuntirish mavjud bo'lsa ko'rsatish
        if (response.explanation) {
            setTimeout(() => {
                showAlert(response.explanation, 'info', 5000);
            }, 1000);
        }

        updateProgress();

    } catch (error) {
        console.error('Javobni tekshirishda xato:', error);
        showAlert('Javobni tekshirishda xato yuz berdi.', 'error');
        
        // Xato bo'lsa ham variantlarni qayta ochish
        options.forEach(o => {
            o.onclick = () => checkAnswer(o, Array.from(options).indexOf(o), testId);
            o.style.pointerEvents = 'auto';
        });
    }
}

// Progress yangilash
function updateProgress() {
    progressNumber.textContent = solved.size;
    progressTotal.textContent = tests.length;
    
    if (tests.length > 0) {
        const percentage = (solved.size / tests.length) * 100;
        progressBar.style.width = percentage + "%";
    }
}

// Navigation
nextBtn.onclick = () => {
    if (index < tests.length - 1) {
        index++;
        renderTest();
    }
};

prevBtn.onclick = () => {
    if (index > 0) {
        index--;
        renderTest();
    }
};
