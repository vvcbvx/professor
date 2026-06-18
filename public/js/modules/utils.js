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
        
        // إنشاء عنصر الإشعار
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
        
        // إظهار الإشعار
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(-50%) translateY(0)';
            notification.style.opacity = '1';
        });
        
        // إخفاء الإشعار بعد المدة
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
    
    .custom-notification {
        animation: slideDown 0.5s ease forwards;
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
`;
document.head.appendChild(style);