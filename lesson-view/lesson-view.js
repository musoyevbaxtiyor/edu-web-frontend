// edu-web-frontend/lesson-view/lesson-view.js

import { apiRequest, BASE_SERVER_URL } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const courseTitleEl = document.getElementById('course-title');
const courseTitleBadge = document.getElementById('course-title-badge');
const lessonListEl = document.getElementById('lesson-list');
const lessonTitleEl = document.getElementById('lesson-title');
const lessonOrderEl = document.getElementById('lesson-order');
const lessonStatusEl = document.getElementById('lesson-status');
const lessonContentEl = document.getElementById('lesson-content');
const taskSubmissionBoxEl = document.getElementById('task-submission-box');
const submitTaskBtn = document.getElementById('submit-task-btn');
const submissionMessageEl = document.getElementById('submission-message');
const submissionFileEl = document.getElementById('task-solution');
const submissionCommentEl = document.getElementById('submission-comment');
const userAvatar = document.getElementById('user-avatar');
const lessonsLoading = document.getElementById('lessons-loading');
const submissionDetailsEl = document.getElementById('submission-details');
const submittedFileInfoEl = document.getElementById('submitted-file-info');
const teacherFeedbackSectionEl = document.getElementById('teacher-feedback-section');
const teacherCoinsEl = document.getElementById('teacher-coins');
const teacherFeedbackTextEl = document.getElementById('teacher-feedback-text');
const submissionStatusBadgeEl = document.getElementById('submission-status-badge');

let currentCourseId = null;
let allLessons = [];
let currentLessonId = null;
let currentLesson = null;
const token = localStorage.getItem('userToken');

document.addEventListener('DOMContentLoaded', initializeLessonView);
submitTaskBtn.addEventListener('click', handleSubmitTask);

// Foydalanuvchi profilini yuklash
async function loadUserProfile() {
    try {
        const profileResponse = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
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

// URL dan courseId'ni oluvchi funksiya
function getCourseIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('courseId');
}

/**
 * Video URL ni embed formatiga o'zgartirish funksiyasi
 * Bu funksiya YouTube, Vimeo va boshqa platformalardan kelgan URL larni
 * iframe uchun mos embed formatiga o'zgartiradi (CAPTCHA muammosini hal qilish uchun)
 * @param {string} url - Video URL
 * @returns {string} - Embed formatidagi URL
 */
function convertToEmbedUrl(url) {
    if (!url) return '';
    
    // Agar allaqachon embed URL bo'lsa, qaytarish
    if (url.includes('/embed/') || url.includes('embed')) {
        return url;
    }
    
    try {
        // YouTube URL ni tekshirish va o'zgartirish
        // Formatlar: 
        // - https://www.youtube.com/watch?v=VIDEO_ID
        // - https://youtu.be/VIDEO_ID
        // - https://www.youtube.com/embed/VIDEO_ID (allaqachon embed)
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            let videoId = '';
            
            if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            }
            
            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
            }
        }
        
        // Vimeo URL ni tekshirish va o'zgartirish
        // Formatlar:
        // - https://vimeo.com/VIDEO_ID
        // - https://player.vimeo.com/video/VIDEO_ID (allaqachon embed)
        if (url.includes('vimeo.com/')) {
            let videoId = '';
            
            if (url.includes('player.vimeo.com')) {
                // Allaqachon embed formatida
                return url;
            } else if (url.includes('vimeo.com/')) {
                const match = url.match(/vimeo\.com\/(\d+)/);
                if (match && match[1]) {
                    videoId = match[1];
                    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
                }
            }
        }
        
        // Agar boshqa platforma bo'lsa yoki to'g'ri format topilmasa,
        // URL ni to'g'ridan-to'g'ri qaytarish (agar u iframe uchun mos bo'lsa)
        // Lekin xavfsizlik uchun faqat https protokoli bilan
        if (url.startsWith('https://')) {
            return url;
        }
        
        // Agar URL noto'g'ri bo'lsa, bo'sh qaytarish
        console.warn('Video URL ni embed formatiga o\'zgartirib bo\'lmadi:', url);
        return url;
        
    } catch (error) {
        console.error('Video URL o\'zgartirishda xato:', error);
        return url; // Xato bo'lsa ham, asl URL ni qaytarish
    }
}

// ... (initializeLessonView va fetchCourseAndLessons funksiyalari avvalgidek qoladi) ...

async function initializeLessonView() {
    if (!token) {
        showAlert("Avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }

    // Foydalanuvchi profilini yuklash
    await loadUserProfile();

    currentCourseId = getCourseIdFromUrl();
    if (!currentCourseId) {
        lessonContentEl.innerHTML = '<p class="error">Kurs ID si topilmadi.</p>';
        return;
    }
    
    // 1. Kurs va Darslarni yuklash
    await fetchCourseAndLessons(currentCourseId);
    
    // 2. Birinchi darsni yuklash (agar mavjud bo'lsa)
    if (allLessons.length > 0) {
        displayLessonContent(allLessons[0]);
    }
}


async function fetchCourseAndLessons(courseId) {
    try {
        // Kurs ma'lumotlarini olish
        const courseResponse = await apiRequest(`/courses/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const courseTitle = courseResponse.course.title || 'Kurs Nomi';
        if (courseTitleEl) {
            courseTitleEl.textContent = courseTitle;
        }
        document.getElementById('page-title').textContent = `${courseTitle} — Edu Web`;

        // Darslar ro'yxatini olish
        const lessonsResponse = await apiRequest(`/lessons/${courseId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        allLessons = lessonsResponse.lessons || [];
        
        // Loading holatini yashirish
        if (lessonsLoading) {
            lessonsLoading.style.display = 'none';
        }
        
        renderLessonList(allLessons);

    } catch (error) {
        console.error("Darslarni yuklashda xato:", error);
        if (lessonsLoading) {
            lessonsLoading.innerHTML = '<p class="error">Kurs ma\'lumotlarini yuklashda xato yuz berdi.</p>';
        }
        lessonContentEl.innerHTML = '<p class="error">Kurs ma\'lumotlarini yuklashda xato yuz berdi.</p>';
    }
}


// Chap panelda darslar ro'yxatini ko'rsatish
function renderLessonList(lessons) {
    lessonListEl.innerHTML = '';
    
    lessons.forEach(lesson => {
        const li = document.createElement('li');
        
        // --- Kontent turini aniqlash mantiqi (Taxmin qilinmoqda) ---
        let contentType = '';
        if (lesson.videoUrl) contentType = 'Video';
        else if (lesson.taskDescription) contentType = 'Vazifa';
        else if (lesson.documentationUrl) contentType = 'Qo\'llanma';
        // -----------------------------------------------------------

        let icon = '';
        let statusText = '';
        
        if (lesson.isLocked) {
            icon = '<i class="fas fa-lock"></i>';
            li.classList.add('locked');
            li.title = "Oldingi darsni tugating.";
        } else {
            const progressStatus = lesson.progressStatus;
            li.classList.add('unlocked');
            
            switch (progressStatus) {
                case 'completed':
                case 'approved':
                    icon = '<i class="fas fa-check-circle"></i>';
                    li.classList.add('completed');
                    statusText = 'Tugallangan';
                    break;
                case 'submitted':
                    icon = '<i class="fas fa-clock"></i>';
                    statusText = 'Tekshirilmoqda';
                    break;
                case 'started':
                    icon = '<i class="fas fa-play-circle"></i>';
                    statusText = 'Boshlangan';
                    break;
                default:
                    icon = '<i class="fas fa-circle"></i>';
                    statusText = 'Yangi';
                    break;
            }
        }

        // Kontent turi nomini to'g'ri ko'rsatish
        li.innerHTML = `
            <span class="lesson-icon">${icon}</span>
            <span class="lesson-info">
                <span class="lesson-number">${lesson.order}.</span>
                <span class="lesson-name">${lesson.title}</span>
            </span>
        `; 
        li.dataset.lessonId = lesson._id;
        
        // Bosish mantiqi faqat qulflanmagan darslar uchun
        if (!lesson.isLocked) {
            li.addEventListener('click', () => {
                displayLessonContent(lesson);
            });
        }
        
        lessonListEl.appendChild(li);
    });
}

// ----------------------------------------------------------------------
// ASOSIY YANGILANISH: BARCHA MA'LUMOTLARNI BIR VAZTDA KO'RSATISH
// ----------------------------------------------------------------------

/**
 * Tanlangan darsning barcha mavjud kontentini asosiy maydonda ko'rsatish
 * (If/else o'rniga ketma-ket qo'shish)
 * @param {object} lesson - Dars ma'lumotlari obyekti
 */
    // ... (displayLessonContent funksiyasining boshlanishi) ...

async function displayLessonContent(lesson) {
    // Avvalgi tanlangan darsning highlightini olib tashlash
    document.querySelectorAll('#lesson-list li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Joriy darsni highlight qilish
    const activeLi = document.querySelector(`[data-lesson-id="${lesson._id}"]`);
    if (activeLi) {
        activeLi.classList.add('active');
    }
    
    currentLesson = lesson;
    currentLessonId = lesson._id;
    
    // Lesson title va meta ma'lumotlarini yangilash
    if (lessonTitleEl) {
        lessonTitleEl.innerHTML = `<i class="fas fa-play-circle"></i> ${lesson.title}`;
    }
    
    if (lessonOrderEl) {
        lessonOrderEl.textContent = `Dars #${lesson.order}`;
    }
    
    // Statusni yangilash
    if (lessonStatusEl) {
        let statusClass = '';
        let statusText = '';
        let statusIcon = '';
        
        if (lesson.isLocked) {
            statusClass = '';
            statusText = 'Qulflangan';
            statusIcon = '<i class="fas fa-lock"></i>';
        } else {
            switch (lesson.progressStatus) {
                case 'completed':
                case 'approved':
                    statusClass = 'completed';
                    statusText = 'Tugallangan';
                    statusIcon = '<i class="fas fa-check-circle"></i>';
                    break;
                case 'submitted':
                    statusClass = 'submitted';
                    statusText = 'Tekshirilmoqda';
                    statusIcon = '<i class="fas fa-clock"></i>';
                    break;
                case 'started':
                    statusText = 'Boshlangan';
                    statusIcon = '<i class="fas fa-play-circle"></i>';
                    break;
                default:
                    statusText = 'Boshlanmagan';
                    statusIcon = '<i class="fas fa-circle"></i>';
                    break;
            }
        }
        
        lessonStatusEl.className = `lesson-status ${statusClass}`;
        lessonStatusEl.innerHTML = `${statusIcon} ${statusText}`;
    }

    // Dars qulflangan bo'lsa...
    if (lesson.isLocked) {
        lessonContentEl.innerHTML = '<p class="error">Bu dars hali qulflangan. Oldingi vazifani yakunlang.</p>';
        taskSubmissionBoxEl.style.display = 'none'; // Vazifa topshirish qutisini yashirish
        return; 
    }

    // 1. Darsni boshlash (Progress yaratish) mantiqi... (oldingidek qolsin)
    if (lesson.progressStatus === 'locked' && !lesson.isLocked) {
         // ... (try/catch bloklari) ...
         try {
            await apiRequest('/progress', { 
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId: lesson._id, courseId: currentCourseId }) // currentCourseId ni ishlatish
            });
            // Statusni yangilash
            lesson.progressStatus = 'started'; 
            // Dars ro'yxatini tez yangilash
            await fetchCourseAndLessons(currentCourseId); 
        } catch (error) {
            console.error('Progress yaratishda xato:', error);
        }
    }

    // ----------------------------------------------------------------------
    // 🔥🔥 ASOSIY KONTENTNI CHIQARISH MANTIQI 🔥🔥
    // ----------------------------------------------------------------------
    let contentHTML = '';

    // A. Video kontentni qo'shish (Agar video mavjud bo'lsa)
    if (lesson.videoUrl) {
        contentHTML += `
            <div class="lesson-video">
                <iframe width="100%" height="500" src="${lesson.videoUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
        `;
    }

    // B. Dokumentatsiya (Qo'llanma) kontentni qo'shish
    if (lesson.documentationUrl) {
        contentHTML += `
            <div class="lesson-documentation">
                <br>
                <p>Qo'llanma va materiallar: <a href="${lesson.documentationUrl}" target="_blank">Qo'llanmani ochish</a></p><br>
            </div>
        `;
    }

    // C. Vazifa tavsifi (Task Description) kontentni qo'shish
    if (lesson.taskDescription) {
        contentHTML += `
            <div class="lesson-task-description">
                <p>${lesson.taskDescription}</p>
                <br>
        `;
        // Agar vazifa fayli mavjud bo'lsa
        if (lesson.taskFileUrl) {
             contentHTML += `<p>Vazifa fayli: <a href="${lesson.taskFileUrl}" target="_blank">Faylni yuklab olish</a></p>`;
        }
        contentHTML += `</div>`;
        
        // Agar darsda vazifa bo'lsa, topshirish maydonini ko'rsatamiz.
        taskSubmissionBoxEl.style.display = 'block'; 
        
        // Submission maydonining holatini yangilash va submission ma'lumotlarini yuklash
        await loadSubmissionDetails(currentLessonId);

        if (lesson.progressStatus === 'submitted' || lesson.progressStatus === 'in_review') {
             submissionMessageEl.textContent = '⏳ Vazifa topshirilgan. O\'qituvchi tekshirishini kuting.';
             submissionMessageEl.className = 'submission-message warning';
             submitTaskBtn.disabled = true;
             submissionFileEl.disabled = true;
             submissionCommentEl.disabled = true;
        } else if (lesson.progressStatus === 'completed' || lesson.progressStatus === 'approved') {
             submissionMessageEl.textContent = '✅ Vazifa muvaffaqiyatli yakunlandi.';
             submissionMessageEl.className = 'submission-message success';
             submitTaskBtn.disabled = true;
             submissionFileEl.disabled = true;
             submissionCommentEl.disabled = true;
        } else {
             submissionMessageEl.textContent = '';
             submissionMessageEl.className = '';
             submitTaskBtn.disabled = false;
             submissionFileEl.disabled = false;
             submissionCommentEl.disabled = false;
        }

    } else {
        // Agar darsda vazifa bo'lmasa, topshirish maydonini yashiramiz
        taskSubmissionBoxEl.style.display = 'none';
    }

    // Nihoyat, HTMLni asosiy kontent elementiga joylashtirish
    lessonContentEl.innerHTML = contentHTML;
}

// Submission ma'lumotlarini yuklash va ko'rsatish
async function loadSubmissionDetails(lessonId) {
    try {
        const response = await apiRequest(`/submissions/my/${lessonId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.submission) {
            displaySubmissionDetails(response.submission);
        } else {
            // Submission yo'q bo'lsa, ma'lumotlarni yashirish
            submissionDetailsEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Submission ma\'lumotlarini yuklashda xato:', error);
        // Xato bo'lsa ham ma'lumotlarni yashirish
        submissionDetailsEl.style.display = 'none';
    }
}

// Submission ma'lumotlarini ko'rsatish
function displaySubmissionDetails(submission) {
    if (!submission) {
        submissionDetailsEl.style.display = 'none';
        return;
    }

    // Submission details section'ni ko'rsatish
    submissionDetailsEl.style.display = 'block';

    // O'quvchi yuborgan task ma'lumotlarini ko'rsatish
    displaySubmittedFile(submission);

    // O'qituvchi bahosi va izohini ko'rsatish (agar mavjud bo'lsa)
    if (submission.status === 'approved' || submission.status === 'rejected' || submission.status === 'in_review') {
        displayTeacherFeedback(submission);
    } else {
        teacherFeedbackSectionEl.style.display = 'none';
    }
}

// Yuborilgan fayl ma'lumotlarini ko'rsatish
function displaySubmittedFile(submission) {
    if (!submission.submissionUrl) {
        submittedFileInfoEl.innerHTML = '<p style="color: var(--text-secondary);">Fayl topilmadi.</p>';
        return;
    }

    const fileUrl = `${BASE_SERVER_URL}${submission.submissionUrl}`;
    const fileDate = new Date(submission.createdAt).toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let fileInfoHTML = `
        <div class="file-info-item">
            <i class="fas fa-file-alt"></i>
            <a href="${fileUrl}" target="_blank" download>
                Yuborilgan faylni ko'rish/yuklab olish
            </a>
            <span class="file-date">${fileDate}</span>
        </div>
    `;

    // Agar izoh bo'lsa
    if (submission.submissionComment) {
        fileInfoHTML += `
            <div style="padding: 0.75rem; background: var(--light-bg); border-radius: 0.5rem; margin-top: 0.5rem;">
                <strong style="color: var(--text-primary);">Izoh:</strong>
                <p style="color: var(--text-secondary); margin-top: 0.25rem; margin-bottom: 0;">${submission.submissionComment}</p>
            </div>
        `;
    }

    submittedFileInfoEl.innerHTML = fileInfoHTML;
}

// O'qituvchi bahosi va izohini ko'rsatish
function displayTeacherFeedback(submission) {
    teacherFeedbackSectionEl.style.display = 'block';

    // Coins
    if (submission.coins !== undefined && submission.coins !== null) {
        teacherCoinsEl.textContent = submission.coins;
    } else {
        teacherCoinsEl.textContent = '0';
    }

    // Izoh
    if (submission.feedback) {
        teacherFeedbackTextEl.textContent = submission.feedback;
    } else {
        teacherFeedbackTextEl.textContent = 'Izoh kiritilmagan.';
        teacherFeedbackTextEl.style.color = 'var(--text-secondary)';
        teacherFeedbackTextEl.style.fontStyle = 'italic';
    }

    // Status badge
    let statusText = '';
    let statusClass = '';
    
    switch (submission.status) {
        case 'approved':
            statusText = 'Tasdiqlangan';
            statusClass = 'approved';
            break;
        case 'rejected':
            statusText = 'Rad etilgan';
            statusClass = 'rejected';
            break;
        case 'in_review':
            statusText = 'Tekshirilmoqda';
            statusClass = 'in_review';
            break;
        case 'submitted':
            statusText = 'Topshirilgan';
            statusClass = 'submitted';
            break;
        default:
            statusText = submission.status || '-';
            statusClass = 'submitted';
    }

    submissionStatusBadgeEl.textContent = statusText;
    submissionStatusBadgeEl.className = `status-badge ${statusClass}`;
}

















// async function displayLessonContent(lesson) {























//     // ... (boshlang'ich kodlar) ...

//     // Dars qulflangan bo'lsa, kontentni ko'rsatmaslik.
//     // Eslatma: Backend qulflangan dars kontentini o'chirib yuboradi, bu faqat xavfsizlik uchun.
//     if (lesson.isLocked) {
//         lessonContentEl.innerHTML = '<p class="error">Bu dars hali qulflangan. Oldingi vazifani yakunlang.</p>';
//         return; 
//     }
    
//     // 1. Darsni boshlash (Progress yaratish)
//     // Agar dars "unlocked" bo'lsa, uni "started" ga o'tkazamiz
//     if (lesson.progressStatus === 'locked' && !lesson.isLocked) {
//         try {
//             await apiRequest('/progress', { 
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ lessonId: lesson._id, courseId: currentCourseId }) // currentCourseId ni ishlatish
//             });
//             // Statusni yangilash
//             lesson.progressStatus = 'started'; 
//             // Dars ro'yxatini tez yangilash
//             await fetchCourseAndLessons(currentCourseId); 
//         } catch (error) {
//             console.error('Progress yaratishda xato:', error);
//         }
//     }
    
//     // ... (Barcha kontentni ko'rsatish mantiqi) ...
// }

// ----------------------------------------------------------------------
// VAZIFA TOPSHIRISH MANTIQI
// ----------------------------------------------------------------------

// async function handleSubmitTask() {
//     if (!currentLessonId) {
//         submissionMessageEl.textContent = 'Xato: Dars ID si topilmadi.';
//         return;
//     }
    
//     const submissionText = submissionInputEl.value.trim();
//     if (submissionText === '') {
//         submissionMessageEl.textContent = 'Iltimos, vazifa yechimi manzilini yoki matnini kiriting.';
//         return;
//     }

//     try {
//         submissionMessageEl.textContent = 'Vazifa yuborilmoqda...';
        
//         const data = {
//             lessonId: currentLessonId,
//             submissionText: submissionText,
//             courseId: currentCourseId, // Bu ham kerak bo'lishi mumkin
//         };

//         // Backendda Submission yaratish uchun API so'rovi
//         const response = await apiRequest('/submissions', { // Sizning submission endpointingiz
//             method: 'POST',
//             headers: { 
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(data)
//         });

//         submissionMessageEl.textContent = `✅ Vazifa muvaffaqiyatli topshirildi. Status: ${response.submission?.status || 'Tekshirilmoqda'}.`;
//         submissionInputEl.value = ''; // Inputni tozalash
        
//         // Dars ro'yxatini yangilash orqali statusni ko'rsatish
//         await fetchCourseAndLessons(currentCourseId); 

//     } catch (error) {
//         console.error('Vazifani topshirishda xato:', error);
//         submissionMessageEl.textContent = `❌ Vazifani topshirishda xato: ${error.message || 'Server xatosi'}`;
//     }
// }

// ----------------------------------------------------------------------
// 🔥 VAZIFA TOPSHIRISH MANTIQI (FAYL UCHUN) 🔥
// ----------------------------------------------------------------------

async function handleSubmitTask() {
    if (!currentLessonId || !currentCourseId) {
        submissionMessageEl.textContent = 'Xato: Dars yoki Kurs ID si topilmadi.';
        return;
    }
    
    const file = submissionFileEl.files[0]; // Tanlangan faylni olish
    const comment = submissionCommentEl.value.trim();
    
    if (!file) {
        submissionMessageEl.textContent = 'Iltimos, vazifa yechim faylini tanlang.';
        return;
    }

    try {
        submissionMessageEl.textContent = 'Vazifa yuborilmoqda...';
        
        // 🔥 FormData obyektini yaratish
        const formData = new FormData();
        formData.append('submissionFile', file); // Backend middleware nomi: 'submissionFile'
        formData.append('lessonId', currentLessonId);
        formData.append('courseId', currentCourseId);
        formData.append('submissionComment', comment);
        
        // Backendda Submission yaratish uchun API so'rovi
        const response = await apiRequest('/submissions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                // 🔥 MUHIM: Content-Type sarlavhasini O'CHIRIB TASHLANG
                // Chunki FormData o'zi uni multipart/form-data deb belgilaydi
            },
            body: formData // 🔥 FormData ni yuboramiz
        });

        submissionMessageEl.textContent = `✅ Vazifa muvaffaqiyatli topshirildi. Status: ${response.progress?.status || 'submitted'}.`;
        submissionMessageEl.className = 'submission-message success';
        submissionFileEl.value = '';
        submissionCommentEl.value = '';
        
        // Dars ro'yxatini yangilash
        await fetchCourseAndLessons(currentCourseId);
        
        // Joriy darsni qayta ko'rsatish
        if (currentLesson) {
            const updatedLesson = allLessons.find(l => l._id === currentLessonId);
            if (updatedLesson) {
                await displayLessonContent(updatedLesson);
            }
        } 

    } catch (error) {
        console.error('Vazifani topshirishda xato:', error);
        submissionMessageEl.textContent = `❌ Vazifani topshirishda xato: ${error.message || 'Server xatosi'}. Fayl hajmi yoki turini tekshiring.`;
        submissionMessageEl.className = 'submission-message error';
    }
}