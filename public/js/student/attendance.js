import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== غيابات الطالب (عرض الغيابات فقط) =====
const StudentAttendance = {
    attendance: [],
    stats: {},
    
    async load() {
        try {
            const data = await API.get('/api/attendance/student');
            this.attendance = data.attendance || [];
            this.stats = data.stats || {};
            
            console.log('📊 بيانات الغيابات المستلمة:', this.stats);
            console.log('📋 تفاصيل الغيابات:', this.attendance);
            
            // التأكد من أن الأرقام صحيحة
            if (this.attendance.length > 0) {
                // حساب الإحصائيات يدوياً للتأكد
                const absentCount = this.attendance.filter(a => a.status === 'absent').length;
                const excusedCount = this.attendance.filter(a => a.status === 'excused').length;
                const unexcusedCount = this.attendance.filter(a => a.status === 'unexcused').length;
                
                console.log(`📊 حساب يدوي: غياب=${absentCount}, بعذر=${excusedCount}, بدون عذر=${unexcusedCount}`);
                
                // إذا كانت الإحصائيات غير صحيحة، استخدم الحساب اليدوي
                if (this.stats.absentDays !== absentCount) {
                    this.stats.absentDays = absentCount;
                }
                if (this.stats.excusedDays !== excusedCount) {
                    this.stats.excusedDays = excusedCount;
                }
                if (this.stats.unexcusedDays !== unexcusedCount) {
                    this.stats.unexcusedDays = unexcusedCount;
                }
            }
            
            this.renderStats();
            this.renderTable();
        } catch (error) {
            console.error('Error loading attendance:', error);
            Utils.showError('فشل تحميل سجل الغيابات');
        }
    },
    
    renderStats() {
        const stats = this.stats;
        
        // عرض أيام الغياب فقط
        const absentEl = document.getElementById('absentDays');
        const excusedEl = document.getElementById('excusedDays');
        const unexcusedEl = document.getElementById('unexcusedDays');
        
        if (absentEl) {
            absentEl.textContent = stats.absentDays || 0;
            console.log(`✅ عرض أيام الغياب: ${absentEl.textContent}`);
        }
        if (excusedEl) {
            excusedEl.textContent = stats.excusedDays || 0;
        }
        if (unexcusedEl) {
            unexcusedEl.textContent = stats.unexcusedDays || 0;
        }
        
        // التأكد من أن الأعداد صحيحة
        const total = (stats.absentDays || 0) + (stats.excusedDays || 0) + (stats.unexcusedDays || 0);
        console.log(`📊 المجموع الكلي للغيابات: ${total}`);
        
        // إذا كان هناك غيابات في الجدول ولكن الأعداد صفر، قم بتحديثها
        if (this.attendance && this.attendance.length > 0 && total === 0) {
            console.log('⚠️ تنبيه: هناك غيابات ولكن الإحصائيات صفر!');
            // إعادة حساب الإحصائيات من الجدول
            const absentCount = this.attendance.filter(a => a.status === 'absent').length;
            const excusedCount = this.attendance.filter(a => a.status === 'excused').length;
            const unexcusedCount = this.attendance.filter(a => a.status === 'unexcused').length;
            
            if (absentEl) absentEl.textContent = absentCount;
            if (excusedEl) excusedEl.textContent = excusedCount;
            if (unexcusedEl) unexcusedEl.textContent = unexcusedCount;
            
            console.log(`✅ تم التصحيح: غياب=${absentCount}, بعذر=${excusedCount}, بدون عذر=${unexcusedCount}`);
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('attendanceTable');
        if (!tbody) return;
        
        if (this.attendance && this.attendance.length > 0) {
            tbody.innerHTML = this.attendance.map(a => `
                <tr>
                    <td>${new Date(a.date).toLocaleDateString('ar-SA')}</td>
                    <td><span class="status-badge ${a.status}">${this.getStatusText(a.status)}</span></td>
                    <td>${this.escapeHtml(a.reason || '-')}</td>
                </tr>
            `).join('');
            
            console.log(`✅ تم عرض ${this.attendance.length} سجل غياب`);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        <div class="empty-state">
                            <i class="fas fa-calendar-check"></i>
                            <p>لا توجد سجلات غياب</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    getStatusText(status) {
        const map = {
            present: '✅ حاضر',
            absent: '❌ غائب',
            excused: '📝 بعذر',
            unexcused: '⚠️ بدون عذر'
        };
        return map[status] || status;
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { StudentAttendance as Attendance };