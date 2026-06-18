// ===== المصادقة =====
export const Auth = {
    user: null,
    
    async init() {
        try {
            const response = await fetch('/api/current-user', {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    this.user = data.user;
                    localStorage.setItem('user', JSON.stringify(data.user));
                    return true;
                }
            }

            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                this.user = localUser;
                return true;
            }

            localStorage.removeItem('user');
            window.location.replace('/login.html');
            return false;
        } catch (error) {
            console.error('Auth init error:', error);
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                this.user = localUser;
                return true;
            }
            window.location.replace('/login.html');
            return false;
        }
    },
    
    checkRole(role) {
        if (!this.user || this.user.role !== role) {
            window.location.replace('/login.html');
            return false;
        }
        return true;
    },
    
    async logout() {
        if (!confirm('هل أنت متأكد من تسجيل الخروج؟')) return;

        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الخروج...';
        }

        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/login.html');
            }
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login.html');
        }
    },
    
    getUser() {
        return this.user;
    }
};