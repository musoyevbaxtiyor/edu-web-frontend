/**
 * Chiroyli Alert va Confirm komponentlari
 * Barcha alert() va confirm() chaqiruvlarini chiroyli dizaynga moslashtirish uchun
 */

// Alert komponenti HTML strukturasini yaratish
function createAlertHTML(message, type = 'info') {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };
    
    const alertHTML = `
        <div class="custom-alert" id="${alertId}" data-type="${type}">
            <div class="alert-content">
                <div class="alert-icon">${icons[type] || icons.info}</div>
                <div class="alert-message">${message}</div>
                <button class="alert-close" onclick="closeAlert('${alertId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="alert-progress-bar"></div>
        </div>
    `;
    
    return { alertId, alertHTML };
}

// Alert komponentini sahifaga qo'shish
function showAlert(message, type = 'info', duration = 5000) {
    // Agar alert konteyner mavjud bo'lmasa, yaratamiz
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        document.body.appendChild(alertContainer);
    }
    
    const { alertId, alertHTML } = createAlertHTML(message, type);
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    const alertElement = document.getElementById(alertId);
    
    // Animatsiya bilan ko'rsatish
    setTimeout(() => {
        alertElement.classList.add('show');
    }, 10);
    
    // Avtomatik yopish
    if (duration > 0) {
        const progressBar = alertElement.querySelector('.alert-progress-bar');
        progressBar.style.animation = `progressBar ${duration}ms linear forwards`;
        
        setTimeout(() => {
            closeAlert(alertId);
        }, duration);
    }
    
    return alertId;
}

// Alertni yopish
function closeAlert(alertId) {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
        alertElement.classList.add('hide');
        setTimeout(() => {
            alertElement.remove();
        }, 300);
    }
}

// Confirm dialog komponenti
function showConfirm(message, title = 'Tasdiqlash') {
    return new Promise((resolve) => {
        const confirmId = `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Resolve funksiyasini saqlash
        const resolveConfirm = (result) => {
            closeConfirm(confirmId);
            resolve(result);
        };
        
        const confirmHTML = `
            <div class="custom-confirm-overlay" id="${confirmId}">
                <div class="custom-confirm-dialog">
                    <div class="confirm-header">
                        <h3>${title}</h3>
                        <button class="confirm-close" data-confirm-id="${confirmId}" data-result="false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="confirm-body">
                        <div class="confirm-icon">
                            <i class="fas fa-question-circle"></i>
                        </div>
                        <p class="confirm-message">${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="confirm-btn confirm-btn-cancel" data-confirm-id="${confirmId}" data-result="false">
                            Bekor qilish
                        </button>
                        <button class="confirm-btn confirm-btn-ok" data-confirm-id="${confirmId}" data-result="true">
                            Tasdiqlash
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmHTML);
        
        const confirmElement = document.getElementById(confirmId);
        
        // Resolve funksiyasini elementga biriktirish
        confirmElement._resolve = resolveConfirm;
        
        // Animatsiya bilan ko'rsatish
        setTimeout(() => {
            confirmElement.classList.add('show');
        }, 10);
        
        // Tugmalarga event listener qo'shish
        confirmElement.querySelectorAll('[data-confirm-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const result = btn.dataset.result === 'true';
                resolveConfirm(result);
            });
        });
        
        // ESC tugmasi bilan yopish
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                resolveConfirm(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Overlay bosilganda yopish
        confirmElement.addEventListener('click', (e) => {
            if (e.target === confirmElement) {
                resolveConfirm(false);
            }
        });
    });
}

// Confirmni yopish
function closeConfirm(confirmId) {
    const confirmElement = document.getElementById(confirmId);
    if (confirmElement) {
        confirmElement.classList.add('hide');
        setTimeout(() => {
            confirmElement.remove();
        }, 300);
    }
}

// Eksport qilish (ES6 modul)
export { showAlert, showConfirm, closeAlert, closeConfirm };

// Global funksiyalar sifatida ham qo'shish (eski kod bilan moslashish uchun)
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.closeAlert = closeAlert;
window.closeConfirm = closeConfirm;

// alert() va confirm() ni override qilish (ixtiyoriy)
window.originalAlert = window.alert;
window.originalConfirm = window.confirm;

window.alert = function(message) {
    showAlert(message, 'info');
};

window.confirm = async function(message) {
    return await showConfirm(message, 'Tasdiqlash');
};
