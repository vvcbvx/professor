// ===== المصادقة والجلسة =====
const Auth = {
    user: null,
    
    init() {
        this.user = JSON.parse(localStorage.getItem('user'));
        if (!this.user) {
            window.location.replace('/login.html');
            return false;
        }
        return true;
    },
    
    checkRole(role) {
        if (!this.user || this.user.role !== role) {
            window.location.replace('/login.html');
            return false;
        }
        return true;
    },
    
    logout() {
        if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
        
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الخروج...';
        }
        
        let logoutCompleted = false;
        
        fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            logoutCompleted = true;
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login.html');
        })
        .catch(error => {
            logoutCompleted = true;
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login.html');
        });
        
        setTimeout(() => {
            if (!logoutCompleted) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/login.html');
            }
        }, 3000);
    },
    
    getUser() {
        return this.user;
    }
};

// ===== أدوات مساعدة =====
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-SA');
    },
    
    showError(message) {
        alert('❌ ' + message);
    },
    
    showSuccess(message) {
        alert('✅ ' + message);
    },
    
    loading(element, show) {
        if (element) {
            element.innerHTML = show ? 
                '<div class="loading-spinner"><i class="fas fa-spinner"></i> جاري التحميل...</div>' : '';
        }
    }
};

// ===== التنقل =====
const Navigation = {
    currentSection: 'dashboard',
    history: ['dashboard'],
    sectionTitles: {},
    
    init(sectionTitles) {
        this.sectionTitles = sectionTitles;
    },
    
    navigateTo(sectionId) {
        document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`section-${sectionId}`);
        if (target) target.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.section === sectionId) el.classList.add('active');
        });

        const info = this.sectionTitles[sectionId] || { title: sectionId, icon: 'fa-folder' };
        document.getElementById('pageTitle').innerHTML = `<i class="fas ${info.icon}"></i> ${info.title}`;

        const backBtn = document.getElementById('backBtn');
        if (this.history.length > 1 && this.history[this.history.length - 1] !== sectionId) {
            backBtn.style.display = 'flex';
        } else {
            backBtn.style.display = 'none';
        }

        if (this.history[this.history.length - 1] !== sectionId) {
            this.history.push(sectionId);
        }

        this.currentSection = sectionId;
        this.closeSidebar();
        
        // تشغيل حدث التنقل
        if (window.onSectionChange) {
            window.onSectionChange(sectionId);
        }
    },
    
    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            this.navigateTo(this.history[this.history.length - 1]);
        }
    },
    
    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('show');
    },
    
    closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('show');
    }
};

// ===== دوال API =====
const API = {
    async get(endpoint) {
        const response = await fetch(endpoint);
        return response.json();
    },
    
    async post(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    async put(endpoint, data) {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },
    
    async delete(endpoint) {
        const response = await fetch(endpoint, { method: 'DELETE' });
        return response.json();
    },
    
    async upload(endpoint, formData) {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        return response.json();
    }
};