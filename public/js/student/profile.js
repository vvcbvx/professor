import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';

// ===== ملف الطالب - الملف الشخصي =====
const StudentProfile = {
    profile: null,
    
    async load() {
        try {
            const data = await API.get('/api/profile');
            this.profile = data.profile || {};
            
            if (this.profile) {
                document.getElementById('fullName').value = this.profile.fullName || '';
                document.getElementById('phone').value = this.profile.phone || '';
                document.getElementById('address').value = this.profile.address || '';
                document.getElementById('bio').value = this.profile.bio || '';
                
                if (this.profile.profileImage) {
                    const sidebarAvatar = document.getElementById('sidebarAvatar');
                    const profilePreview = document.getElementById('profileAvatarPreview');
                    
                    if (sidebarAvatar) {
                        sidebarAvatar.innerHTML = `<img src="${this.profile.profileImage}" alt="Profile">`;
                    }
                    if (profilePreview) {
                        profilePreview.innerHTML = `<img src="${this.profile.profileImage}" alt="Profile">`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Utils.showError('فشل تحميل الملف الشخصي');
        }
    },
    
    async update(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('fullName', document.getElementById('fullName').value);
        formData.append('phone', document.getElementById('phone').value);
        formData.append('address', document.getElementById('address').value);
        formData.append('bio', document.getElementById('bio').value);
        
        const imageFile = document.getElementById('profileImageInput').files[0];
        if (imageFile) formData.append('profileImage', imageFile);

        try {
            const data = await API.upload('/api/profile', formData);
            if (data.success) {
                Utils.showSuccess('تم حفظ الملف الشخصي بنجاح!');
                await this.load();
            } else {
                Utils.showError('فشل حفظ الملف الشخصي');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Utils.showError('حدث خطأ في حفظ الملف الشخصي');
        }
    },
    
    async changePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!currentPassword || !newPassword) {
            Utils.showError('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const data = await API.post('/api/change-password', { currentPassword, newPassword });
            if (data.success) {
                Utils.showSuccess('تم تغيير كلمة المرور بنجاح!');
                document.getElementById('passwordForm').reset();
            } else {
                Utils.showError(data.error || 'فشل تغيير كلمة المرور');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            Utils.showError('حدث خطأ في تغيير كلمة المرور');
        }
    },
    
    previewImage(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('profileAvatarPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                }
            };
            reader.readAsDataURL(file);
        }
    }
};



// ===== تصدير الكائن =====
export { StudentProfile as Profile };