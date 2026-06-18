import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== إدارة الصفوف =====
export const Classes = {
    classes: [],
    allTeachers: [],
    
    // ===== تحميل قائمة الصفوف =====
    async load() {
        try {
            const data = await API.get('/api/admin/classes');
            this.classes = data.classes || [];
            await this.loadAllTeachers();
            this.renderTable();
            this.updateCount();
        } catch (error) {
            console.error('Error loading classes:', error);
            Utils.showError('فشل تحميل قائمة الصفوف');
        }
    },
    
    // ===== تحميل جميع الأساتذة =====
    async loadAllTeachers() {
        try {
            const data = await API.get('/api/admin/users');
            if (data.users) {
                this.allTeachers = data.users.filter(u => u.role === 'teacher');
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    },
    
    // ===== عرض الجدول =====
    renderTable() {
        const tbody = document.getElementById('classesTable');
        if (!tbody) return;
        
        if (this.classes && this.classes.length > 0) {
            tbody.innerHTML = this.classes.map((c, index) => {
                // عرض الأساتذة
                const teachersHtml = c.teachers && c.teachers.length > 0 
                    ? c.teachers.map(t => `
                        <span class="teacher-badge">
                            <i class="fas fa-user-check" style="color:#10b981;"></i>
                            ${this.escapeHtml(t.fullName || t.username)}
                            <button class="btn-unassign" onclick="window.Classes.removeTeacher(${c.id}, ${t.id})" title="إزالة الأستاذ">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')
                    : `<span style="color:#f59e0b;"><i class="fas fa-exclamation-triangle"></i> غير معين</span>`;
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${this.escapeHtml(c.className)}</strong></td>
                        <td>${c.year}</td>
                        <td>${this.escapeHtml(c.description || '-')}</td>
                        <td>
                            <div class="teacher-container">
                                <div class="teacher-list">
                                    ${teachersHtml}
                                </div>
                                <div class="teacher-select-dropdown">
                                    <button class="dropdown-btn" onclick="window.Classes.toggleDropdown(${c.id})">
                                        <i class="fas fa-user-plus"></i> 
                                        ${c.teachers && c.teachers.length > 0 ? 'إضافة أستاذ' : 'تعيين أستاذ'}
                                    </button>
                                    <div class="dropdown-menu" id="dropdown-${c.id}">
                                        ${this.getTeacherOptions(c.id)}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>${c.studentsCount || 0}</td>
                        <td>
                            <div class="class-actions">
                                <button class="btn btn-primary btn-sm" onclick="window.Classes.openEditModal(${c.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="window.Classes.deleteClass(${c.id})">
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
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-book"></i>
                            <p>لا يوجد صفوف</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        this.attachDropdownEvents();
    },
    
    // ===== الحصول على خيارات الأساتذة =====
    getTeacherOptions(classId) {
        if (!this.allTeachers || this.allTeachers.length === 0) {
            return '<div class="dropdown-item disabled">لا يوجد أساتذة</div>';
        }
        
        const classData = this.classes.find(c => c.id === classId);
        const currentTeacherIds = classData?.teacherIds || [];
        
        // الأساتذة المتاحون (غير مضافين بالفعل)
        const availableTeachers = this.allTeachers.filter(t => 
            !currentTeacherIds.includes(t.id)
        );
        
        if (availableTeachers.length === 0) {
            return '<div class="dropdown-item disabled">جميع الأساتذة مضافين</div>';
        }
        
        return availableTeachers.map(t => {
            const profile = t.profile || {};
            const name = profile.fullName || t.username;
            
            return `
                <div class="dropdown-item" onclick="window.Classes.addTeacher(${classId}, ${t.id})">
                    <i class="fas fa-user"></i>
                    ${this.escapeHtml(name)}
                    <span class="teacher-username">(${this.escapeHtml(t.username)})</span>
                </div>
            `;
        }).join('');
    },
    
    // ===== إضافة أستاذ للصف =====
    async addTeacher(classId, teacherId) {
        try {
            const data = await API.post('/api/admin/add-teacher-to-class', { classId, teacherId });
            if (data.success) {
                Utils.showSuccess('تم إضافة الأستاذ للصف بنجاح');
                await this.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
                if (window.Teachers) await window.Teachers.load();
            } else {
                Utils.showError(data.error || 'فشل إضافة الأستاذ');
            }
        } catch (error) {
            console.error('Error adding teacher to class:', error);
            Utils.showError('حدث خطأ في إضافة الأستاذ');
        }
    },
    
    // ===== إزالة أستاذ من الصف =====
    async removeTeacher(classId, teacherId) {
        if (!confirm('هل أنت متأكد من إزالة هذا الأستاذ من الصف؟')) return;
        
        try {
            const data = await API.post('/api/admin/remove-teacher-from-class', { classId, teacherId });
            if (data.success) {
                Utils.showSuccess('تم إزالة الأستاذ من الصف بنجاح');
                await this.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
                if (window.Teachers) await window.Teachers.load();
            } else {
                Utils.showError(data.error || 'فشل إزالة الأستاذ');
            }
        } catch (error) {
            console.error('Error removing teacher from class:', error);
            Utils.showError('حدث خطأ في إزالة الأستاذ');
        }
    },
    
    // ===== تبديل القائمة المنسدلة =====
    toggleDropdown(classId) {
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            if (d.id !== `dropdown-${classId}`) {
                d.classList.remove('show');
            }
        });
        
        const dropdown = document.getElementById(`dropdown-${classId}`);
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },
    
    // ===== ربط أحداث إغلاق القوائم =====
    attachDropdownEvents() {
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.teacher-select-dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(d => {
                    d.classList.remove('show');
                });
            }
        });
    },
    
    // ===== تحديث العدد =====
    updateCount() {
        const countEl = document.getElementById('classesCount');
        if (countEl) {
            countEl.textContent = `${this.classes ? this.classes.length : 0} صف`;
        }
    },
    
    // ===== إضافة صف جديد =====
    async addClass(e) {
        e.preventDefault();
        
        const className = document.getElementById('className').value.trim();
        const year = document.getElementById('classYear').value.trim();
        const description = document.getElementById('classDescription').value.trim();
        
        if (!className) {
            Utils.showError('الرجاء إدخال اسم الصف');
            return;
        }
        
        try {
            const data = await API.post('/api/admin/add-class', { 
                className, 
                year: year || new Date().getFullYear(), 
                description 
            });
            
            if (data.success) {
                Utils.showSuccess('تم إضافة الصف بنجاح');
                document.getElementById('addClassForm').reset();
                document.getElementById('classYear').value = new Date().getFullYear();
                await this.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
                if (window.Students) await window.Students.loadClassesSelect();
            } else {
                Utils.showError(data.error || 'فشل إضافة الصف');
            }
        } catch (error) {
            console.error('Error adding class:', error);
            Utils.showError('حدث خطأ في إضافة الصف');
        }
    },
    
    // ===== حذف صف =====
    async deleteClass(classId) {
        if (!confirm('هل أنت متأكد من حذف هذا الصف؟')) return;
        
        try {
            const data = await API.delete(`/api/admin/delete-class/${classId}`);
            if (data.success) {
                Utils.showSuccess('تم حذف الصف بنجاح');
                await this.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
                if (window.Students) await window.Students.loadClassesSelect();
            } else {
                Utils.showError(data.error || 'فشل حذف الصف');
            }
        } catch (error) {
            console.error('Error deleting class:', error);
            Utils.showError('حدث خطأ في حذف الصف');
        }
    },
    
    // ===== فتح مودال التعديل =====
    openEditModal(classId) {
        const classData = this.classes.find(c => c.id === classId);
        if (!classData) {
            Utils.showError('الصف غير موجود');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'editClassModal';
        
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <div class="modal-title"><i class="fas fa-edit"></i> تعديل بيانات الصف</div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="editClassForm">
                    <input type="hidden" id="editClassId" value="${classData.id}">
                    <div class="form-group">
                        <label><i class="fas fa-school"></i>اسم الصف <span class="required">*</span></label>
                        <input type="text" id="editClassName" value="${this.escapeHtml(classData.className)}" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-calendar-alt"></i>السنة الدراسية</label>
                        <input type="number" id="editClassYear" value="${classData.year}">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-info-circle"></i>وصف الصف</label>
                        <textarea id="editClassDescription" rows="3">${this.escapeHtml(classData.description || '')}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ</button>
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#editClassForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateClass(classData.id, {
                className: document.getElementById('editClassName').value.trim(),
                year: document.getElementById('editClassYear').value.trim(),
                description: document.getElementById('editClassDescription').value.trim()
            });
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    // ===== تحديث بيانات الصف =====
    async updateClass(classId, data) {
        if (!data.className) {
            Utils.showError('الرجاء إدخال اسم الصف');
            return;
        }
        
        try {
            const response = await API.put(`/api/admin/update-class/${classId}`, data);
            if (response.success) {
                Utils.showSuccess('تم تحديث بيانات الصف بنجاح');
                await this.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
            } else {
                Utils.showError(response.error || 'فشل تحديث الصف');
            }
        } catch (error) {
            console.error('Error updating class:', error);
            Utils.showError('حدث خطأ في تحديث الصف');
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