import { apiRequest } from '../assets/js/api.js';
import { showAlert } from '../assets/js/alert.js';

const registerForm = document.getElementById('register-form');
const registerButton = document.getElementById('register-btn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Tugmani bloklash va matnni o'zgartirish
    registerButton.disabled = true;
    registerButton.textContent = 'Yuklanmoqda...';
    
    // Formadagi ma'lumotlarni olish
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // YENGI MA'LUMOTLARNI OLISH
    const phone = document.getElementById('phone').value;
    const age = parseInt(document.getElementById('age').value); // Yosh raqam (Number) bo'lishi kerak

    try {
        // Ma'lumotlarni backendga POST so'rovi bilan yuborish
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password, phone, age }), // YENGI MAYDONLAR QO'SHILDI
        });

        // YENGI QADAM: Tokenni Local Storage'ga saqlash
        localStorage.setItem('userToken', data.token);

        // Muvaffaqiyatli javob
        console.log('Ro\'yxatdan o\'tish muvaffaqiyatli:', data);
        showAlert(`Muvaffaqiyatli! Foydalanuvchi: ${data.name}. Endi tizimga kirishingiz mumkin.`, 'success');
        
        // Kirish sahifasiga yo'naltirish
        setTimeout(() => {
            window.location.href = '../login/login.html';
        }, 2000);

    } catch (error) {
        // Xatoni ko'rsatish
        console.error('Ro\'yxatdan o\'tishda xato:', error);
        showAlert(error.message || 'Ro\'yxatdan o\'tishda kutilmagan xato yuz berdi.', 'error');

    } finally {
        // Tugmani qayta tiklash
        registerButton.disabled = false;
        registerButton.textContent = 'Ro\'yxatdan O\'tish';
    }
});