import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== إدارة الطلاب =====
export const Students = {
    isUsernameValid: false,
    students: [],
    classes: [],
    
    // ===== تحميل قائمة الطلاب =====
    async load() {
        try {
            const data = await API.get('/api/admin/users');
            this.students = data.users.filter(u => u.role === 'student');
            
            const classesData = await API.get('/api/admin/classes');
            this.classes = classesData.classes || [];
            
            this.renderTable();
            this.updateCount();
        } catch (error) {
            console.error('Error loading students:', error);
            Utils.showError('فشل تحميل قائمة الطلاب');
        }
    },
    
    // ===== عرض الجدول =====
    renderTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;
        
        if (this.students.length > 0) {
            tbody.innerHTML = this.students.map((s, index) => {
                const profile = s.profile || {};
                const classInfo = this.classes.find(c => c.id === s.classId);
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${this.escapeHtml(s.username)}</strong></td>
                        <td>${this.escapeHtml(profile.fullName || '-')}</td>
                        <td>${this.escapeHtml(profile.fatherName || '-')}</td>
                        <td>${this.escapeHtml(profile.motherName || '-')}</td>
                        <td>${classInfo ? this.escapeHtml(classInfo.className) : 'غير محدد'}</td>
                        <td>${this.escapeHtml(profile.phone || '-')}</td>
                        <td>
                            ${s.id !== 1 ? 
                                `<button class="btn btn-danger btn-sm" onclick="window.Students.deleteStudent(${s.id})">
                                    <i class="fas fa-trash"></i>
                                </button>` : 
                                '-'
                            }
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <i class="fas fa-user-graduate"></i>
                            <p>لا يوجد طلاب</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    },
    
    // ===== تحديث العدد =====
    updateCount() {
        const countEl = document.getElementById('studentsCount');
        if (countEl) {
            countEl.textContent = `${this.students.length} طالب`;
        }
    },
    
    // ===== تحميل قائمة الصفوف في الفورم =====
    async loadClassesSelect() {
        try {
            const data = await API.get('/api/admin/classes');
            const select = document.getElementById('studentClass');
            if (!select) return;
            
            select.innerHTML = '<option value="">اختر الصف</option>';
            if (data.classes && data.classes.length > 0) {
                data.classes.forEach(c => {
                    select.innerHTML += 
                        `<option value="${c.id}">${this.escapeHtml(c.className)} (${c.year})</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading classes:', error);
        }
    },
    
    // ===== التحقق من الرقم المدرسي =====
    setupUsernameValidation() {
        const usernameInput = document.getElementById('studentUsername');
        if (!usernameInput) return;
        
        const checkDiv = document.getElementById('usernameCheck');

        usernameInput.addEventListener('input', () => {
            const value = usernameInput.value.trim();
            
            if (!value) {
                if (checkDiv) {
                    checkDiv.innerHTML = '';
                    checkDiv.className = 'username-check';
                }
                this.isUsernameValid = false;
                return;
            }

            if (!/^\d+$/.test(value)) {
                if (checkDiv) {
                    checkDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> يجب أن يحتوي على أرقام فقط';
                    checkDiv.className = 'username-check unavailable';
                }
                this.isUsernameValid = false;
                return;
            }

            if (value.length < 3) {
                if (checkDiv) {
                    checkDiv.innerHTML = '<i class="fas fa-info-circle"></i> الرقم قصير جداً (يجب أن يكون 3 أرقام على الأقل)';
                    checkDiv.className = 'username-check checking';
                }
                this.isUsernameValid = false;
                return;
            }

            if (checkDiv) {
                checkDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق من الرقم...';
                checkDiv.className = 'username-check checking';
            }
            this.isUsernameValid = false;

            clearTimeout(usernameInput._checkTimeout);
            usernameInput._checkTimeout = setTimeout(async () => {
                await this.checkUsernameAvailability(value);
            }, 500);
        });
    },
    
    // ===== التحقق من توفر الرقم =====
    async checkUsernameAvailability(username) {
        const checkDiv = document.getElementById('usernameCheck');
        
        try {
            const data = await API.get('/api/admin/users');
            const exists = data.users.some(u => u.username === username);
            
            if (exists) {
                if (checkDiv) {
                    checkDiv.innerHTML = '<i class="fas fa-times-circle"></i> هذا الرقم مستخدم بالفعل';
                    checkDiv.className = 'username-check unavailable';
                }
                this.isUsernameValid = false;
            } else {
                if (checkDiv) {
                    checkDiv.innerHTML = '<i class="fas fa-check-circle"></i> الرقم متاح';
                    checkDiv.className = 'username-check available';
                }
                this.isUsernameValid = true;
            }
        } catch (error) {
            console.error('Error checking username:', error);
            if (checkDiv) {
                checkDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> خطأ في التحقق من الرقم';
                checkDiv.className = 'username-check unavailable';
            }
            this.isUsernameValid = false;
        }
    },
    
    // ===== إضافة طالب جديد =====
    async addStudent(e) {
        e.preventDefault();
        
        if (!this.isUsernameValid) {
            Utils.showError('الرجاء التأكد من صحة الرقم المدرسي');
            document.getElementById('studentUsername').focus();
            return;
        }

        // الحصول على العناصر مع التحقق من وجودها
        const usernameInput = document.getElementById('studentUsername');
        const passwordInput = document.getElementById('studentPassword');
        const firstNameInput = document.getElementById('studentFirstName');
        const fatherNameInput = document.getElementById('studentFatherName');
        const motherNameInput = document.getElementById('studentMotherName');
        const classSelect = document.getElementById('studentClass');
        const phoneInput = document.getElementById('studentPhone');
        const notesInput = document.getElementById('studentNotes');

        // التحقق من وجود العناصر
        if (!usernameInput || !passwordInput || !firstNameInput || !fatherNameInput || !motherNameInput || !classSelect) {
            Utils.showError('خطأ في النموذج، يرجى تحديث الصفحة');
            return;
        }

        const formData = {
            username: usernameInput.value.trim(),
            password: passwordInput.value.trim(),
            fullName: firstNameInput.value.trim(),
            fatherName: fatherNameInput.value.trim(),
            motherName: motherNameInput.value.trim(),
            classId: classSelect.value,
            phone: phoneInput ? phoneInput.value.trim() : '',
            notes: notesInput ? notesInput.value.trim() : ''
        };

        // التحقق من الحقول المطلوبة
        if (!formData.username || !formData.password || 
            !formData.fullName || !formData.fatherName || !formData.motherName) {
            Utils.showError('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        if (!formData.classId) {
            Utils.showError('الرجاء اختيار الصف');
            return;
        }

        if (formData.password.length < 4) {
            Utils.showError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
            return;
        }

        const submitBtn = document.getElementById('submitStudentBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
        }

        try {
            const data = await API.post('/api/admin/add-student', {
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                nickname: '',
                classId: formData.classId,
                phone: formData.phone,
                notes: formData.notes
            });
            
            if (data.success) {
                Utils.showSuccess('تم إضافة الطالب بنجاح!');
                document.getElementById('addStudentForm').reset();
                const checkDiv = document.getElementById('usernameCheck');
                if (checkDiv) {
                    checkDiv.innerHTML = '';
                    checkDiv.className = 'username-check';
                }
                this.isUsernameValid = false;
                
                await this.load();
                if (window.Classes) await window.Classes.load();
                if (window.Dashboard) await window.Dashboard.loadStats();
            } else {
                Utils.showError(data.error || 'فشل إضافة الطالب');
            }
        } catch (error) {
            console.error('Error adding student:', error);
            Utils.showError('حدث خطأ في إضافة الطالب');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة طالب';
            }
        }
    },
    
  // في دالة deleteStudent
async deleteStudent(userId) {
    const confirmed = await Utils.confirmAction(
        'حذف طالب',
        'هل أنت متأكد من حذف هذا الطالب؟'
    );
    
    if (!confirmed) return;
    
    try {
        const data = await API.delete(`/api/admin/delete-user/${userId}`);
        if (data.success) {
            Utils.showSuccess('تم حذف الطالب بنجاح');
            await this.load();
            if (window.Classes) await window.Classes.load();
            if (window.Dashboard) await window.Dashboard.loadStats();
        } else {
            Utils.showError(data.error || 'فشل حذف الطالب');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        Utils.showError('حدث خطأ في حذف الطالب');
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