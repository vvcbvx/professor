import { Auth } from '../modules/auth.js';
import { Navigation } from '../modules/navigation.js';
import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';
import { Profile } from './profile.js';
import { Classes } from './classes.js';
import { Attendance } from './attendance.js';
import { Exams } from './exams.js';

// ===== التحقق من المصادقة =====
const authInit = async () => {
    const isAuth = await Auth.init();
    if (!isAuth) {
        window.location.replace('/login.html');
        return false;
    }
    return true;
};

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const isAuth = await authInit();
        if (!isAuth) return;
        
        const user = Auth.getUser();
        
        if (!user || user.role !== 'student') {
            window.location.replace('/login.html');
            return;
        }

        // ===== تعريف عناوين الأقسام =====
        const sectionTitles = {
            profile: { title: 'الملف الشخصي', icon: 'fa-user' },
            classes: { title: 'موادي', icon: 'fa-book-open' },
            attendance: { title: 'الغيابات', icon: 'fa-calendar-check' },
            exams: { title: 'الامتحانات', icon: 'fa-pencil-alt' }
        };

        // ===== تهيئة التنقل =====
        Navigation.init(sectionTitles);

        // ===== ربط الوحدات =====
        window.Auth = Auth;
        window.Navigation = Navigation;
        window.API = API;
        window.Utils = Utils;
        window.StudentProfile = Profile;
        window.StudentClasses = Classes;
        window.StudentAttendance = Attendance;
        window.StudentExams = Exams;
        
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName) {
            sidebarName.textContent = user.username || 'الطالب';
        }
        
        // تحميل البيانات
        await Profile.load();
        await Classes.load();
        await Attendance.load();
        await Exams.load();
        
        // ربط الأحداث
        document.getElementById('profileForm')?.addEventListener('submit', (e) => Profile.update(e));
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => Profile.changePassword(e));
        document.getElementById('profileImageInput')?.addEventListener('change', (e) => Profile.previewImage(e));
        
        // ===== حدث تغيير القسم =====
        window.onSectionChange = function(sectionId) {
            switch(sectionId) {
                case 'classes': 
                    Classes.load(); 
                    break;
                case 'profile': 
                    Profile.load(); 
                    break;
                case 'attendance': 
                    Attendance.load(); 
                    break;
                case 'exams': 
                    Exams.load(); 
                    break;
            }
        };
        
        console.log('✅ تم تهيئة لوحة الطالب بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة الطالب:', error);
        Utils.showError('حدث خطأ في تهيئة الصفحة. يرجى تحديث الصفحة.');
    }
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) window.location.reload();
});