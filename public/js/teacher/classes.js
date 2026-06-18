import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== ملف الأستاذ - صفوفي مع امتحانات =====
const TeacherClasses = {
    classes: [],
    exams: [],
    selectedClass: null,
    showAddForm: false,
    
    async load() {
        try {
            const classesData = await API.get('/api/teacher/classes');
            this.classes = classesData.classes || [];
            
            const examsData = await API.get('/api/exams/teacher');
            this.exams = examsData.exams || [];
            
            this.renderClasses();
            this.updateCount();
        } catch (error) {
            console.error('Error loading teacher classes:', error);
            Utils.showError('فشل تحميل الصفوف');
        }
    },
    
    renderClasses() {
        const container = document.getElementById('classesContainer');
        if (!container) return;
        
        if (this.classes && this.classes.length > 0) {
            container.innerHTML = this.classes.map(c => {
                const classExams = this.exams.filter(e => e.classId === c.id);
                const examCount = classExams.length;
                
                return `
                    <div class="class-card" onclick="window.TeacherClasses.showClassDetails(${c.id})" data-class-id="${c.id}">
                        <div class="class-card-header">
                            <div class="class-card-icon">
                                <i class="fas fa-school"></i>
                            </div>
                            <div class="class-card-info">
                                <h3>${this.escapeHtml(c.className)}</h3>
                                <span class="class-year">السنة: ${c.year} | المادة: ${c.subject || 'غير محدد'}</span>
                            </div>
                            <div class="class-card-badge">
                                <i class="fas fa-users"></i>
                                <span>${c.students?.length || 0}</span>
                            </div>
                        </div>
                        <div class="class-card-footer">
                            <span class="students-label">
                                <i class="fas fa-pencil-alt"></i>
                                الامتحانات: ${examCount}
                            </span>
                            <span class="view-details-btn">
                                عرض التفاصيل <i class="fas fa-arrow-left"></i>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-school"></i>
                    <p>لا توجد صفوف مسجلة لك</p>
                    <span style="font-size:13px;color:#8a9bae;">سيتم عرض الصفوف التي تم تعيينك عليها</span>
                </div>
            `;
        }
    },
    
    async showClassDetails(classId) {
        const classData = this.classes.find(c => c.id === classId);
        if (!classData) {
            Utils.showError('الصف غير موجود');
            return;
        }
        
        this.selectedClass = classData;
        this.showAddForm = false;
        
        document.getElementById('section-classes').classList.remove('active');
        document.getElementById('section-class-details').classList.add('active');
        
        document.getElementById('pageTitle').innerHTML = `<i class="fas fa-school"></i> ${this.escapeHtml(classData.className)}`;
        
        await this.renderClassDetails(classData);
        
        if (window.TeacherExams) {
            window.TeacherExams.generateWeekDays();
        }
    },
    
    async renderClassDetails(classData) {
        const container = document.getElementById('classDetailsContent');
        if (!container) return;
        
        const classExams = this.exams.filter(e => e.classId === classData.id);
        
        const studentsData = await API.get('/api/teacher/students');
        const classStudents = studentsData.students ? studentsData.students.filter(s => s.classId === classData.id) : [];
        
        // بناء نموذج إضافة الامتحان
        let addFormHtml = `
            <div class="add-exam-form-container ${this.showAddForm ? 'show' : ''}" id="addExamFormContainer">
                <h4 style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:12px;">
                    <i class="fas fa-plus-circle" style="color:#4a6cf7;"></i>
                    إضافة امتحان جديد
                </h4>
                <form id="addExamForm" onsubmit="window.TeacherExams.addExam(event)">
                    <input type="hidden" id="examClassId" value="${classData.id}">
                    <div class="form-grid">
                        <div class="form-group">
                            <label><i class="fas fa-book"></i>المادة <span class="required">*</span></label>
                            <input type="text" id="examSubject" placeholder="اسم المادة" required value="${this.escapeHtml(classData.subject || '')}">
                        </div>
                        <div class="form-group full-width">
                            <label><i class="fas fa-sticky-note"></i>ملاحظات</label>
                            <textarea id="examDescription" rows="2" placeholder="ملاحظات عن الامتحان"></textarea>
                        </div>
                    </div>
                    
                    <div id="weekDaysContainer" style="margin-top:12px;">
                        <div style="padding:12px;text-align:center;color:#8a9bae;">اختر يوم الامتحان من الأيام أدناه</div>
                    </div>
                    
                    <input type="hidden" id="examDate" required>
                    
                    <div style="display:flex;gap:10px;margin-top:16px;">
                        <button type="submit" class="btn btn-success" style="flex:1;" id="submitExamBtn">
                            <i class="fas fa-save"></i> حفظ الامتحان
                        </button>
                        <button type="button" class="btn btn-outline" onclick="window.TeacherClasses.toggleAddForm()" style="flex:0.5;">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // عرض الامتحانات
        let examsHtml = '';
        if (classExams.length > 0) {
            const statusColors = {
                upcoming: '#f59e0b',
                ongoing: '#4a6cf7',
                completed: '#10b981'
            };
            const statusTexts = {
                upcoming: 'قادم',
                ongoing: 'قيد التنفيذ',
                completed: 'مكتمل'
            };
            
            examsHtml = classExams.map(exam => {
                const dateObj = new Date(exam.date + 'T00:00:00');
                const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                
                return `
                    <div class="exam-mini-card">
                        <div class="exam-info">
                            <span style="font-weight:700;">${this.escapeHtml(exam.subject)}</span>
                            <span class="exam-status-badge ${exam.status}">${statusTexts[exam.status] || exam.status}</span>
                            <span style="font-size:12px;color:#8a9bae;">
                                <i class="fas fa-calendar-day"></i> ${dayNames[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}
                            </span>
                        </div>
                        <div class="exam-actions">
                            ${exam.status === 'upcoming' ? `
                                <button class="btn btn-sm btn-primary" onclick="window.TeacherExams.startExam(${exam.id})">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="window.TeacherExams.deleteExam(${exam.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            ${exam.status === 'ongoing' ? `
                                <button class="btn btn-sm btn-success" onclick="window.TeacherExams.completeExam(${exam.id})">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            ${exam.status === 'completed' ? `
                                <button class="btn btn-sm btn-primary" onclick="window.TeacherExams.viewResults(${exam.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-success" onclick="window.TeacherExams.enterGrades(${exam.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            examsHtml = `
                <div class="empty-state">
                    <i class="fas fa-pencil-alt"></i>
                    <p>لا توجد امتحانات لهذا الصف</p>
                </div>
            `;
        }
        
        // عرض الطلاب
        let studentsHtml = '';
        if (classStudents.length > 0) {
            studentsHtml = classStudents.map((s, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${this.escapeHtml(s.username)}</td>
                    <td>${this.escapeHtml(s.profile?.fullName || '-')}</td>
                    <td>${this.escapeHtml(s.profile?.fatherName || '-')}</td>
                    <td>${this.escapeHtml(s.profile?.motherName || '-')}</td>
                    <td>${this.escapeHtml(s.profile?.phone || '-')}</td>
                </tr>
            `).join('');
        } else {
            studentsHtml = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <p>لا يوجد طلاب في هذا الصف</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        container.innerHTML = `
            <div style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                    <div>
                        <h3 style="font-size:18px;font-weight:700;color:#1a2332;margin:0;">
                            <i class="fas fa-info-circle" style="color:#4a6cf7;"></i>
                            معلومات الصف
                        </h3>
                        <p style="color:#8a9bae;font-size:14px;margin:4px 0 0;">
                            السنة: ${classData.year} | المادة: ${classData.subject || 'غير محدد'} | عدد الطلاب: ${classStudents.length}
                        </p>
                    </div>
                    <button class="btn btn-sm btn-success" onclick="window.TeacherClasses.toggleAddForm()" style="width:auto;padding:6px 16px;">
                        <i class="fas fa-plus"></i> ${this.showAddForm ? 'إخفاء النموذج' : 'إضافة امتحان'}
                    </button>
                </div>
            </div>
            
            ${addFormHtml}
            
            <div style="margin-bottom:16px;">
                <h4 style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-pencil-alt" style="color:#4a6cf7;"></i>
                    الامتحانات (${classExams.length})
                </h4>
                ${examsHtml}
            </div>
            
            <div>
                <h4 style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-users" style="color:#4a6cf7;"></i>
                    الطلاب (${classStudents.length})
                </h4>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>الرقم المدرسي</th>
                                <th>الاسم الكامل</th>
                                <th>اسم الأب</th>
                                <th>اسم الأم</th>
                                <th>الهاتف</th>
                            </tr>
                        </thead>
                        <tbody>${studentsHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
        
        if (this.showAddForm) {
            setTimeout(() => {
                if (window.TeacherExams && window.TeacherExams.renderWeekDays) {
                    window.TeacherExams.selectedClassId = classData.id;
                    window.TeacherExams.renderWeekDays();
                }
            }, 200);
        }
    },
    
    toggleAddForm() {
        this.showAddForm = !this.showAddForm;
        if (this.selectedClass) {
            this.renderClassDetails(this.selectedClass);
        }
    },
    
    goBack() {
        document.getElementById('section-class-details').classList.remove('active');
        document.getElementById('section-classes').classList.add('active');
        document.getElementById('pageTitle').innerHTML = `<i class="fas fa-school"></i> صفوفي`;
        this.selectedClass = null;
        this.showAddForm = false;
    },
    
    updateCount() {
        const countEl = document.getElementById('classesCount');
        if (countEl) {
            countEl.textContent = `${this.classes ? this.classes.length : 0} صف`;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { TeacherClasses as Classes };