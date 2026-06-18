// ===== أدوات مساعدة =====
export const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-SA');
    },
    
    // ===== إشعار نجاح =====
    showSuccess(message) {
        this.showNotification(message, 'success');
    },
    
    // ===== إشعار خطأ =====
    showError(message) {
        this.showNotification(message, 'error');
    },
    
    // ===== إشعار تحذير =====
    showWarning(message) {
        this.showNotification(message, 'warning');
    },
    
    // ===== إشعار معلومات =====
    showInfo(message) {
        this.showNotification(message, 'info');
    },
    
    // ===== نظام الإشعارات المتقدم =====
    showNotification(message, type = 'info', duration = 4000) {
        // إزالة الإشعارات القديمة
        const oldNotifications = document.querySelectorAll('.custom-notification');
        oldNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `custom-notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#4a6cf7'
        };
        
        const titles = {
            success: '✅ نجاح',
            error: '❌ خطأ',
            warning: '⚠️ تحذير',
            info: 'ℹ️ معلومات'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: white;
            padding: 16px 24px;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 14px;
            font-family: 'Cairo', sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #1a2332;
            border-right: 5px solid ${colors[type]};
            min-width: 280px;
            max-width: 90%;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            direction: rtl;
            box-sizing: border-box;
        `;
        
        notification.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;flex:1;">
                <div style="width:36px;height:36px;border-radius:50%;background:${colors[type]}20;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-weight:600;margin-bottom:2px;">${titles[type]}</div>
                    <div style="font-weight:400;color:#4a5a6e;font-size:14px;line-height:1.5;">${message}</div>
                </div>
            </div>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#8a9bae;cursor:pointer;font-size:18px;padding:4px;flex-shrink:0;transition:all 0.3s;">
                <i class="fas fa-times"></i>
            </button>
            <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:${colors[type]};border-radius:0 0 16px 16px;animation:progressBar ${duration}ms linear forwards;">
            </div>
        `;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
            notification.style.opacity = '1';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, duration);
    },
    
    // ===== نافذة تأكيد مخصصة (بدلاً من confirm) =====
    showConfirm(title, message, onConfirm, onCancel) {
        const oldConfirm = document.querySelector('.custom-confirm-overlay');
        if (oldConfirm) oldConfirm.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
        `;
        
        const box = document.createElement('div');
        box.className = 'custom-confirm';
        box.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 32px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            animation: modalSlideIn 0.3s ease;
            box-shadow: 0 32px 80px rgba(0,0,0,0.2);
        `;
        
        box.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
            <h3 style="font-size:20px;font-weight:700;color:#1a2332;margin-bottom:8px;">${title}</h3>
            <p style="font-size:15px;color:#4a5a6e;margin-bottom:24px;line-height:1.6;">${message}</p>
            <div style="display:flex;gap:12px;justify-content:center;">
                <button class="confirm-yes" style="padding:10px 32px;background:#4a6cf7;color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.3s;">
                    نعم
                </button>
                <button class="confirm-no" style="padding:10px 32px;background:#f0f3f8;color:#1a2332;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.3s;">
                    إلغاء
                </button>
            </div>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        const yesBtn = overlay.querySelector('.confirm-yes');
        const noBtn = overlay.querySelector('.confirm-no');
        
        yesBtn.addEventListener('click', () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        });
        
        noBtn.addEventListener('click', () => {
            overlay.remove();
            if (onCancel) onCancel();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onCancel) onCancel();
            }
        });
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
                if (onCancel) onCancel();
            }
        };
        document.addEventListener('keydown', escHandler);
        
        return overlay;
    },
    
    // ===== دالة تأكيد بديلة (Promise) =====
    async confirmAction(title, message) {
        return new Promise((resolve) => {
            this.showConfirm(title, message, () => {
                resolve(true);
            }, () => {
                resolve(false);
            });
        });
    },
    
    loading(element, show) {
        if (element) {
            element.innerHTML = show ? 
                '<div class="loading-spinner"><i class="fas fa-spinner"></i> جاري التحميل...</div>' : '';
        }
    },
    
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 5);
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== إضافة الأنيميشن =====
const style = document.createElement('style');
style.textContent = `
    @keyframes progressBar {
        from { width: 100%; }
        to { width: 0%; }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-24px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .custom-notification {
        animation: slideDown 0.5s ease forwards;
    }
    
    .custom-confirm-overlay {
        animation: fadeIn 0.3s ease;
    }
    
    .confirm-yes:hover {
        background: #3b5de7 !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(74,108,247,0.3);
    }
    
    .confirm-no:hover {
        background: #e4e9f0 !important;
    }
`;
document.head.appendChild(style);