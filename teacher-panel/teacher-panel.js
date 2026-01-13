// edu-web-frontend/teacher-panel/teacher-panel.js

import { apiRequest, BASE_SERVER_URL } from '../assets/js/api.js'; // apiRequest va BASE_SERVER_URL ni import qilish shart
import { showAlert } from '../assets/js/alert.js';

const token = localStorage.getItem('userToken');
const submissionListContainer = document.getElementById('submissions-list-container');
const submissionCountEl = document.getElementById('submission-count');
const modal = document.getElementById('feedback-modal');
const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');
const closeBtn = document.getElementById('close-modal-btn');
const reviewModalForm = document.getElementById('review-modal-form'); // Modal ichidagi formani olish
const submissionDataMap = new Map(); // 🔥 Submission ob'ektlarini saqlash uchun Map

let currentSubmissionId = null; 

document.addEventListener('DOMContentLoaded', initializeTeacherPanel);
approveBtn.addEventListener('click', () => handleSubmissionReview('approved'));
rejectBtn.addEventListener('click', () => handleSubmissionReview('rejected'));
closeBtn.addEventListener('click', () => modal.style.display = 'none');
// reviewModalForm.addEventListener('submit', (e) => e.preventDefault()); // Agar form ishlatilsa.


// 1. Panelni yuklash
async function initializeTeacherPanel() {
    if (!token) {
        showAlert("Avtorizatsiyadan o'ting.", 'warning');
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 1500);
        return;
    }
    
    // Foydalanuvchi ma'lumotlarini yuklash
    await loadTeacherInfo();
    await fetchPendingSubmissions();
}

// Foydalanuvchi ma'lumotlarini yuklash
async function loadTeacherInfo() {
    try {
        const response = await apiRequest('/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const user = response.user;
        const displayName = user.name || 'O\'qituvchi';
        const teacherInfoEl = document.getElementById('teacher-info');
        
        if (teacherInfoEl) {
            const initials = getInitials(displayName);
            teacherInfoEl.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1rem;">
                    ${initials}
                </div>
                <span>${displayName}</span>
            `;
        }
    } catch (error) {
        console.error("Foydalanuvchi ma'lumotlarini yuklashda xato:", error);
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


// 2. Vazifalar ro'yxatini Backenddan olish
async function fetchPendingSubmissions() {
    try {
        const response = await apiRequest('/submissions/teacher/pending', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const submissions = response.submissions || [];
        submissionCountEl.textContent = submissions.length;
        
        // 🔥 Ma'lumotlarni Mapga saqlash
        submissionDataMap.clear();
        submissions.forEach(sub => submissionDataMap.set(sub._id, sub));
        
        renderSubmissionsList(submissions);

    } catch (error) {
        console.error("Vazifalarni yuklashda xato:", error);
        submissionListContainer.innerHTML = '<p class="error">Tekshirilmagan vazifalarni yuklashda xato yuz berdi. Konsolni tekshiring.</p>';
    }
}


// 3. Vazifalar ro'yxatini HTMLda ko'rsatish
function renderSubmissionsList(submissions) {
    submissionListContainer.innerHTML = '';
    
    if (submissions.length === 0) {
        submissionListContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem; color: #64748b; font-weight: 500;">Hozircha tekshirilmagan vazifalar mavjud emas. ✅</p>
            </div>
        `;
        return;
    }

    submissions.forEach(submission => {
        const lessonTitle = submission.lesson ? `${submission.lesson.order}. ${submission.lesson.title}` : 'Dars nomi topilmadi';
        const studentName = submission.user ? submission.user.name : 'Talaba nomi topilmadi';
        
        const card = document.createElement('div');
        card.className = 'submission-card';
        card.innerHTML = `
            <h4>Dars: ${lessonTitle}</h4>
            <p>Talaba: <strong>${studentName}</strong> (${submission.user.email})</p>
            <p>Topshirilgan sana: ${new Date(submission.createdAt).toLocaleString()}</p>
            <p>Status: <span class="status ${submission.status}">${submission.status}</span></p>
            <button class="review-btn" data-submission-id="${submission._id}">
                Ko'rib chiqish
            </button>
        `;
        
        submissionListContainer.appendChild(card);
    });
    
    // Har bir "Ko'rib chiqish" tugmasiga listener qo'shish
    document.querySelectorAll('.review-btn').forEach(button => {
        button.addEventListener('click', openReviewModal); // 🔥 Endi faqat ID orqali chaqiramiz
    });
}


// 4. Modalni ochish va ma'lumotlarni to'ldirish (YANGILANGAN)
function openReviewModal(e) {
    const btn = e.target;
    currentSubmissionId = btn.dataset.submissionId;

    // 🔥 MAP DAN TO'LIQ SUBMISSION OB'YEKTI OLISH
    const submission = submissionDataMap.get(currentSubmissionId);

    if (!submission) {
        console.error("Submission ma'lumotlari Mapda topilmadi.");
        return;
    }
    
    document.getElementById('modal-lesson-title').textContent = submission.lesson.title;
    document.getElementById('modal-student-name').textContent = submission.user.name;

    // 🔥 SUBMISSION KONTENTINI FAYLGA MOSLASH VA MODALGA JOYLASHTIRISH
    const submissionContentEl = document.getElementById('modal-submission-text'); // Eski nomini ishlatamiz

    let contentHTML = '';
    
    // Agar submissionUrl mavjud bo'lsa
    if (submission.submissionUrl) {
        // submissionUrl format: /uploads/submissions/filename
        // BASE_SERVER_URL format: https://edu-web-backend.onrender.com
        const fileUrl = BASE_SERVER_URL + submission.submissionUrl;
        const fileName = submission.submissionUrl.split('/').pop();

        contentHTML += `<h4>Topshirilgan fayl/link:</h4>`;
        contentHTML += `<p class="submission-file-info">
                            <a href="${fileUrl}" target="_blank" download class="download-link">
                                ⬇️ Faylni Yuklab Olish (${fileName})
                            </a>
                        </p>`;
    } else {
         contentHTML += `<p>Talaba fayl yuklamagan. Eski matn/link: ${submission.submissionText || 'Mavjud emas'}</p>`;
    }
    
    // Agar talaba kommentariya yozgan bo'lsa (submissionComment modelga qo'shilgan)
    if (submission.submissionComment) {
         contentHTML += `<h4>Talaba Izohi:</h4>`;
         contentHTML += `<p class="comment-text">${submission.submissionComment}</p>`;
    }

    submissionContentEl.innerHTML = contentHTML;

    // Eski feedback va coins'ni tozalash
    document.getElementById('coins-input').value = submission.coins || 10;
    document.getElementById('feedback-input').value = submission.feedback || '';
    
    modal.style.display = 'flex'; // Modalni ko'rsatish
}


// 5. Vazifani tasdiqlash yoki rad etish
async function handleSubmissionReview(status) {
    if (!currentSubmissionId) return;
    
    const coins = document.getElementById('coins-input').value;
    const feedback = document.getElementById('feedback-input').value;
    
    // Faqat tasdiqlashda coins'ni tekshirish
    if (status === 'approved' && (!coins || coins < 0)) {
        showAlert("Iltimos, 0 dan katta bo'lgan coins miqdorini kiriting.", 'warning');
        return;
    }
    
    const url = `/submissions/review/${currentSubmissionId}`; 

    try {
        // Coins rad etishda 0, tasdiqlashda kiritilgan coins bo'lsin
        const finalCoins = status === 'approved' ? coins : 0;

        const response = await apiRequest(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                coins: finalCoins,
                feedback: feedback,
                status: status 
            })
        });

        showAlert(response.message, 'success'); 
        
        modal.style.display = 'none';
        await fetchPendingSubmissions(); 

    } catch (error) {
        console.error("Vazifani baholashda xato:", error);
        showAlert(`Xato: Vazifani baholashda xato yuz berdi. Konsolni tekshiring.`, 'error');
    }
}