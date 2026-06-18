import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== ملف الأستاذ - طلابي =====
const TeacherStudents = {
    students: [],
    
    async load() {
        try {
            const data = await API.get('/api/teacher/students');
            this.students = data.students || [];
            this.renderTable();
            this.updateCount();
        } catch (error) {
            console.error('Error loading teacher students:', error);
            Utils.showError('فشل تحميل الطلاب');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;
        
        if (this.students && this.students.length > 0) {
            tbody.innerHTML = this.students.map((s, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${this.escapeHtml(s.username)}</td>
                    <td>${this.escapeHtml(s.profile?.fullName || '-')}</td>
                    <td>${this.escapeHtml(s.profile?.phone || '-')}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>لا يوجد طلاب مسجلين لديك</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    updateCount() {
        const countEl = document.getElementById('studentsCount');
        if (countEl) {
            countEl.textContent = `${this.students ? this.students.length : 0} طالب`;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== تصدير الكائن =====
export { TeacherStudents as Students };