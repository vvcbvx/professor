import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== ملف الأستاذ - طلابي مع ملاحظات =====
const TeacherStudents = {
    students: [],
    filteredStudents: [],
    searchQuery: '',
    selectedClassId: null,
    classes: [],
    isLoading: false,
    
    async load() {
        // منع التحميل المتكرر
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📥 بدء تحميل طلابي...');
            
            // تحميل الصفوف أولاً
            const classesData = await API.get('/api/teacher/classes');
            console.log('📊 استجابة الصفوف:', classesData);
            
            this.classes = classesData.classes || [];
            console.log('📊 الصفوف المحملة:', this.classes.length, 'صف');
            
            // عرض القائمة المنسدلة
            this.renderClassesSelect();
            
            // إذا كان هناك صف محدد مسبقاً
            if (this.selectedClassId) {
                await this.loadStudentsByClass(this.selectedClassId);
            } else if (this.classes.length > 0) {
                // تحديد أول صف افتراضياً
                this.selectedClassId = this.classes[0].id;
                await this.loadStudentsByClass(this.selectedClassId);
            } else {
                // لا يوجد صفوف - عرض رسالة
                this.showNoClassesMessage();
            }
        } catch (error) {
            console.error('❌ Error loading teacher students:', error);
            Utils.showError('فشل تحميل الطلاب: ' + (error.message || ''));
            this.showErrorMessage(error.message);
        } finally {
            this.isLoading = false;
        }
    },
    
    showNoClassesMessage() {
        const tbody = document.getElementById('studentsTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-school"></i>
                            <p>لا توجد صفوف مسجلة لك</p>
                            <span style="font-size:13px;color:#8a9bae;">سيتم عرض الصفوف التي تم تعيينك عليها</span>
                        </div>
                    </td>
                </tr>
            `;
        }
        this.updateCount();
        this.updateSearchResults();
        
        const classNameEl = document.getElementById('currentClassName');
        if (classNameEl) {
            classNameEl.textContent = 'لا توجد صفوف';
        }
    },
    
    showErrorMessage(message) {
        const tbody = document.getElementById('studentsTable');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>حدث خطأ في تحميل الطلاب</p>
                            <span style="font-size:13px;color:#8a9bae;">${message || 'يرجى المحاولة مرة أخرى'}</span>
                            <button class="btn btn-sm btn-primary" onclick="window.TeacherStudents.load()" style="margin-top:8px;width:auto;padding:4px 16px;">
                                <i class="fas fa-sync"></i> إعادة المحاولة
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    renderClassesSelect() {
        const select = document.getElementById('classSelect');
        if (!select) {
            console.error('❌ عنصر classSelect غير موجود');
            return;
        }
        
        if (!this.classes || this.classes.length === 0) {
            select.innerHTML = '<option value="">لا توجد صفوف</option>';
            return;
        }
        
        // حفظ القيمة المحددة حالياً
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">اختر الصف</option>';
        this.classes.forEach(c => {
            const selected = (c.id === this.selectedClassId || c.id === parseInt(currentValue)) ? 'selected' : '';
            select.innerHTML += `<option value="${c.id}" ${selected}>${this.escapeHtml(c.className)} (${c.subject || 'بدون مادة'})</option>`;
        });
        
        // إذا لم يتم تحديد صف، حدد الأول
        if (!select.value && this.classes.length > 0) {
            select.value = this.classes[0].id;
            this.selectedClassId = this.classes[0].id;
        }
        
        // إزالة المستمع القديم وإضافة مستمع جديد
        select.removeEventListener('change', this._handleClassChange);
        this._handleClassChange = (e) => {
            const classId = parseInt(e.target.value);
            if (classId) {
                this.selectedClassId = classId;
                this.loadStudentsByClass(classId);
            }
        };
        select.addEventListener('change', this._handleClassChange);
        
        console.log('✅ تم عرض الصفوف في القائمة المنسدلة');
    },
    
    async loadStudentsByClass(classId) {
        try {
            console.log(`📥 تحميل طلاب الصف ${classId}...`);
            
            // عرض حالة التحميل
            const tbody = document.getElementById('studentsTable');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="loading-spinner"><i class="fas fa-spinner"></i> جاري تحميل الطلاب...</div>
                        </td>
                    </tr>
                `;
            }
            
            const data = await API.get(`/api/teacher/students-notes/${classId}`);
            console.log('📊 بيانات الطلاب:', data);
            
            this.students = data.students || [];
            this.filteredStudents = [...this.students];
            
            // تحديث اسم الصف
            const classNameEl = document.getElementById('currentClassName');
            if (classNameEl) {
                classNameEl.textContent = data.className || 'الصف';
            }
            
            this.renderTable();
            this.updateCount();
            this.updateSearchResults();
        } catch (error) {
            console.error('❌ Error loading students by class:', error);
            Utils.showError('فشل تحميل الطلاب: ' + (error.message || ''));
            
            const tbody = document.getElementById('studentsTable');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>حدث خطأ في تحميل الطلاب</p>
                                <button class="btn btn-sm btn-primary" onclick="window.TeacherStudents.loadStudentsByClass(${classId})" style="margin-top:8px;width:auto;padding:4px 16px;">
                                    <i class="fas fa-sync"></i> إعادة المحاولة
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;
        
        if (this.filteredStudents && this.filteredStudents.length > 0) {
            tbody.innerHTML = this.filteredStudents.map((s, index) => {
                const searchText = document.getElementById('studentSearchInput')?.value || '';
                const fullName = this.escapeHtml(s.fullName || s.username || '-');
                const username = this.escapeHtml(s.username || '');
                
                const highlightedName = this.highlightText(fullName, searchText);
                const highlightedUsername = this.highlightText(username, searchText);
                
                const successRate = s.successRate || 0;
                const focusRate = s.focusRate || 0;
                
                const getRateColor = (rate) => {
                    if (rate >= 80) return '#10b981';
                    if (rate >= 60) return '#f59e0b';
                    return '#ef4444';
                };
                
                const getRateLabel = (rate) => {
                    if (rate >= 80) return 'ممتاز';
                    if (rate >= 60) return 'جيد';
                    if (rate >= 40) return 'متوسط';
                    return 'ضعيف';
                };
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${highlightedUsername}</strong></td>
                        <td>${highlightedName}</td>
                        <td>
                            ${s.hasNote ? 
                                `<span class="has-note" style="font-size:18px;">📝</span>` : 
                                `<span class="no-note" style="color:#d0d7e0;">-</span>`
                            }
                        </td>
                        <td>
                            ${s.hasNote ? `
                                <div style="display:flex;align-items:center;gap:4px;">
                                    <span style="color:${getRateColor(s.successRate || 0)};font-weight:700;">
                                        ${s.successRate || 0}%
                                    </span>
                                    <span style="font-size:11px;color:#8a9bae;">(${getRateLabel(s.successRate || 0)})</span>
                                </div>
                            ` : '-'}
                        </td>
                        <td>
                            ${s.hasNote ? `
                                <div style="display:flex;align-items:center;gap:4px;">
                                    <span style="color:${getRateColor(s.focusRate || 0)};font-weight:700;">
                                        ${s.focusRate || 0}%
                                    </span>
                                    <span style="font-size:11px;color:#8a9bae;">(${getRateLabel(s.focusRate || 0)})</span>
                                </div>
                            ` : '-'}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="window.TeacherStudents.openNoteModal(${s.id}, '${this.escapeHtml(s.fullName || s.username)}')" style="padding:2px 10px;font-size:11px;">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${s.hasNote ? `
                                <button class="btn btn-sm btn-success" onclick="window.TeacherStudents.viewNote(${s.id})" style="padding:2px 10px;font-size:11px;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>لا يوجد طلاب في هذا الصف</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    filterStudents(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (!this.searchQuery) {
            this.filteredStudents = [...this.students];
        } else {
            this.filteredStudents = this.students.filter(s => {
                const fullName = (s.fullName || s.username || '').toLowerCase();
                const username = (s.username || '').toLowerCase();
                return fullName.includes(this.searchQuery) || username.includes(this.searchQuery);
            });
        }
        
        this.renderTable();
        this.updateSearchResults();
    },
    
    highlightText(text, query) {
        if (!query || !text) return text;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        if (index === -1) return text;
        return text.substring(0, index) + 
               `<span class="highlight" style="background:#fef3c7;color:#d97706;padding:0 4px;border-radius:4px;font-weight:700;">${text.substring(index, index + query.length)}</span>` + 
               text.substring(index + query.length);
    },
    
    openNoteModal(studentId, studentName) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'noteModal';
        
        const student = this.students.find(s => s.id === studentId);
        const currentNote = student?.note || '';
        const currentFocus = student?.focusRate || 50;
        const currentSuccess = student?.successRate || 50;
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:500px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-edit"></i>
                        ملاحظة للطالب: ${this.escapeHtml(studentName)}
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="noteForm">
                        <input type="hidden" id="noteStudentId" value="${studentId}">
                        
                        <div class="form-group">
                            <label><i class="fas fa-sticky-note"></i>الملاحظة</label>
                            <textarea id="noteText" rows="4" placeholder="أدخل ملاحظتك عن الطالب..." style="width:100%;padding:10px 14px;border:2px solid #e8ecf1;border-radius:10px;font-size:14px;font-family:'Cairo',sans-serif;">${this.escapeHtml(currentNote)}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-trophy"></i>نسبة التفوق</label>
                            <input type="range" id="successRate" min="0" max="100" value="${currentSuccess}" 
                                   style="width:100%;" oninput="document.getElementById('successRateLabel').textContent = this.value + '%'">
                            <span id="successRateLabel" style="font-weight:700;color:#4a6cf7;">${currentSuccess}%</span>
                            <span style="font-size:12px;color:#8a9bae;">(بناءً على أداء الطالب في الامتحانات)</span>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-eye"></i>نسبة التركيز</label>
                            <input type="range" id="focusRate" min="0" max="100" value="${currentFocus}" 
                                   style="width:100%;" oninput="document.getElementById('focusRateLabel').textContent = this.value + '%'">
                            <span id="focusRateLabel" style="font-weight:700;color:#4a6cf7;">${currentFocus}%</span>
                            <span style="font-size:12px;color:#8a9bae;">(مدى تركيز الطالب في الصف)</span>
                        </div>
                    </form>
                </div>
                <div class="modal-footer" style="display:flex;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #f0f2f5;">
                    <button class="btn btn-success" id="saveNoteBtn">
                        <i class="fas fa-save"></i> حفظ الملاحظة
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('saveNoteBtn').addEventListener('click', async () => {
            const studentId = document.getElementById('noteStudentId').value;
            const note = document.getElementById('noteText').value;
            const focusRate = parseInt(document.getElementById('focusRate').value);
            const successRate = parseInt(document.getElementById('successRate').value);
            
            if (!note.trim()) {
                Utils.showError('الرجاء كتابة ملاحظة');
                return;
            }
            
            try {
                const data = await API.post('/api/teacher/student-note', {
                    studentId: parseInt(studentId),
                    note: note.trim(),
                    focusRate,
                    successRate
                });
                
                if (data.success) {
                    Utils.showSuccess('✅ تم حفظ الملاحظة بنجاح');
                    modal.remove();
                    await this.load();
                } else {
                    Utils.showError(data.error || 'فشل حفظ الملاحظة');
                }
            } catch (error) {
                console.error('Error saving note:', error);
                Utils.showError('حدث خطأ في حفظ الملاحظة');
            }
        });
    },
    
    async viewNote(studentId) {
        try {
            const data = await API.get(`/api/student/notes/${studentId}`);
            const notes = data.notes || [];
            
            if (notes.length === 0) {
                Utils.showInfo('لا توجد ملاحظات لهذا الطالب');
                return;
            }
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay show';
            
            const notesHtml = notes.map(n => `
                <div class="note-item" style="background:#f8fafc;border-radius:12px;padding:12px 16px;margin-bottom:12px;border:1px solid #eef2f7;">
                    <div class="note-header" style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px;color:#8a9bae;">
                        <span class="note-teacher" style="font-weight:600;color:#4a6cf7;">${this.escapeHtml(n.teacherName)}</span>
                        <span class="note-date">${new Date(n.createdAt).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="note-content" style="font-size:14px;color:#1a2332;margin-bottom:6px;line-height:1.6;">${this.escapeHtml(n.note)}</div>
                    <div class="note-rates" style="display:flex;gap:16px;font-size:12px;color:#4a5a6e;">
                        <span style="background:white;padding:2px 10px;border-radius:10px;border:1px solid #e8ecf1;">التفوق: ${n.successRate || 0}%</span>
                        <span style="background:white;padding:2px 10px;border-radius:10px;border:1px solid #e8ecf1;">التركيز: ${n.focusRate || 0}%</span>
                    </div>
                </div>
            `).join('');
            
            modal.innerHTML = `
                <div class="modal-box" style="max-width:550px;">
                    <div class="modal-header">
                        <div class="modal-title">
                            <i class="fas fa-sticky-note"></i>
                            ملاحظات الطالب
                        </div>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${notesHtml}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error viewing notes:', error);
            Utils.showError('فشل تحميل الملاحظات');
        }
    },
    
    updateCount() {
        const countEl = document.getElementById('studentsCount');
        if (countEl) {
            countEl.textContent = `${this.filteredStudents ? this.filteredStudents.length : 0} طالب`;
        }
    },
    
    updateSearchResults() {
        const resultEl = document.getElementById('searchResults');
        if (resultEl) {
            const total = this.students ? this.students.length : 0;
            const shown = this.filteredStudents ? this.filteredStudents.length : 0;
            resultEl.textContent = `عرض ${shown} من ${total} طالب`;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { TeacherStudents as Students };