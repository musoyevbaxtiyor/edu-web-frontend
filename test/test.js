// edu-web-frontend/test/test.js

import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const token = localStorage.getItem('userToken');
let tests = [];
let index = 0;
let solved = new Set();
let userAnswers = new Map(); // Foydalanuvchi javoblarini saqlash
let categories = new Map(); // Kategoriyalar ma'lumotlari
let currentCategory = 'all'; // Joriy kategoriya
let currentDifficulty = null; // Joriy qiyinlik darajasi (easy, medium, hard)

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
const categoriesList = document.getElementById('categories-list');
const testsListView = document.getElementById('tests-list-view');
const testView = document.getElementById('test-view');
const testsGrid = document.getElementById('tests-grid');
const backToListBtn = document.getElementById('backToListBtn');
const testsListTitle = document.getElementById('tests-list-title');
const testsListDescription = document.getElementById('tests-list-description');
const backToAllBtn = document.getElementById('backToAllBtn');

// "Barcha kategoriyalar" tugmasi uchun event listener
if (backToAllBtn) {
    backToAllBtn.onclick = () => goBackToAllCategories();
}

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

        // Progressni localStorage'dan yuklash (testlar yuklangandan keyin)
        loadProgressFromStorage();
        
        // Kategoriyalarni guruhlash
        groupTestsByCategory();
        
        // Progress yangilash
        updateProgress();
        
        // Kategoriyalarni ko'rsatish
        displayCategories();
        
        // Testlar ro'yxatini ko'rsatish
        displayTestsList();

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
    if (currentCategory === 'all') {
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === tests.length - 1;
    } else {
        const category = categories.get(currentCategory);
        if (category) {
            const currentTestInCategory = category.tests.find(t => t.index === index);
            if (currentTestInCategory) {
                const currentIdx = category.tests.indexOf(currentTestInCategory);
                prevBtn.disabled = currentIdx === 0;
                nextBtn.disabled = currentIdx === category.tests.length - 1;
            } else {
                prevBtn.disabled = true;
                nextBtn.disabled = true;
            }
        } else {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }
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

        // Kategoriyalarni yangilash
        groupTestsByCategory();
        
        // Progressni localStorage'ga saqlash
        saveProgressToStorage();
        
        updateProgress();
        displayCategories(); // Kategoriyalarni yangilash
        displayTestsList(); // Testlar ro'yxatini yangilash

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
if (nextBtn) {
    nextBtn.onclick = () => {
        if (currentCategory === 'all') {
            // Barcha testlar bo'yicha
            if (index < tests.length - 1) {
                index++;
                renderTest();
            }
        } else {
            // Faqat joriy kategoriyadagi testlar bo'yicha
            const category = categories.get(currentCategory);
            if (category) {
                const currentTestInCategory = category.tests.find(t => t.index === index);
                if (currentTestInCategory) {
                    const currentIdx = category.tests.indexOf(currentTestInCategory);
                    if (currentIdx < category.tests.length - 1) {
                        index = category.tests[currentIdx + 1].index;
                        renderTest();
                    }
                }
            }
        }
    };
}

if (prevBtn) {
    prevBtn.onclick = () => {
        if (currentCategory === 'all') {
            // Barcha testlar bo'yicha
            if (index > 0) {
                index--;
                renderTest();
            }
        } else {
            // Faqat joriy kategoriyadagi testlar bo'yicha
            const category = categories.get(currentCategory);
            if (category) {
                const currentTestInCategory = category.tests.find(t => t.index === index);
                if (currentTestInCategory) {
                    const currentIdx = category.tests.indexOf(currentTestInCategory);
                    if (currentIdx > 0) {
                        index = category.tests[currentIdx - 1].index;
                        renderTest();
                    }
                }
            }
        }
    };
}

// Kategoriyalarni guruhlash
function groupTestsByCategory() {
    categories.clear();
    
    tests.forEach((test, idx) => {
        const category = test.category || 'general';
        
        if (!categories.has(category)) {
            categories.set(category, {
                name: category,
                tests: [],
                solved: 0,
                total: 0
            });
        }
        
        const cat = categories.get(category);
        cat.tests.push({ test, index: idx });
        cat.total++;
    });
    
    // Yechilgan testlarni hisoblash
    categories.forEach((cat) => {
        cat.solved = cat.tests.filter(t => solved.has(t.index)).length;
    });
}

// Kategoriyalarni ko'rsatish
function displayCategories() {
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    // "Barchasi" kategoriyasi
    const allCategory = document.createElement('div');
    allCategory.className = `category-item ${currentCategory === 'all' ? 'active' : ''}`;
    allCategory.onclick = () => filterByCategory('all');
    
    const allSolved = solved.size;
    const allTotal = tests.length;
    const allPercentage = allTotal > 0 ? (allSolved / allTotal) * 100 : 0;
    
    allCategory.innerHTML = `
        <div class="category-header">
            <span class="category-name">Barchasi</span>
            <span class="category-count">${allTotal}</span>
        </div>
        <div class="category-progress-info">
            <span>${allSolved} / ${allTotal}</span>
            <span>${Math.round(allPercentage)}%</span>
        </div>
        <div class="category-progress-bar">
            <div class="category-progress-fill" style="width: ${allPercentage}%"></div>
        </div>
    `;
    
    categoriesList.appendChild(allCategory);
    
    // Boshqa kategoriyalar
    categories.forEach((cat, catName) => {
        const catItem = document.createElement('div');
        catItem.className = `category-item ${currentCategory === catName ? 'active' : ''}`;
        catItem.onclick = () => filterByCategory(catName);
        
        const percentage = cat.total > 0 ? (cat.solved / cat.total) * 100 : 0;
        
        // Kategoriya nomini formatlash (birinchi harfni katta qilish)
        const formattedCategoryName = catName.charAt(0).toUpperCase() + catName.slice(1);
        
        catItem.innerHTML = `
            <div class="category-header">
                <span class="category-name">${formattedCategoryName}</span>
                <span class="category-count">${cat.total}</span>
            </div>
            <div class="category-progress-info">
                <span>${cat.solved} / ${cat.total}</span>
                <span>${Math.round(percentage)}%</span>
            </div>
            <div class="category-progress-bar">
                <div class="category-progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        
        categoriesList.appendChild(catItem);
    });
}

// Kategoriya bo'yicha filtrlash
function filterByCategory(categoryName) {
    currentCategory = categoryName;
    currentDifficulty = null; // Qiyinlik darajasini tozalash
    
    // Sarlavhani yangilash
    if (testsListTitle && testsListDescription) {
        const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        testsListTitle.textContent = `📚 ${formattedCategoryName} Testlari`;
        testsListDescription.textContent = 'Qiyinlik darajasini tanlang';
    }
    
    // "Barcha kategoriyalar" tugmasini ko'rsatish
    if (backToAllBtn) {
        backToAllBtn.style.display = 'block';
    }
    
    // Testlar ro'yxatini yangilash (faqat 3 ta karta: Oson, O'rtacha, Qiyin)
    displayTestsList();
    
    // Ro'yxatga qaytish
    if (testsListView) {
        testsListView.style.display = 'block';
    }
    if (testView) {
        testView.style.display = 'none';
    }
    
    displayCategories(); // Kategoriyalarni yangilash
}

// Qiyinlik darajasini tanlash
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Sarlavhani yangilash
    if (testsListTitle && testsListDescription) {
        const formattedCategoryName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
        const difficultyLabels = {
            easy: 'Oson',
            medium: 'O\'rtacha',
            hard: 'Qiyin'
        };
        testsListTitle.textContent = `📚 ${formattedCategoryName} - ${difficultyLabels[difficulty]}`;
        testsListDescription.textContent = 'Testni tanlang va boshlang';
    }
    
    // Testlar ro'yxatini yangilash (faqat tanlangan kategoriya va qiyinlik darajasidagi testlar)
    displayTestsList();
    
    // Testlar ko'rinishiga o'tish
    if (testsListView) {
        testsListView.style.display = 'block';
    }
    if (testView) {
        testView.style.display = 'none';
    }
}

// Progressni localStorage'ga saqlash
function saveProgressToStorage() {
    const progressData = {
        solved: Array.from(solved),
        userAnswers: Array.from(userAnswers.entries()),
        categories: {}
    };
    
    // Har bir kategoriya uchun progress
    categories.forEach((cat, catName) => {
        const catSolved = cat.tests.filter(t => solved.has(t.index)).map(t => t.index);
        progressData.categories[catName] = {
            solved: catSolved,
            total: cat.total
        };
    });
    
    localStorage.setItem('testProgress', JSON.stringify(progressData));
}

// Progressni localStorage'dan yuklash
function loadProgressFromStorage() {
    try {
        const savedProgress = localStorage.getItem('testProgress');
        if (!savedProgress) return;
        
        const progressData = JSON.parse(savedProgress);
        
        // Yechilgan testlarni yuklash
        if (progressData.solved && Array.isArray(progressData.solved)) {
            progressData.solved.forEach(idx => {
                // Faqat mavjud testlar uchun
                if (idx >= 0 && idx < tests.length) {
                    solved.add(idx);
                }
            });
        }
        
        // Foydalanuvchi javoblarini yuklash
        if (progressData.userAnswers && Array.isArray(progressData.userAnswers)) {
            progressData.userAnswers.forEach(([idx, answer]) => {
                // Faqat mavjud testlar uchun
                if (idx >= 0 && idx < tests.length) {
                    userAnswers.set(idx, answer);
                }
            });
        }
        
    } catch (error) {
        console.error('Progressni yuklashda xato:', error);
    }
}

// Testlar ro'yxatini ko'rsatish
function displayTestsList() {
    if (!testsGrid) return;
    
    testsGrid.innerHTML = '';
    
    if (tests.length === 0) {
        testsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                <i class="fas fa-clipboard-question" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>Hozircha testlar mavjud emas</p>
            </div>
        `;
        return;
    }
    
    // Agar kategoriya tanlangan va qiyinlik darajasi tanlanmagan bo'lsa, faqat 3 ta kartani ko'rsatish
    if (currentCategory !== 'all' && currentDifficulty === null) {
        const category = categories.get(currentCategory);
        if (!category) {
            testsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                    <i class="fas fa-filter" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>Bu kategoriyada testlar mavjud emas</p>
                </div>
            `;
            return;
        }
        
        // Qiyinlik darajalari
        const difficulties = [
            { key: 'easy', label: 'Oson', color: '#10b981', icon: '🟢' },
            { key: 'medium', label: 'O\'rtacha', color: '#f59e0b', icon: '🟡' },
            { key: 'hard', label: 'Qiyin', color: '#ef4444', icon: '🔴' }
        ];
        
        const formattedCategoryName = currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
        
        difficulties.forEach(diff => {
            // Bu qiyinlik darajasidagi testlarni topish
            const testsInDifficulty = category.tests.filter(t => t.test.difficulty === diff.key);
            const totalTests = testsInDifficulty.length;
            const solvedTests = testsInDifficulty.filter(t => solved.has(t.index)).length;
            
            const card = document.createElement('div');
            card.className = `test-card-item difficulty-card`;
            card.onclick = () => selectDifficulty(diff.key);
            
            card.innerHTML = `
                <div class="test-card-header">
                    <h3 class="test-card-title">${formattedCategoryName} ${diff.label}</h3>
                    <div class="test-card-status" style="background: ${diff.color}; color: white;">
                        ${diff.icon}
                    </div>
                </div>
                <div style="text-align: center; padding: 20px 0;">
                    <div style="font-size: 48px; font-weight: 700; color: ${diff.color}; margin-bottom: 8px;">
                        ${totalTests}
                    </div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
                        ${totalTests === 1 ? 'test' : 'testlar'}
                    </div>
                    <div style="color: #10b981; font-size: 13px; font-weight: 600;">
                        ${solvedTests} ta yechildi
                    </div>
                </div>
            `;
            
            testsGrid.appendChild(card);
        });
        
        return;
    }
    
    // Agar qiyinlik darajasi tanlangan bo'lsa, testlarni ko'rsatish
    if (currentCategory !== 'all' && currentDifficulty !== null) {
        const category = categories.get(currentCategory);
        if (category) {
            const filteredTests = category.tests
                .filter(t => t.test.difficulty === currentDifficulty)
                .map(t => ({ test: t.test, index: t.index }));
            
            if (filteredTests.length === 0) {
                testsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-filter" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                        <p>Bu qiyinlik darajasida testlar mavjud emas</p>
                    </div>
                `;
                return;
            }
            
            filteredTests.forEach(({ test, index: idx }) => {
                const isCompleted = solved.has(idx);
                const card = document.createElement('div');
                card.className = `test-card-item ${isCompleted ? 'completed' : ''}`;
                card.onclick = () => selectTest(idx);
                
                card.innerHTML = `
                    <div class="test-card-header">
                        <h3 class="test-card-title">${test.title}</h3>
                        <div class="test-card-status">
                            ${isCompleted ? '✓' : '○'}
                        </div>
                    </div>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">
                        ${test.question.substring(0, 100)}${test.question.length > 100 ? '...' : ''}
                    </p>
                    <div class="test-card-meta">
                        <span>
                            <i class="fas fa-list-ul"></i>
                            ${test.options.length} variant
                        </span>
                    </div>
                `;
                
                testsGrid.appendChild(card);
            });
            
            return;
        }
    }
    
    // Barcha testlar (currentCategory === 'all')
    tests.forEach((test, idx) => {
        const isCompleted = solved.has(idx);
        const card = document.createElement('div');
        card.className = `test-card-item ${isCompleted ? 'completed' : ''}`;
        card.onclick = () => selectTest(idx);
        
        const category = test.category || 'general';
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
        
        // Kategoriya nomini formatlash
        const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
        
        card.innerHTML = `
            <div class="test-card-header">
                <h3 class="test-card-title">${test.title}</h3>
                <div class="test-card-status">
                    ${isCompleted ? '✓' : '○'}
                </div>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">
                ${test.question.substring(0, 100)}${test.question.length > 100 ? '...' : ''}
            </p>
            <div class="test-card-meta">
                <span>
                    <i class="fas fa-tag"></i>
                    ${formattedCategory}
                </span>
                <span>
                    <i class="fas fa-signal"></i>
                    <span style="color: ${difficultyColors[test.difficulty] || '#64748b'}; font-weight: 600;">
                        ${difficultyLabels[test.difficulty] || test.difficulty}
                    </span>
                </span>
                <span>
                    <i class="fas fa-list-ul"></i>
                    ${test.options.length} variant
                </span>
            </div>
        `;
        
        testsGrid.appendChild(card);
    });
}

// Testni tanlash
function selectTest(testIndex) {
    index = testIndex;
    if (testsListView) {
        testsListView.style.display = 'none';
    }
    if (testView) {
        testView.style.display = 'block';
    }
    renderTest();
}

// "Barchasi" kategoriyasiga qaytish
function goBackToAllCategories() {
    currentCategory = 'all';
    currentDifficulty = null;
    
    // Sarlavhani yangilash
    if (testsListTitle && testsListDescription) {
        testsListTitle.textContent = '📚 Barcha Testlar';
        testsListDescription.textContent = 'Testni tanlang va boshlang';
    }
    
    // "Barcha kategoriyalar" tugmasini yashirish
    if (backToAllBtn) {
        backToAllBtn.style.display = 'none';
    }
    
    displayTestsList();
    displayCategories();
}

// Global funksiya (HTML'dan chaqirish uchun)
window.goBackToAllCategories = goBackToAllCategories;

// Ro'yxatga qaytish
if (backToListBtn) {
    backToListBtn.onclick = () => {
        if (testsListView) {
            testsListView.style.display = 'block';
        }
        if (testView) {
            testView.style.display = 'none';
        }
    };
}
