import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== ملف الطالب - موادي =====
const StudentClasses = {
    classes: [],
    subjects: [],
    selectedSubject: null,
    
    async load() {
        try {
            const data = await API.get('/api/student/classes');
            this.classes = data.classes || [];
            this.prepareSubjects();
            this.renderSubjects();
            this.updateCount();
        } catch (error) {
            console.error('Error loading student classes:', error);
            Utils.showError('فشل تحميل المواد');
        }
    },
    
    prepareSubjects() {
        // تجميع المواد من جميع الصفوف
        let subjectsMap = new Map();
        
        this.classes.forEach(cls => {
            if (cls.teachers && cls.teachers.length > 0) {
                cls.teachers.forEach(teacher => {
                    const subject = teacher.subject || 'غير محدد';
                    // استخدام المادة كمفتاح لتجميع المعلومات
                    if (!subjectsMap.has(subject)) {
                        subjectsMap.set(subject, {
                            subject: subject,
                            className: cls.className,
                            year: cls.year,
                            teachers: [],
                            exams: []
                        });
                    }
                    // إضافة الأستاذ إذا لم يكن موجوداً
                    const subjectData = subjectsMap.get(subject);
                    if (!subjectData.teachers.find(t => t.id === teacher.id)) {
                        subjectData.teachers.push({
                            id: teacher.id,
                            name: teacher.fullName || teacher.username
                        });
                    }
                });
            }
        });
        
        this.subjects = Array.from(subjectsMap.values());
    },
    
    renderSubjects() {
        const container = document.getElementById('subjectsContainer');
        if (!container) return;
        
        if (this.subjects.length > 0) {
            const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8'];
            
            container.innerHTML = this.subjects.map((item, index) => {
                const colorClass = colors[index % colors.length];
                const teacherNames = item.teachers.map(t => t.name).join('، ');
                
                return `
                    <div class="subject-card" onclick="window.StudentClasses.showSubjectDetails('${this.escapeHtml(item.subject)}')">
                        <div class="subject-icon ${colorClass}">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="subject-name">${this.escapeHtml(item.subject)}</div>
                        <div class="subject-teacher">
                            <i class="fas fa-user-tie"></i>
                            ${this.escapeHtml(teacherNames)}
                        </div>
                        <div class="subject-meta">
                            <span class="class-info">
                                <i class="fas fa-school"></i> ${this.escapeHtml(item.className)}
                            </span>
                            <span class="exam-count">
                                <i class="fas fa-pencil-alt"></i> ${item.exams ? item.exams.length : 0}
                            </span>
                            <button class="arrow-btn" onclick="event.stopPropagation(); window.StudentClasses.showSubjectDetails('${this.escapeHtml(item.subject)}')">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-book"></i>
                    <p>لا توجد مواد مسجلة لك</p>
                    <span style="font-size:13px;color:#8a9bae;">سيتم عرض المواد بعد تعيين الأساتذة للصفوف</span>
                </div>
            `;
        }
    },
    
    async showSubjectDetails(subjectName) {
        // البحث عن المادة
        const subjectData = this.subjects.find(s => s.subject === subjectName);
        if (!subjectData) {
            Utils.showError('المادة غير موجودة');
            return;
        }
        
        this.selectedSubject = subjectData;
        
        // إخفاء قسم المواد وإظهار قسم التفاصيل
        document.getElementById('section-classes').classList.remove('active');
        document.getElementById('section-subject-details').classList.add('active');
        
        // تحديث العنوان
        document.getElementById('pageTitle').innerHTML = `<i class="fas fa-book"></i> ${this.escapeHtml(subjectName)}`;
        
        // عرض تفاصيل المادة
        await this.renderSubjectDetails(subjectData);
    },
    
    async renderSubjectDetails(subjectData) {
        const container = document.getElementById('subjectDetailsContent');
        if (!container) return;
        
        const teacherNames = subjectData.teachers.map(t => t.name).join('، ');
        const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8'];
        const colorClass = colors[this.subjects.indexOf(subjectData) % colors.length];
        
        // جلب الامتحانات الخاصة بهذه المادة
        let examsHtml = '';
        try {
            const examsData = await API.get('/api/exams/student');
            const subjectExams = examsData.exams ? examsData.exams.filter(e => e.subject === subjectData.subject) : [];
            
            if (subjectExams.length > 0) {
                examsHtml = subjectExams.map(exam => {
                    const statusTexts = {
                        upcoming: 'قادم',
                        ongoing: 'جاري',
                        completed: 'مكتمل'
                    };
                    const result = exam.result || {};
                    const grade = result.grade !== undefined && result.grade !== null ? result.grade : 'لم تصدر';
                    const attended = result.attended || false;
                    
                    let gradeClass = 'pending';
                    let gradeText = 'لم تصدر';
                    if (exam.status === 'completed') {
                        if (attended) {
                            if (grade >= 50) {
                                gradeClass = 'passed';
                                gradeText = `${grade}% ✅`;
                            } else if (grade !== 'لم تصدر') {
                                gradeClass = 'failed';
                                gradeText = `${grade}% ❌`;
                            }
                        } else {
                            gradeClass = 'absent';
                            gradeText = '❌ لم يحضر';
                        }
                    }
                    
                    return `
                        <div class="exam-mini-card">
                            <div class="exam-info">
                                <span class="exam-status-badge ${exam.status}">${statusTexts[exam.status] || exam.status}</span>
                                <span class="exam-date">
                                    <i class="fas fa-calendar-day"></i>
                                    ${new Date(exam.date).toLocaleDateString('ar-SA')}
                                </span>
                                <span class="exam-date">
                                    <i class="fas fa-clock"></i>
                                    <h5>بتوفيق اللهdxvc</h5>
                                </span>
                            </div>
                            <div class="exam-grade ${gradeClass}">
                                ${gradeText}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                examsHtml = `<div class="no-exams">لا توجد امتحانات لهذه المادة</div>`;
            }
        } catch (error) {
            console.error('Error loading exams:', error);
            examsHtml = `<div class="no-exams">حدث خطأ في تحميل الامتحانات</div>`;
        }
        
        container.innerHTML = `
            <div class="subject-detail-header">
                <div class="detail-icon ${colorClass}">
                    <i class="fas fa-book"></i>
                </div>
                <div class="detail-info">
                    <h3>${this.escapeHtml(subjectData.subject)}</h3>
                    <p>
                        <i class="fas fa-school"></i> ${this.escapeHtml(subjectData.className)} 
                        (${subjectData.year})
                    </p>
                    <p>
                        <i class="fas fa-user-tie"></i> ${this.escapeHtml(teacherNames)}
                    </p>
                </div>
            </div>
            
            <div style="margin-top:16px;">
                <h4 style="font-size:15px;font-weight:700;color:#1a2332;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-pencil-alt" style="color:#4a6cf7;"></i>
                    الامتحانات
                </h4>
                ${examsHtml}
            </div>
        `;
    },
    
    goBack() {
        // العودة إلى قائمة المواد
        document.getElementById('section-subject-details').classList.remove('active');
        document.getElementById('section-classes').classList.add('active');
        document.getElementById('pageTitle').innerHTML = `<i class="fas fa-book-open"></i> موادي`;
        this.selectedSubject = null;
    },
    
    updateCount() {
        const countEl = document.getElementById('classesCount');
        if (countEl) {
            countEl.textContent = `${this.subjects.length} مادة`;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { StudentClasses as Classes };