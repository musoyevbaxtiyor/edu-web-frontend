import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const loginForm = document.getElementById('login-form');
const loginButton = document.getElementById('login-btn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    loginButton.disabled = true;
    loginButton.textContent = 'Tekshirilmoqda...';
    
    // Formadagi ma'lumotlarni olish
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // Backend'dagi /api/auth/login endpointiga so'rov yuborish
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        // YENGI QADAM: Tokenni Local Storage'ga saqlash
        localStorage.setItem('userToken', data.token);

        // Muvaffaqiyatli javob
        console.log('Kirish muvaffaqiyatli:', data);
        showAlert(`Xush kelibsiz, ${data.name}!`, 'success');
        
        // Tizimga kirish muvaffaqiyatli bo'lsa, dashboardga yo'naltirish
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1500);

    } catch (error) {
        // Xatoni ko'rsatish
        console.error('Kirishda xato:', error);
        showAlert(error.message || 'Kirishda xato yuz berdi. Email yoki parolni tekshiring.', 'error');

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Kirish';
    }
});