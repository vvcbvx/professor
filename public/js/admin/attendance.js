import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== إدارة الغيابات (عرض الغيابات فقط) =====
export const Attendance = {
    students: [],
    teachers: [],
    filteredStudents: [],
    filteredTeachers: [],
    currentTab: 'students',
    
    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.attendance-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === tab) {
                btn.classList.add('active');
            }
        });
        
        const studentsSection = document.getElementById('studentsAttendanceSection');
        const teachersSection = document.getElementById('teachersAttendanceSection');
        
        if (studentsSection) {
            studentsSection.style.display = tab === 'students' ? 'block' : 'none';
        }
        if (teachersSection) {
            teachersSection.style.display = tab === 'teachers' ? 'block' : 'none';
        }
        
        if (tab === 'students') {
            this.loadStudentsAttendance();
        } else {
            this.loadTeachersAttendance();
        }
    },
    
    async loadStudentsAttendance() {
        try {
            const data = await API.get('/api/attendance/students');
            this.students = data.students || [];
            this.filteredStudents = [...this.students];
            this.renderStudentsTable();
            this.updateCount('students');
            this.updateSearchResults('student', this.filteredStudents.length);
        } catch (error) {
            console.error('Error loading students attendance:', error);
            Utils.showError('فشل تحميل غيابات الطلاب');
        }
    },
    
    async loadTeachersAttendance() {
        try {
            const data = await API.get('/api/attendance/teachers');
            this.teachers = data.teachers || [];
            this.filteredTeachers = [...this.teachers];
            this.renderTeachersTable();
            this.updateCount('teachers');
            this.updateSearchResults('teacher', this.filteredTeachers.length);
        } catch (error) {
            console.error('Error loading teachers attendance:', error);
            Utils.showError('فشل تحميل غيابات الأساتذة');
        }
    },
    
    renderStudentsTable() {
        const tbody = document.getElementById('studentsAttendanceTable');
        if (!tbody) return;
        
        if (this.filteredStudents.length > 0) {
            tbody.innerHTML = this.filteredStudents.map((s, index) => {
                const profile = s.profile || {};
                const stats = s.stats || {};
                
                const searchText = document.getElementById('studentSearchInput')?.value || '';
                const fullName = this.escapeHtml(profile.fullName || '-');
                const username = this.escapeHtml(s.username || '');
                
                const highlightedName = this.highlightText(fullName, searchText);
                const highlightedUsername = this.highlightText(username, searchText);
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${highlightedUsername}</strong></td>
                        <td>${highlightedName}</td>
                        <td><span class="status-badge absent">${stats.absentDays || 0}</span></td>
                        <td><span class="status-badge excused">${stats.excusedDays || 0}</span></td>
                        <td><span class="status-badge unexcused">${stats.unexcusedDays || 0}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="window.Attendance.viewStudentAttendance(${s.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="window.Attendance.openAddModal(${s.id}, 'student', '${this.escapeHtml(profile.fullName || s.username)}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-user-graduate"></i>
                            <p>لا يوجد طلاب</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    renderTeachersTable() {
        const tbody = document.getElementById('teachersAttendanceTable');
        if (!tbody) return;
        
        if (this.filteredTeachers.length > 0) {
            tbody.innerHTML = this.filteredTeachers.map((t, index) => {
                const profile = t.profile || {};
                const stats = t.stats || {};
                
                const searchText = document.getElementById('teacherSearchInput')?.value || '';
                const fullName = this.escapeHtml(profile.fullName || '-');
                const username = this.escapeHtml(t.username || '');
                
                const highlightedName = this.highlightText(fullName, searchText);
                const highlightedUsername = this.highlightText(username, searchText);
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${highlightedUsername}</strong></td>
                        <td>${highlightedName}</td>
                        <td><span class="status-badge absent">${stats.absentDays || 0}</span></td>
                        <td><span class="status-badge excused">${stats.excusedDays || 0}</span></td>
                        <td><span class="status-badge unexcused">${stats.unexcusedDays || 0}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="window.Attendance.viewTeacherAttendance(${t.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="window.Attendance.openAddModal(${t.id}, 'teacher', '${this.escapeHtml(profile.fullName || t.username)}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <p>لا يوجد أساتذة</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    openAddModal(userId, type, userName) {
        const existingModal = document.getElementById('addAttendanceModal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'addAttendanceModal';
        
        const today = new Date().toISOString().split('T')[0];
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:500px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-plus-circle"></i>
                        تسجيل غياب
                    </div>
                    <button class="modal-close" onclick="document.getElementById('addAttendanceModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:16px;padding:12px;background:#f0f3f8;border-radius:10px;">
                        <span style="font-weight:600;">${type === 'student' ? 'الطالب' : 'الأستاذ'}:</span>
                        <span style="color:#4a6cf7;font-weight:700;">${userName}</span>
                    </div>
                    
                    <form id="addAttendanceForm">
                        <input type="hidden" id="attendanceUserId" value="${userId}">
                        <input type="hidden" id="attendanceType" value="${type}">
                        
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt"></i> التاريخ <span class="required">*</span></label>
                            <input type="date" id="attendanceDate" value="${today}" required>
                            <div id="dateError" style="color:#ef4444;font-size:12px;margin-top:4px;display:none;">
                                <i class="fas fa-exclamation-circle"></i> هذا التاريخ تم تسجيله مسبقاً
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-info-circle"></i> الحالة <span class="required">*</span></label>
                            <select id="attendanceStatus" required>
                                <option value="">اختر الحالة</option>
                                <option value="absent">❌ غائب</option>
                                <option value="excused">📝 بعذر</option>
                                <option value="unexcused">⚠️ بدون عذر</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-sticky-note"></i> السبب (اختياري)</label>
                            <textarea id="attendanceReason" rows="2" placeholder="أدخل سبب الغياب إن وجد..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="display:flex;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #f0f2f5;">
                    <button class="btn btn-success" id="saveAttendanceBtn">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                    <button class="btn btn-outline" onclick="document.getElementById('addAttendanceModal').remove()">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const dateInput = document.getElementById('attendanceDate');
        const dateError = document.getElementById('dateError');
        
        dateInput.addEventListener('change', async function() {
            const selectedDate = this.value;
            const userId = document.getElementById('attendanceUserId').value;
            
            if (selectedDate && userId) {
                try {
                    const data = await API.get(`/api/attendance/check?userId=${userId}&date=${selectedDate}`);
                    if (data.exists) {
                        dateError.style.display = 'block';
                        document.getElementById('saveAttendanceBtn').disabled = true;
                        Utils.showWarning('⚠️ هذا التاريخ تم تسجيله مسبقاً لهذا المستخدم');
                    } else {
                        dateError.style.display = 'none';
                        document.getElementById('saveAttendanceBtn').disabled = false;
                    }
                } catch (error) {
                    console.error('Error checking date:', error);
                }
            }
        });
        
        const saveBtn = document.getElementById('saveAttendanceBtn');
        if (saveBtn) {
            saveBtn.onclick = async function() {
                await window.Attendance.saveAttendanceFromModal();
            };
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    async saveAttendanceFromModal() {
        const userIdInput = document.getElementById('attendanceUserId');
        const typeInput = document.getElementById('attendanceType');
        const dateInput = document.getElementById('attendanceDate');
        const statusSelect = document.getElementById('attendanceStatus');
        const reasonTextarea = document.getElementById('attendanceReason');
        const dateError = document.getElementById('dateError');
        
        if (!userIdInput || !dateInput || !statusSelect) {
            Utils.showError('خطأ في النموذج، يرجى إعادة المحاولة');
            return;
        }
        
        const userId = userIdInput.value;
        const type = typeInput ? typeInput.value : 'student';
        const date = dateInput.value;
        const status = statusSelect.value;
        const reason = reasonTextarea ? reasonTextarea.value : '';
        
        if (!userId) {
            Utils.showError('خطأ: معرف المستخدم غير موجود');
            return;
        }
        
        if (!date) {
            Utils.showError('الرجاء اختيار التاريخ');
            return;
        }
        
        if (!status) {
            Utils.showError('الرجاء اختيار الحالة');
            return;
        }
        
        const validStatuses = ['absent', 'excused', 'unexcused'];
        if (!validStatuses.includes(status)) {
            Utils.showError('حالة غير صحيحة');
            return;
        }
        
        try {
            const checkData = await API.get(`/api/attendance/check?userId=${userId}&date=${date}`);
            if (checkData.exists) {
                if (dateError) dateError.style.display = 'block';
                Utils.showWarning('⚠️ هذا التاريخ تم تسجيله مسبقاً لهذا المستخدم');
                return;
            }
        } catch (error) {
            console.error('Error checking date:', error);
        }
        
        const saveBtn = document.getElementById('saveAttendanceBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        }
        
        try {
            const dataToSend = {
                userId: parseInt(userId),
                date: date,
                status: status,
                reason: reason || '',
                type: type || 'student'
            };
            
            console.log('📤 إرسال بيانات الغياب:', dataToSend);
            
            const data = await API.post('/api/attendance/add', dataToSend);
            
            if (data.success) {
                Utils.showSuccess('✅ تم تسجيل الغياب بنجاح');
                const modal = document.getElementById('addAttendanceModal');
                if (modal) modal.remove();
                
                if (this.currentTab === 'students') {
                    await this.loadStudentsAttendance();
                } else {
                    await this.loadTeachersAttendance();
                }
            } else {
                Utils.showError(data.error || 'فشل تسجيل الغياب');
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
                }
            }
        } catch (error) {
            console.error('❌ Error adding attendance:', error);
            
            let errorMessage = 'حدث خطأ في تسجيل الغياب';
            if (error.message) {
                if (error.message.includes('تم تسجيل هذا اليوم')) {
                    errorMessage = '⚠️ هذا التاريخ تم تسجيله مسبقاً لهذا المستخدم';
                    if (dateError) dateError.style.display = 'block';
                } else {
                    errorMessage = error.message;
                }
            }
            
            Utils.showError(errorMessage);
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ';
            }
        }
    },
    
    highlightText(text, query) {
        if (!query || !text) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        if (index === -1) return text;
        return text.substring(0, index) + 
               `<span class="highlight">${text.substring(index, index + query.length)}</span>` + 
               text.substring(index + query.length);
    },
    
    filterStudents(query) {
        const searchInput = document.getElementById('studentSearchInput');
        const statusFilter = document.getElementById('studentStatusFilter');
        
        const searchText = (searchInput?.value || '').toLowerCase().trim();
        const status = statusFilter?.value || 'all';
        
        this.filteredStudents = this.students.filter(s => {
            const profile = s.profile || {};
            const fullName = (profile.fullName || '').toLowerCase();
            const username = (s.username || '').toLowerCase();
            const searchMatch = !searchText || 
                fullName.includes(searchText) || 
                username.includes(searchText);
            
            const stats = s.stats || {};
            let statusMatch = true;
            if (status === 'absent') statusMatch = (stats.absentDays || 0) > 0 || (stats.unexcusedDays || 0) > 0;
            else if (status === 'excused') statusMatch = (stats.excusedDays || 0) > 0;
            else if (status === 'unexcused') statusMatch = (stats.unexcusedDays || 0) > 0;
            
            return searchMatch && statusMatch;
        });
        
        this.renderStudentsTable();
        this.updateCount('students');
        this.updateSearchResults('student', this.filteredStudents.length);
    },
    
    filterTeachers(query) {
        const searchInput = document.getElementById('teacherSearchInput');
        const statusFilter = document.getElementById('teacherStatusFilter');
        
        const searchText = (searchInput?.value || '').toLowerCase().trim();
        const status = statusFilter?.value || 'all';
        
        this.filteredTeachers = this.teachers.filter(t => {
            const profile = t.profile || {};
            const fullName = (profile.fullName || '').toLowerCase();
            const username = (t.username || '').toLowerCase();
            const searchMatch = !searchText || 
                fullName.includes(searchText) || 
                username.includes(searchText);
            
            const stats = t.stats || {};
            let statusMatch = true;
            if (status === 'absent') statusMatch = (stats.absentDays || 0) > 0 || (stats.unexcusedDays || 0) > 0;
            else if (status === 'excused') statusMatch = (stats.excusedDays || 0) > 0;
            else if (status === 'unexcused') statusMatch = (stats.unexcusedDays || 0) > 0;
            
            return searchMatch && statusMatch;
        });
        
        this.renderTeachersTable();
        this.updateCount('teachers');
        this.updateSearchResults('teacher', this.filteredTeachers.length);
    },
    
    updateCount(type) {
        const countEl = document.getElementById(type === 'students' ? 'studentsAttendanceCount' : 'teachersAttendanceCount');
        if (countEl) {
            const data = type === 'students' ? this.filteredStudents : this.filteredTeachers;
            countEl.textContent = `${data.length} ${type === 'students' ? 'طالب' : 'أستاذ'}`;
        }
    },
    
    updateSearchResults(type, count) {
        const el = document.getElementById(type === 'student' ? 'studentSearchResults' : 'teacherSearchResults');
        if (el) {
            const total = type === 'student' ? this.students.length : this.teachers.length;
            el.textContent = `عرض ${count} من ${total} ${type === 'student' ? 'طالب' : 'أستاذ'}`;
        }
    },
    
    async viewStudentAttendance(userId) {
        try {
            const data = await API.get(`/api/attendance/student?userId=${userId}`);
            this.showAttendanceModal(data.attendance, 'طالب');
        } catch (error) {
            console.error('Error viewing student attendance:', error);
            Utils.showError('فشل تحميل تفاصيل الغيابات');
        }
    },
    
    async viewTeacherAttendance(userId) {
        try {
            const data = await API.get(`/api/attendance/teacher?userId=${userId}`);
            this.showAttendanceModal(data.attendance, 'أستاذ');
        } catch (error) {
            console.error('Error viewing teacher attendance:', error);
            Utils.showError('فشل تحميل تفاصيل الغيابات');
        }
    },
    
    showAttendanceModal(attendance, type) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        
        let rows = '';
        if (attendance && attendance.length > 0) {
            rows = attendance.map(a => `
                <tr>
                    <td>${new Date(a.date).toLocaleDateString('ar-SA')}</td>
                    <td><span class="status-badge ${a.status}">${this.getStatusText(a.status)}</span></td>
                    <td>${this.escapeHtml(a.reason || '-')}</td>
                </tr>
            `).join('');
        } else {
            rows = `
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
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:600px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-calendar-check"></i>
                        سجل الغيابات - ${type}
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                    <th>السبب</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    getStatusText(status) {
        const statusMap = {
            present: '✅ حاضر',
            absent: '❌ غائب',
            excused: '📝 بعذر',
            unexcused: '⚠️ بدون عذر'
        };
        return statusMap[status] || status;
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.Attendance = Attendance;