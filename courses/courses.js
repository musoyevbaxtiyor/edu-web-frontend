import { apiRequest } from '../assets/js/api.js';
import { showAlert, showConfirm } from '../assets/js/alert.js';

const coursesList = document.getElementById('courses-list');
const loadingMessage = document.getElementById('loading-message');
const addCourseBtn = document.getElementById('add-course-btn');
const createFormContainer = document.getElementById('create-form-container');
const createCourseForm = document.getElementById('create-course-form');
const cancelCreateBtn = document.getElementById('cancel-create-btn');
const cancelCreateBtn2 = document.getElementById('cancel-create-btn-2');
const editFormContainer = document.getElementById('edit-form-container');
const editCourseForm = document.getElementById('edit-course-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const cancelEditBtn2 = document.getElementById('cancel-edit-btn-2');
const searchInput = document.getElementById('search-input');
const coursesCount = document.getElementById('courses-count');
const userAvatar = document.getElementById('user-avatar');

document.addEventListener('DOMContentLoaded', fetchCoursesAndCheckRole);

// Global o'zgaruvchilar
let currentUserRole = 'student'; 
let currentUserId = null;
let enrolledCourseIds = [];
let allCourses = []; // Barcha kurslar ro'yxati (filtrlash uchun)

// Boshlanish funksiyasi (Loyihaning asosiy kirish nuqtasi)
async function fetchCoursesAndCheckRole() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showAlert("Iltimos, avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }
    
    // Foydalanuvchi rolini olish va kurslarni yuklash
    try {
        await checkUserRole(token);
        
        // FQ'AT TALABALAR UCHUN: Ro'yxatdan o'tilgan kurslar IDlarini olish
        if (currentUserRole === 'student') {
            await fetchEnrolledCourseIds(token); // YANGI FUNKSIYANI CHAQRIRAMIZ
        }

        await fetchAllCourses(token);
        addActionListeners(); 
    } catch (error) {
        // Agar token yaroqsiz bo'lsa, login sahifasiga o'tkazish
        console.error("Kurslarni yuklashda xato:", error);
        showAlert("Sessiya tugagan yoki token yaroqsiz. Qayta kiring.", 'error');
        localStorage.removeItem('userToken');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);
    }
}

// 1. Foydalanuvchi rolini tekshirish
async function checkUserRole(token) {
    const profileResponse = await apiRequest('/users/profile', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    currentUserRole = profileResponse.user.role;
    currentUserId = profileResponse.user._id;
    
    // User avatar ni ko'rsatish
    const userName = profileResponse.user.name || 'Foydalanuvchi';
    const initials = getInitials(userName);
    if (userAvatar) {
        userAvatar.innerHTML = `<span style="font-size: 1rem; font-weight: 600;">${initials}</span>`;
    }
    
    if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
        addCourseBtn.classList.remove('hidden');
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

// Ro'yxatdan o'tilgan kurslarning ID larini Backenddan yuklash
async function fetchEnrolledCourseIds(token) {
    try {
        const response = await apiRequest('/enroll/my-courses', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // FQ'AT KURS ID'LARINI SAQLAYMIZ
        // MUHIM TEKSHIRUV: Agar 304 kelib bo'sh obyekt qaytgan bo'lsa yoki 'courses' topilmasa
        if (response && response.courses && Array.isArray(response.courses)) {
            enrolledCourseIds = response.courses.map(course => course._id);
        } else {
            // Agar javobda kurslar ro'yxati bo'lmasa yoki 304 bo'lsa, ro'yxatni bo'sh qoldiramiz
            enrolledCourseIds = [];
        }
        
        // Faqat kurs ID'larini saqlaymiz
        enrolledCourseIds = response.courses.map(course => course._id);
        
    } catch (error) {
        console.error("Ro'yxatdan o'tilgan kurslarni yuklashda xato:", error);
        // MUHIM: Xatoning nomi va xabari
        console.error("Xato tafsiloti:", error.name, error.message); 
        enrolledCourseIds = [];
        
        // Xatoni yuqoriga qayta tashlaymiz. 
                // Sababi: Agar bu API chaqirig'ida Avtorizatsiya xatosi bo'lsa, 
                // butun sahifa to'xtashi va login sahifasiga o'tkazilishi to'g'ri.
                // Hozirgi holatda bu yordamchi funksiya bo'lgani uchun, xatoni tashlab yuboramiz.
                throw error; // <<<< BU QATORNI QO'SHI 
    }
}


// 2. Barcha kurslarni Backenddan yuklash
async function fetchAllCourses(token) {
    try {
        const response = await apiRequest('/courses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        allCourses = response.courses || [];
        loadingMessage.style.display = 'none';
        updateCoursesCount();
        displayCourses(allCourses);
        
    } catch (error) {
        loadingMessage.innerHTML = '<p>Kurslarni yuklashda xato yuz berdi.</p>';
        console.error('Kurslar API xatosi:', error);
    }
}

// Kurslar sonini yangilash
function updateCoursesCount() {
    const count = allCourses.length;
    coursesCount.textContent = `${count} ${count === 1 ? 'kurs' : 'kurs'}`;
}

// 3. Kurslarni HTMLga joylash
// edu-web-frontend/courses/courses.js (displayCourses funksiyasining ichida)

function displayCourses(courses) {
    coursesList.innerHTML = ''; 

    if (courses.length === 0) {
        coursesList.innerHTML = '<p>Hozircha kurslar mavjud emas.</p>';
        return;
    }

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const isOwner = course.teacher._id === currentUserId; 
        
        // 1. Asosiy HTMLni o'rnatamiz
        card.innerHTML = `
            <h4>${course.title}</h4>
            <p>${course.description || 'Tavsif mavjud emas'}</p>
            <div class="course-meta">
                <div class="teacher">
                    <i class="fas fa-user-tie"></i>
                    <span>${course.teacher.name || 'Noma\'lum'}</span>
                </div>
                <div class="price">${course.price.toFixed(2)}</div>
            </div>
        `;

        // 2. ActionsDiv elementini yaratamiz
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'course-actions';

        // 3. ActionsDiv ichiga tugmalarni qo'shamiz (bu qismi sizda to'g'ri yozilgan)
        // ------------------------------------------
        // TUGMALAR MANTIQI: Rolga Asoslangan Boshqaruv
        // ------------------------------------------
        
        // A. Tahrirlash va Boshqaruv tugmalari (Faqat Admin yoki Kursning O'qituvchisi uchun)
        if (currentUserRole === 'admin' || (currentUserRole === 'teacher' && isOwner)) {
            
            // --- Tahrirlash tugmasi ---
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Kursni Tahrirlash';
            editBtn.dataset.courseId = course._id;
            editBtn.dataset.action = 'edit';
            actionsDiv.appendChild(editBtn);

            // --- Material Qo'shish/Darslarni Boshqarish tugmasi (YANGI) ---
            const manageBtn = document.createElement('button');
            manageBtn.className = 'manage-btn';
            manageBtn.textContent = '📚 Darslarni Boshqarish'; 
            manageBtn.dataset.courseId = course._id;
            manageBtn.dataset.action = 'manage'; 
            actionsDiv.appendChild(manageBtn);

            // --- O'chirish tugmasi ---
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'O\'chirish';
            deleteBtn.dataset.courseId = course._id;
            deleteBtn.dataset.action = 'delete';
            actionsDiv.appendChild(deleteBtn);
            
        } 
        
        // B. Kursga yozilish (Faqat Talabalar uchun / Yoki O'qituvchi boshqaning kursiga yozilsa)
        if (currentUserRole === 'student' || (currentUserRole === 'teacher' && !isOwner)) {
            const isEnrolled = enrolledCourseIds.includes(course._id);
            const button = document.createElement('button');
            button.className = isEnrolled ? 'enrolled-btn' : 'enroll-btn';
            button.textContent = isEnrolled ? '✅ Ro\'yxatdan O\'tilgan' : 'Kursga Yozilish';
            button.disabled = isEnrolled;
            
            if (!isEnrolled) {
                button.dataset.courseId = course._id;
                button.dataset.action = 'enroll';
            }
            actionsDiv.appendChild(button);
        }

        // 4. ActionsDiv'ni asosiy card'ga qo'shamiz!
        card.appendChild(actionsDiv); 
        
        // 5. Card'ni ro'yxatga qo'shamiz
        coursesList.appendChild(card); 
    });
}

// 4. Kurs yaratish formasi funksiyasi
addCourseBtn.addEventListener('click', () => {
    createFormContainer.setAttribute('aria-hidden', 'false');
});

cancelCreateBtn.addEventListener('click', closeCreateModal);
if (cancelCreateBtn2) {
    cancelCreateBtn2.addEventListener('click', closeCreateModal);
}

function closeCreateModal() {
    createFormContainer.setAttribute('aria-hidden', 'true');
    createCourseForm.reset();
}

createCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');

    const courseData = {
        title: document.getElementById('course-title').value,
        description: document.getElementById('course-description').value,
        price: parseFloat(document.getElementById('course-price').value),
    };

    try {
        const response = await apiRequest('/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(courseData)
        });

        showAlert(`Kurs muvaffaqiyatli yaratildi: ${response.course.title}`, 'success');
        createFormContainer.setAttribute('aria-hidden', 'true');
        createCourseForm.reset();
        
        // Kurslarni qayta yuklash va action listener'larni qayta qo'shish
        await fetchAllCourses(token); 
        addActionListeners();

    } catch (error) {
        console.error('Kurs yaratishda xato:', error);
        showAlert(error.message || 'Kurs yaratishda xato yuz berdi.', 'error');
    }
});


// --- YANGI FUNKSIYALAR: O'CHIRISH VA TAHRIRLASH ---

// Tugmachalarga hodisa tinglovchilarini qo'shish
function addActionListeners() {
    // Listener'ni faqat bir marta qo'yishni ta'minlash uchun, uni coursesList'ga qo'yamiz
    // va har safar chaqirilganda eskisini o'chirish o'rniga, u allaqachon mavjud bo'lishi mumkin.
    // DOMContentLoaded ichida bir marta chaqirilishi uni to'g'rilaydi.
    coursesList.removeEventListener('click', handleCourseActions); 
    coursesList.addEventListener('click', handleCourseActions);
}

// Barcha action tugmalari uchun bitta universal handler



// O'chirish (DELETE) funksiyasi
async function handleDelete(courseId, token) {
    const confirmed = await showConfirm("Haqiqatan ham bu kursni o'chirmoqchimisiz?", 'Kursni o\'chirish');
    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        showAlert("Kurs muvaffaqiyatli o'chirildi.", 'success');
        
        // Kurslar ro'yxatini qayta yuklash
        await fetchAllCourses(token);
        addActionListeners(); // Qayta yuklangandan so'ng listener'larni yana qo'shamiz

    } catch (error) {
        console.error('Kursni o\'chirishda xato:', error);
        showAlert(error.message || 'Kursni o\'chirishda xato yuz berdi. Ruxsatlaringizni tekshiring.', 'error');
    }
}

// Kursga ro'yxatdan o'tish (Enroll) funksiyasi
async function handleEnroll(courseId, token) {
    // Qo'shimcha tekshiruv: Talaba kursga yozilishni tasdiqlasin
    const confirmed = await showConfirm("Siz ro'yxatdan o'tishni tasdiqlaysizmi?", 'Kursga yozilish');
    if (!confirmed) {
        return;
    }

    try {
        const response = await apiRequest(`/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ courseId }) // Backendga faqat kurs ID'sini yuboramiz
        });

        showAlert(response.message || "Kursga muvaffaqiyatli ro'yxatdan o'tildi!", 'success');
        
        // Ro'yxatdan o'tgandan so'ng, kurslar ro'yxatini yangilash zarur bo'lmasa-da, 
        // keyinchalik "Ro'yxatdan o'tish" tugmasini "Ro'yxatdan o'tilgan" qilish uchun foydali
        await fetchAllCourses(token);
        addActionListeners();

    } catch (error) {
        console.error('Kursga yozilishda xato:', error);
        showAlert(error.message || 'Kursga yozilishda xato yuz berdi. Balki siz allaqachon ro\'yxatdan o\'tgandirsiz.', 'error');
    }
}

// Tahrirlash modalini ochish, ma'lumotlarni yuklash va formani to'ldirish
async function handleEdit(courseId, token) {
    try {
        // 1. Backenddan kurs ma'lumotlarini olish
        const response = await apiRequest(`/courses/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const course = response.course;

        // 2. Formani ma'lumotlar bilan to'ldirish
        document.getElementById('edit-course-id').value = course._id;
        document.getElementById('edit-title').value = course.title;
        document.getElementById('edit-description').value = course.description;
        document.getElementById('edit-price').value = course.price.toFixed(2);
        document.getElementById('edit-ispublished').value = course.isPublished.toString(); // Boolean ni String'ga aylantirish

        // 3. Modalni ko'rsatish
        editFormContainer.setAttribute('aria-hidden', 'false');

    } catch (error) {
        console.error('Kurs ma\'lumotlarini olishda xato:', error);
        showAlert('Kurs ma\'lumotlarini yuklab bo\'lmadi: ' + (error.message || 'Server xatosi'), 'error');
    }
}


// Edit tugmasini bosish handler'ini yangilash
// courses/courses.js (handleCourseActions funksiyasi)

async function handleCourseActions(e) {
    // 1. Agar bosilgan element tugma bo'lmasa, chiqib ketamiz
    if (!e.target.tagName === 'BUTTON') return;
    
    // 2. Kerakli ma'lumotlarni yagona atributdan olamiz
    const action = e.target.dataset.action;
    const courseId = e.target.dataset.courseId; // Biz loyihada asosan shu atributni ishlatdik

    if (!action || !courseId) {
        console.error("Harakat turi yoki Kurs ID'si topilmadi.");
        return;
    }
    
    const token = localStorage.getItem('userToken');

    // 3. Action turiga qarab mantiqni chaqiramiz
    if (action === 'enroll') {
        // Enroll mantiqi (avvalgi loyihangizdan)
        handleEnroll(courseId, token);
        
    } else if (action === 'edit') {
        // Kurs ma'lumotlarini tahrirlash mantiqi
        handleEdit(courseId, token); 
        
    } else if (action === 'delete') {
        // Kursni o'chirish mantiqi
        handleDelete(courseId, token);
        
    } else if (action === 'manage') { 
        // Dars materiallarini boshqarish sahifasiga o'tish
        window.location.href = `../course-manager/course-manager.html`;
    }
}

// ESLATMA: Iltimos, barcha tugmalaringizda faqat bitta atributni ishlating: data-course-id="[ID]"
// (e.target.dataset.id o'rniga faqat e.target.dataset.courseId ishlatilishi kerak)


// Bekor qilish tugmasini bosish (Formani yashirish)
cancelEditBtn.addEventListener('click', closeEditModal);
if (cancelEditBtn2) {
    cancelEditBtn2.addEventListener('click', closeEditModal);
}

function closeEditModal() {
    editFormContainer.setAttribute('aria-hidden', 'true');
    editCourseForm.reset();
}


// Formani SUBMIT qilish (PUT so'rovini yuborish)
editCourseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('userToken');

    const courseId = document.getElementById('edit-course-id').value;
    
    // Tahrirlangan ma'lumotlarni yig'ish
    const updatedData = {
        title: document.getElementById('edit-title').value,
        description: document.getElementById('edit-description').value,
        price: parseFloat(document.getElementById('edit-price').value),
        // String qiymatini Boolean qiymatiga aylantirish
        isPublished: document.getElementById('edit-ispublished').value === 'true'
    };

    try {
        const response = await apiRequest(`/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        showAlert(`Kurs muvaffaqiyatli yangilandi: ${response.course.title}`, 'success');
        editFormContainer.setAttribute('aria-hidden', 'true');
        editCourseForm.reset();
        
        // Kurslar ro'yxatini qayta yuklash
        await fetchAllCourses(token);
        addActionListeners();

    } catch (error) {
        console.error('Kursni yangilashda xato:', error);
        showAlert(error.message || 'Kursni yangilashda xato yuz berdi. Ruxsatlaringizni tekshiring.', 'error');
    }
});

// ============================================
// SEARCH VA FILTER FUNKSIYALARI
// ============================================

// Qidiruv funksiyasi
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterCourses(searchTerm);
    });
}

// Filter funksiyasi
function filterCourses(searchTerm = '') {
    let filteredCourses = [...allCourses];
    
    // Qidiruv bo'yicha filtrlash
    if (searchTerm) {
        filteredCourses = filteredCourses.filter(course => {
            const title = course.title?.toLowerCase() || '';
            const description = course.description?.toLowerCase() || '';
            const teacherName = course.teacher?.name?.toLowerCase() || '';
            return title.includes(searchTerm) || 
                   description.includes(searchTerm) || 
                   teacherName.includes(searchTerm);
        });
    }
    
    // Kurslar sonini yangilash
    coursesCount.textContent = `${filteredCourses.length} ${filteredCourses.length === 1 ? 'kurs' : 'kurs'}`;
    
    // Filtrlangan kurslarni ko'rsatish
    displayCourses(filteredCourses);
}

// Sidebar filter navigatsiyasi
document.querySelectorAll('.sidebar-nav .nav-item[data-filter]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Aktiv holatni yangilash
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const filter = item.dataset.filter;
        let filteredCourses = [...allCourses];
        
        if (filter === 'enrolled') {
            // Faqat ro'yxatdan o'tilgan kurslar
            filteredCourses = filteredCourses.filter(course => 
                enrolledCourseIds.includes(course._id)
            );
        } else if (filter === 'available') {
            // Faqat mavjud kurslar (ro'yxatdan o'tilmagan)
            filteredCourses = filteredCourses.filter(course => 
                !enrolledCourseIds.includes(course._id)
            );
        }
        // 'all' bo'lsa, barcha kurslar
        
        coursesCount.textContent = `${filteredCourses.length} ${filteredCourses.length === 1 ? 'kurs' : 'kurs'}`;
        displayCourses(filteredCourses);
    });
});
