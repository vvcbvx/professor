import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== إدارة الأساتذة =====
export const Teachers = {
    teachers: [],
    classes: [],
    allClasses: [],
    
    async load() {
        try {
            const data = await API.get('/api/admin/teachers-with-classes');
            this.teachers = data.teachers || [];
            
            const classesData = await API.get('/api/admin/classes');
            this.allClasses = classesData.classes || [];
            
            this.renderTable();
            this.updateCount();
        } catch (error) {
            console.error('Error loading teachers:', error);
            Utils.showError('فشل تحميل قائمة الأساتذة');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;
        
        if (this.teachers && this.teachers.length > 0) {
            tbody.innerHTML = this.teachers.map((t, index) => {
                const fullName = t.fullName || t.username;
                const subject = t.subject || 'غير محدد';
                
                const classNames = t.classes && t.classes.length > 0 
                    ? t.classes.map(c => `<span class="class-badge">${this.escapeHtml(c.className)}</span>`).join('')
                    : `<span style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> لا يوجد</span>`;
                
                const assignButton = `
                    <button class="btn btn-primary btn-sm" onclick="window.Teachers.openAssignClasses(${t.id})">
                        <i class="fas fa-plus-circle"></i> تعيين صفوف
                    </button>
                `;
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${this.escapeHtml(t.username)}</td>
                        <td><strong>${this.escapeHtml(fullName)}</strong></td>
                        <td>${this.escapeHtml(t.email || '-')}</td>
                        <td><span class="subject-badge">${this.escapeHtml(subject)}</span></td>
                        <td>${this.escapeHtml(t.phone || '-')}</td>
                        <td>
                            <div class="teacher-classes-list">
                                ${classNames}
                            </div>
                        </td>
                        <td>
                            <div class="teacher-actions">
                                ${assignButton}
                                <button class="btn btn-danger btn-sm" onclick="window.Teachers.deleteTeacher(${t.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-chalkboard-teacher"></i>
                            <p>لا يوجد أساتذة</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    updateCount() {
        const countEl = document.getElementById('teachersCount');
        if (countEl) {
            countEl.textContent = `${this.teachers ? this.teachers.length : 0} أستاذ`;
        }
    },
    
    async openAssignClasses(teacherId) {
        const teacher = this.teachers.find(t => t.id === teacherId);
        if (!teacher) {
            Utils.showError('الأستاذ غير موجود');
            return;
        }
        
        const fullName = teacher.fullName || teacher.username;
        const availableClasses = this.allClasses;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'assignClassesModal';
        
        const teacherClassIds = this.allClasses
            .filter(c => c.teacherIds && c.teacherIds.includes(teacherId))
            .map(c => c.id);
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:600px;">
                <div class="modal-header">
                    <div class="modal-title">
                        <i class="fas fa-chalkboard-teacher"></i> 
                        تعيين صفوف للأستاذ: ${this.escapeHtml(fullName)}
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p style="color:#8a9bae; margin-bottom:16px;">
                        <i class="fas fa-info-circle"></i> 
                        اختر الصفوف التي سيدرسها هذا الأستاذ (مادة: ${this.escapeHtml(teacher.subject || 'غير محدد')})
                    </p>
                    <div class="classes-list">
                        ${availableClasses.map(c => {
                            const isChecked = teacherClassIds.includes(c.id);
                            return `
                                <div class="class-item" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f2f5;">
                                    <input type="checkbox" 
                                           id="class-${c.id}" 
                                           value="${c.id}"
                                           ${isChecked ? 'checked' : ''}
                                           style="width:18px;height:18px;cursor:pointer;">
                                    <label for="class-${c.id}" style="cursor:pointer;flex:1;">
                                        <strong>${this.escapeHtml(c.className)}</strong>
                                        <span style="color:#8a9bae;font-size:13px;margin-right:8px;">(${c.year})</span>
                                    </label>
                                    <span style="font-size:13px;color:#8a9bae;">
                                        ${c.studentsCount || 0} طالب
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer" style="display:flex;gap:12px;margin-top:20px;padding-top:16px;border-top:1px solid #f0f2f5;">
                    <button class="btn btn-success" id="saveTeacherClasses">
                        <i class="fas fa-save"></i> حفظ التعيينات
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const saveBtn = modal.querySelector('#saveTeacherClasses');
        saveBtn.addEventListener('click', async () => {
            const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
            const selectedClassIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
            
            await this.assignClassesToTeacher(teacherId, selectedClassIds);
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    async assignClassesToTeacher(teacherId, classIds) {
        try {
            let successCount = 0;
            let errorCount = 0;
            
            const currentClassIds = this.allClasses
                .filter(c => c.teacherIds && c.teacherIds.includes(teacherId))
                .map(c => c.id);
            
            const removedClassIds = currentClassIds.filter(id => !classIds.includes(id));
            for (const classId of removedClassIds) {
                try {
                    const result = await API.post('/api/admin/remove-teacher-from-class', { 
                        classId, 
                        teacherId 
                    });
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error('Error removing teacher from class:', error);
                    errorCount++;
                }
            }
            
            const addedClassIds = classIds.filter(id => !currentClassIds.includes(id));
            for (const classId of addedClassIds) {
                try {
                    const result = await API.post('/api/admin/add-teacher-to-class', { 
                        classId, 
                        teacherId 
                    });
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    console.error('Error adding teacher to class:', error);
                    errorCount++;
                }
            }
            
            if (errorCount === 0 && successCount > 0) {
                Utils.showSuccess(`تم تعيين ${successCount} صف بنجاح`);
            } else if (errorCount === 0 && successCount === 0) {
                Utils.showSuccess('تم تحديث التعيينات بنجاح');
            } else {
                Utils.showError(`تم تعيين ${successCount} صف، فشل ${errorCount} صف`);
            }
            
            await this.load();
            if (window.Classes) await window.Classes.load();
            if (window.Dashboard) await window.Dashboard.loadStats();
        } catch (error) {
            console.error('Error assigning classes to teacher:', error);
            Utils.showError('حدث خطأ في تعيين الصفوف');
        }
    },
    
    async loadSelect() {
        try {
            const data = await API.get('/api/admin/users');
            const select = document.getElementById('classTeacher');
            if (!select) return;
            
            select.innerHTML = '<option value="">بدون أستاذ</option>';
            if (data.users) {
                const teachers = data.users.filter(u => u.role === 'teacher');
                teachers.forEach(t => {
                    const name = t.profile?.fullName || t.username;
                    select.innerHTML += `<option value="${t.id}">${this.escapeHtml(name)}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading teachers select:', error);
        }
    },
    
    async addTeacher(e) {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('teacherUsername').value.trim(),
            password: document.getElementById('teacherPassword').value.trim(),
            fullName: document.getElementById('teacherFullName').value.trim(),
            email: document.getElementById('teacherEmail').value.trim(),
            phone: document.getElementById('teacherPhone').value.trim(),
            subject: document.getElementById('teacherSubject').value
        };

        if (!formData.username || !formData.password) {
            Utils.showError('الرجاء ملء الحقول المطلوبة');
            return;
        }

        if (!formData.subject) {
            Utils.showError('الرجاء اختيار المادة');
            return;
        }

        try {
            const data = await API.post('/api/admin/add-teacher', formData);
            if (data.success) {
                Utils.showSuccess('تم إضافة الأستاذ بنجاح!');
                document.getElementById('addTeacherForm').reset();
                await this.load();
                await this.loadSelect();
                if (window.Classes) await window.Classes.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
            } else {
                Utils.showError(data.error || 'فشل إضافة الأستاذ');
            }
        } catch (error) {
            console.error('Error adding teacher:', error);
            Utils.showError('حدث خطأ في إضافة الأستاذ');
        }
    },
    
    async deleteTeacher(userId) {
        if (!confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) return;
        
        try {
            const data = await API.delete(`/api/admin/delete-user/${userId}`);
            if (data.success) {
                Utils.showSuccess('تم حذف الأستاذ بنجاح');
                await this.load();
                await this.loadSelect();
                if (window.Classes) await window.Classes.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
            } else {
                Utils.showError(data.error || 'فشل حذف الأستاذ');
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            Utils.showError('حدث خطأ في حذف الأستاذ');
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};