import { API } from '../modules/api.js';

// ===== لوحة التحكم =====
export const Dashboard = {
    stats: {},
    classStats: [],
    
    // ===== تحميل الإحصائيات =====
    async loadStats() {
        try {
            // ✅ جلب الإحصائيات
            const statsData = await API.get('/api/admin/stats');
            this.stats = statsData.stats || {};
            
            // ✅ جلب بيانات الصفوف مع تفاصيل الأساتذة من مسار منفصل
            const classesData = await API.get('/api/admin/classes');
            this.classStats = classesData.classes || [];
            
            this.updateStatsCards();
            this.renderClassesTable();
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            const errorEl = document.getElementById('dashboardError');
            if (errorEl) {
                errorEl.innerHTML = '❌ فشل تحميل الإحصائيات. يرجى تحديث الصفحة.';
            }
        }
    },
    
    // ===== تحديث بطاقات الإحصائيات =====
    updateStatsCards() {
        const cards = {
            totalStudents: 'عدد الطلاب',
            totalTeachers: 'عدد الأساتذة',
            totalClasses: 'عدد الصفوف',
            classesWithTeacher: 'صفوف مع أستاذ',
            classesWithoutTeacher: 'صفوف بدون أستاذ'
        };
        
        Object.keys(cards).forEach(key => {
            const el = document.getElementById(key);
            if (el) {
                el.textContent = this.stats[key] !== undefined ? this.stats[key] : 0;
            }
        });
    },
    
    // ===== عرض جدول الصفوف (معدل) =====
    renderClassesTable() {
        const tbody = document.getElementById('dashboardClassesTable');
        if (!tbody) return;
        
        if (this.classStats && this.classStats.length > 0) {
            tbody.innerHTML = this.classStats.map((c, index) => {
                const hasTeacher = c.teacherIds && c.teacherIds.length > 0;
                
                let teachersHtml = 'غير معين';
                if (hasTeacher && c.teachers && c.teachers.length > 0) {
                    // ✅ عرض الأسماء مع فاصلة بين كل اسمين
                    const names = c.teachers.map(t => {
                        const fullName = t.fullName || t.username;
                        return this.escapeHtml(fullName);
                    });
                    // ربط الأسماء بفاصلة
                    teachersHtml = names.join('، ');
                } else if (hasTeacher && c.teacherIds) {
                    teachersHtml = `✔ معين (${c.teacherIds.length} أستاذ)`;
                }
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${this.escapeHtml(c.className)}</strong></td>
                        <td>${c.year}</td>
                        <td>
                            ${hasTeacher 
                                ? `<span style="color:#10b981;"><i class="fas fa-check-circle"></i> ${teachersHtml}</span>`
                                : `<span style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> غير معين</span>`
                            }
                        </td>
                        <td>${c.studentsCount || 0}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="fas fa-book"></i>
                            <p>لا يوجد صفوف</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        const countEl = document.getElementById('classesStatsCount');
        if (countEl) {
            countEl.textContent = `${this.classStats ? this.classStats.length : 0} صف`;
        }
    },
    
    // ===== تنظيف النص =====
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};