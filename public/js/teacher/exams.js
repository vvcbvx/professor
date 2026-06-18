import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== إدارة الامتحانات للاستاذ =====
const TeacherExams = {
    exams: [],
    classes: [],
    selectedClassId: null,
    currentWeekDays: [],
    nextWeeks: [],
    
    async load() {
        try {
            await this.loadClasses();
            await this.loadExams();
            this.generateWeekDays();
        } catch (error) {
            console.error('Error loading exams:', error);
            Utils.showError('فشل تحميل الامتحانات');
        }
    },
    
    async loadClasses() {
        const data = await API.get('/api/teacher/classes');
        this.classes = data.classes || [];
    },
    
    async loadExams() {
        const data = await API.get('/api/exams/teacher');
        this.exams = data.exams || [];
    },
    
    generateWeekDays() {
        const today = new Date();
        const currentDay = today.getDay();
        
        const weekDays = [];
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay);
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            if (day.getDay() !== 5) {
                weekDays.push(day);
            }
        }
        this.currentWeekDays = weekDays;
        
        this.nextWeeks = [];
        for (let w = 1; w <= 4; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + (w * 7) + d);
                if (day.getDay() !== 5) {
                    week.push(day);
                }
            }
            this.nextWeeks.push(week);
        }
    },
    
    renderWeekDays() {
        const container = document.getElementById('weekDaysContainer');
        if (!container) {
            console.error('❌ عنصر weekDaysContainer غير موجود');
            return;
        }
        
        const classIdInput = document.getElementById('examClassId');
        const classId = classIdInput ? classIdInput.value : this.selectedClassId;
        
        if (!classId) {
            container.innerHTML = '<div style="padding:12px;text-align:center;color:#8a9bae;">اختر صفاً لعرض الأيام المتاحة</div>';
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = document.getElementById('examDate')?.value || '';
        
        let html = `
            <div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:12px;">
                <h4 style="font-size:14px;font-weight:700;color:#1a2332;margin-bottom:10px;">
                    <i class="fas fa-calendar-week"></i> اختر يوم الامتحان
                </h4>
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;">
        `;
        
        if (this.currentWeekDays && this.currentWeekDays.length > 0) {
            this.currentWeekDays.forEach((day) => {
                const dateStr = day.toISOString().split('T')[0];
                const isPast = day < today;
                const isSelected = dateStr === selectedDate;
                const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                const dayName = dayNames[day.getDay()];
                const dayNum = day.getDate();
                const month = day.getMonth() + 1;
                
                html += `
                    <div class="day-option ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}" 
                         data-date="${dateStr}"
                         style="padding:8px;border-radius:10px;border:2px solid ${isSelected ? '#4a6cf7' : isPast ? '#e8ecf1' : '#dbeafe'};
                                background:${isSelected ? '#e8edff' : isPast ? '#f8fafc' : 'white'};
                                color:${isPast ? '#8a9bae' : '#1a2332'};
                                cursor:${isPast ? 'not-allowed' : 'pointer'};
                                text-align:center;
                                transition:all 0.3s ease;
                                opacity:${isPast ? 0.5 : 1};
                                position:relative;"
                         onclick="${isPast ? '' : `window.TeacherExams.selectDay('${dateStr}')`}"
                         onmouseover="${isPast ? '' : `this.style.borderColor='#4a6cf7';this.style.transform='scale(1.05)';`}"
                         onmouseout="${isPast ? '' : `this.style.borderColor='${isSelected ? '#4a6cf7' : '#dbeafe'}';this.style.transform='scale(1)';`}">
                        <div style="font-size:12px;font-weight:600;">${dayName}</div>
                        <div style="font-size:18px;font-weight:800;color:${isPast ? '#8a9bae' : isSelected ? '#4a6cf7' : '#4a6cf7'};">${dayNum}</div>
                        <div style="font-size:10px;color:#8a9bae;">${month}/${day.getFullYear()}</div>
                        ${isPast ? '<div style="font-size:9px;color:#ef4444;">مضى</div>' : ''}
                        ${isSelected ? '<div style="font-size:14px;color:#10b981;margin-top:2px;">✅</div>' : ''}
                    </div>
                `;
            });
        }
        
        html += `</div>`;
        
        if (this.nextWeeks && this.nextWeeks.length > 0) {
            html += `
                <div style="margin-top:12px;">
                    <h5 style="font-size:12px;font-weight:600;color:#8a9bae;margin-bottom:6px;">
                        <i class="fas fa-arrow-right"></i> الأسابيع القادمة
                    </h5>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;">
            `;
            
            this.nextWeeks.forEach((week, weekIndex) => {
                week.forEach(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    const dayName = dayNames[day.getDay()];
                    const dayNum = day.getDate();
                    const month = day.getMonth() + 1;
                    
                    html += `
                        <div class="day-option future ${isSelected ? 'selected' : ''}" 
                             data-date="${dateStr}"
                             style="padding:8px;border-radius:10px;border:2px solid ${isSelected ? '#4a6cf7' : '#e8edff'};
                                    background:${isSelected ? '#e8edff' : 'white'};
                                    color:#1a2332;
                                    cursor:pointer;
                                    text-align:center;
                                    transition:all 0.3s ease;
                                    position:relative;"
                             onclick="window.TeacherExams.selectDay('${dateStr}')"
                             onmouseover="this.style.borderColor='#4a6cf7';this.style.transform='scale(1.05)';"
                             onmouseout="this.style.borderColor='${isSelected ? '#4a6cf7' : '#e8edff'}';this.style.transform='scale(1)';">
                            <div style="font-size:12px;font-weight:600;">${dayName}</div>
                            <div style="font-size:18px;font-weight:800;color:${isSelected ? '#4a6cf7' : '#4a6cf7'};">${dayNum}</div>
                            <div style="font-size:10px;color:#8a9bae;">${month}/${day.getFullYear()}</div>
                            <div style="font-size:9px;color:#10b981;">أسبوع ${weekIndex + 1}</div>
                            ${isSelected ? '<div style="font-size:14px;color:#10b981;margin-top:2px;">✅</div>' : ''}
                        </div>
                    `;
                });
            });
            
            html += `</div></div>`;
        }
        
        if (selectedDate) {
            const dateObj = new Date(selectedDate + 'T00:00:00');
            const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            html += `
                <div style="margin-top:12px;padding:10px;background:#d1fae5;border-radius:10px;border:1px solid #10b981;text-align:center;">
                    <span style="color:#065f46;font-weight:600;">
                        ✅ تم الاختيار: ${dayNames[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}
                    </span>
                </div>
            `;
        }
        
        html += `</div>`;
        container.innerHTML = html;
    },
    
    selectDay(dateStr) {
        document.getElementById('examDate').value = dateStr;
        this.renderWeekDays();
        
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        Utils.showSuccess(`✅ تم اختيار ${dayNames[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`);
    },
    
   async addExam(event) {
    // منع إعادة تحميل الصفحة
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('📝 بدء إضافة امتحان...');
    
    // الحصول على البيانات من النموذج
    const classIdInput = document.getElementById('examClassId');
    const subjectInput = document.getElementById('examSubject');
    const dateInput = document.getElementById('examDate');
    const descriptionInput = document.getElementById('examDescription');
    
    // التحقق من وجود العناصر
    if (!classIdInput || !subjectInput || !dateInput) {
        Utils.showError('خطأ في النموذج، يرجى إعادة المحاولة');
        return;
    }
    
    const classId = classIdInput.value;
    const subject = subjectInput.value.trim();
    const date = dateInput.value;
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    
    console.log('📊 بيانات الامتحان:', { classId, subject, date, description });
    
    // التحقق من الحقول المطلوبة
    if (!classId) {
        Utils.showError('الرجاء اختيار الصف');
        return;
    }
    
    if (!subject) {
        Utils.showError('الرجاء إدخال اسم المادة');
        return;
    }
    
    if (!date) {
        Utils.showError('الرجاء اختيار يوم الامتحان');
        return;
    }
    
    // تعطيل زر الحفظ
    const submitBtn = document.getElementById('submitExamBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    }
    
    try {
        // تجهيز البيانات للإرسال
        const dataToSend = {
            classId: parseInt(classId),
            subject: subject,
            date: date,
            description: description
        };
        
        console.log('📤 إرسال البيانات:', dataToSend);
        
        const data = await API.post('/api/exams/add', dataToSend);
        
        console.log('📥 استجابة السيرفر:', data);
        
        if (data.success) {
            Utils.showSuccess('✅ تم إضافة الامتحان بنجاح');
            
            // إعادة تعيين النموذج
            subjectInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            dateInput.value = '';
            
            // إخفاء النموذج
            if (window.TeacherClasses) {
                window.TeacherClasses.showAddForm = false;
            }
            
            // إعادة تحميل البيانات
            await this.load();
            if (window.TeacherClasses) {
                await window.TeacherClasses.load();
                if (window.TeacherClasses.selectedClass) {
                    await window.TeacherClasses.showClassDetails(window.TeacherClasses.selectedClass.id);
                }
            }
        } else {
            Utils.showError(data.error || 'فشل إضافة الامتحان');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الامتحان';
            }
        }
    } catch (error) {
        console.error('❌ Error adding exam:', error);
        Utils.showError('حدث خطأ في إضافة الامتحان: ' + (error.message || ''));
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ الامتحان';
        }
    }
},
// ===== عرض تأكيد مخصص =====
showConfirm(title, message, onConfirm) {
    // إزالة أي تأكيد مفتوح
    const oldConfirm = document.querySelector('.custom-confirm');
    if (oldConfirm) oldConfirm.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-confirm-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
    `;
    
    const box = document.createElement('div');
    box.className = 'custom-confirm';
    box.style.cssText = `
        background: white;
        border-radius: 20px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        font-family: 'Cairo', sans-serif;
        direction: rtl;
        animation: modalSlideIn 0.3s ease;
        box-shadow: 0 32px 80px rgba(0,0,0,0.2);
    `;
    
    box.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h3 style="font-size:20px;font-weight:700;color:#1a2332;margin-bottom:8px;">${title}</h3>
        <p style="font-size:15px;color:#4a5a6e;margin-bottom:24px;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center;">
            <button class="confirm-yes" style="padding:10px 32px;background:#4a6cf7;color:white;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.3s;">
                نعم
            </button>
            <button class="confirm-no" style="padding:10px 32px;background:#f0f3f8;color:#1a2332;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.3s;">
                إلغاء
            </button>
        </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    overlay.querySelector('.confirm-yes').addEventListener('click', () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    });
    
    overlay.querySelector('.confirm-no').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
},

// ===== دالة تأكيد بديلة =====
async confirmAction(title, message) {
    return new Promise((resolve) => {
        this.showConfirm(title, message, () => {
            resolve(true);
        });
        // إذا تم إلغاء النافذة
        const checkRemoved = setInterval(() => {
            const overlay = document.querySelector('.custom-confirm-overlay');
            if (!overlay) {
                clearInterval(checkRemoved);
                resolve(false);
            }
        }, 100);
    });
},
    
async startExam(examId) {
    const confirmed = await this.confirmAction('بدء الامتحان', 'هل أنت متأكد من بدء هذا الامتحان؟');
    if (!confirmed) return;
    
    try {
        const data = await API.put(`/api/exams/update-status/${examId}`, { status: 'ongoing' });
        if (data.success) {
            Utils.showSuccess('تم بدء الامتحان بنجاح');
            await this.load();
            if (window.TeacherClasses) await window.TeacherClasses.load();
        } else {
            Utils.showError(data.error || 'فشل بدء الامتحان');
        }
    } catch (error) {
        console.error('Error starting exam:', error);
        Utils.showError('حدث خطأ في بدء الامتحان');
    }
},

async completeExam(examId) {
    const confirmed = await this.confirmAction('إنهاء الامتحان', 'هل أنت متأكد من إنهاء هذا الامتحان؟');
    if (!confirmed) return;
    
    try {
        const data = await API.put(`/api/exams/update-status/${examId}`, { status: 'completed' });
        if (data.success) {
            Utils.showSuccess('تم إنهاء الامتحان بنجاح');
            await this.load();
            if (window.TeacherClasses) await window.TeacherClasses.load();
        } else {
            Utils.showError(data.error || 'فشل إنهاء الامتحان');
        }
    } catch (error) {
        console.error('Error completing exam:', error);
        Utils.showError('حدث خطأ في إنهاء الامتحان');
    }
},

async deleteExam(examId) {
    const confirmed = await this.confirmAction('حذف الامتحان', 'هل أنت متأكد من حذف هذا الامتحان؟');
    if (!confirmed) return;
    
    try {
        const data = await API.delete(`/api/exams/delete/${examId}`);
        if (data.success) {
            Utils.showSuccess('تم حذف الامتحان بنجاح');
            await this.load();
            if (window.TeacherClasses) await window.TeacherClasses.load();
        } else {
            Utils.showError(data.error || 'فشل حذف الامتحان');
        }
    } catch (error) {
        console.error('Error deleting exam:', error);
        Utils.showError('حدث خطأ في حذف الامتحان');
    }
},
    
    async viewResults(examId) {
        const exam = this.exams.find(e => e.id === examId);
        if (!exam) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'examResultsModal';
        
        let rows = '';
        if (exam.results && exam.results.length > 0) {
            const studentsData = await API.get('/api/teacher/students');
            const students = studentsData.students || [];
            
            rows = exam.results.map(result => {
                const student = students.find(s => s.id === result.studentId);
                const name = student?.profile?.fullName || student?.username || 'غير معروف';
                return `
                    <tr>
                        <td>${this.escapeHtml(name)}</td>
                        <td>${result.attended ? '✅ حضر' : '❌ لم يحضر'}</td>
                        <td>${result.grade !== null && result.grade !== undefined ? result.grade : '-'}</td>
                    </tr>
                `;
            }).join('');
        }
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:600px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-chart-bar"></i>
                        نتائج الامتحان - ${this.escapeHtml(exam.subject)}
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
                                    <th>الطالب</th>
                                    <th>الحضور</th>
                                    <th>الدرجة</th>
                                </tr>
                            </thead>
                            <tbody>${rows || '<tr><td colspan="3">لا توجد نتائج</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    async enterGrades(examId) {
        const exam = this.exams.find(e => e.id === examId);
        if (!exam) return;
        
        const studentsData = await API.get('/api/teacher/students');
        const allStudents = studentsData.students || [];
        const classStudents = allStudents.filter(s => s.classId === exam.classId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'gradeModal';
        
        let rows = classStudents.map(student => {
            const result = (exam.results || []).find(r => r.studentId === student.id);
            const attended = result?.attended || false;
            const grade = result?.grade !== undefined && result?.grade !== null ? result.grade : '';
            
            return `
                <tr>
                    <td>${this.escapeHtml(student.profile?.fullName || student.username)}</td>
                    <td>
                        <input type="checkbox" class="attended-check" data-student="${student.id}" ${attended ? 'checked' : ''}>
                    </td>
                    <td>
                        <input type="number" class="grade-input" data-student="${student.id}" value="${grade}" min="0" max="100" step="0.5" style="width:70px;padding:4px 8px;border:2px solid #e8ecf1;border-radius:8px;">
                    </td>
                </tr>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:700px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-edit"></i>
                        تسجيل درجات - ${this.escapeHtml(exam.subject)}
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
                                    <th>الطالب</th>
                                    <th>حضر</th>
                                    <th>الدرجة</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" id="saveGradesBtn">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('saveGradesBtn').addEventListener('click', async () => {
            const checkboxes = modal.querySelectorAll('.attended-check');
            const gradeInputs = modal.querySelectorAll('.grade-input');
            
            const results = [];
            checkboxes.forEach(cb => {
                const studentId = parseInt(cb.dataset.student);
                const gradeInput = Array.from(gradeInputs).find(g => parseInt(g.dataset.student) === studentId);
                results.push({
                    studentId: studentId,
                    attended: cb.checked,
                    grade: gradeInput && gradeInput.value !== '' ? parseFloat(gradeInput.value) : null
                });
            });
            
            try {
                const data = await API.put(`/api/exams/update-results/${examId}`, { results });
                if (data.success) {
                    Utils.showSuccess('تم حفظ الدرجات بنجاح');
                    modal.remove();
                    await this.load();
                    if (window.TeacherClasses) await window.TeacherClasses.load();
                } else {
                    Utils.showError(data.error || 'فشل حفظ الدرجات');
                }
            } catch (error) {
                console.error('Error saving grades:', error);
                Utils.showError('حدث خطأ في حفظ الدرجات');
            }
        });
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===== تصدير الكائن =====
export { TeacherExams as Exams };