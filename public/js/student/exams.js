import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== امتحانات الطالب =====
const StudentExams = {
    exams: [],
    upcoming: [],
    past: [],
    
    async load() {
        try {
            const data = await API.get('/api/exams/student');
            this.exams = data.exams || [];
            this.upcoming = this.exams.filter(e => e.status === 'upcoming' || e.status === 'ongoing');
            this.past = this.exams.filter(e => e.status === 'completed');
            this.renderUpcoming();
            this.renderPast();
            this.updateCounts();
        } catch (error) {
            console.error('Error loading exams:', error);
            Utils.showError('فشل تحميل الامتحانات');
        }
    },
    
    renderUpcoming() {
        const container = document.getElementById('upcomingExams');
        if (!container) return;
        
        if (this.upcoming.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>لا توجد امتحانات قادمة</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.upcoming.map(exam => {
            const dateObj = new Date(exam.date + 'T00:00:00');
            const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            
            return `
                <div class="exam-card upcoming">
                    <div class="exam-card-header">
                        <span class="exam-subject">${this.escapeHtml(exam.subject)}</span>
                        <span class="exam-class">${this.escapeHtml(exam.className)}</span>
                        <span class="exam-status-badge ${exam.status}">
                            ${exam.status === 'upcoming' ? 'قادم' : 'جاري'}
                        </span>
                    </div>
                    <div class="exam-card-body">
                        <div class="exam-details">
                            <span><i class="fas fa-calendar-day"></i> ${dayNames[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}</span>
                            <span><i class="fas fa-user-tie"></i> ${this.escapeHtml(exam.teacherName)}</span>
                        </div>
                        ${exam.description ? `<div class="exam-description">${this.escapeHtml(exam.description)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    renderPast() {
        const container = document.getElementById('pastExams');
        if (!container) return;
        
        if (this.past.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>لا توجد امتحانات سابقة</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.past.map(exam => {
            const result = exam.result || {};
            const attended = result.attended || false;
            const grade = result.grade !== undefined && result.grade !== null ? result.grade : 'لم تصدر';
            
            const dateObj = new Date(exam.date + 'T00:00:00');
            const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            
            return `
                <div class="exam-card completed">
                    <div class="exam-card-header">
                        <span class="exam-subject">${this.escapeHtml(exam.subject)}</span>
                        <span class="exam-class">${this.escapeHtml(exam.className)}</span>
                        <span class="exam-status-badge completed">مكتمل</span>
                    </div>
                    <div class="exam-card-body">
                        <div class="exam-details">
                            <span><i class="fas fa-calendar-day"></i> ${dayNames[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}</span>
                            <span><i class="fas fa-user-tie"></i> ${this.escapeHtml(exam.teacherName)}</span>
                        </div>
                        <div class="exam-result">
                            <span class="result-label">الحضور:</span>
                            <span class="result-value ${attended ? 'attended' : 'absent'}">
                                ${attended ? '✅ حضر' : '❌ لم يحضر'}
                            </span>
                            <span class="result-label">الدرجة:</span>
                            <span class="result-value grade">${grade}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    updateCounts() {
        // التحقق من وجود العناصر قبل تحديثها
        const upcomingEl = document.getElementById('upcomingCount');
        const pastEl = document.getElementById('pastCount');
        
        if (upcomingEl) {
            upcomingEl.textContent = this.upcoming.length;
        }
        if (pastEl) {
            pastEl.textContent = this.past.length;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { StudentExams as Exams };