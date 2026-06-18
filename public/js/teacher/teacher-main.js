import { Auth } from '../modules/auth.js';
import { Navigation } from '../modules/navigation.js';
import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';
import { Profile } from './profile.js';
import { Classes } from './classes.js';
import { Exams } from './exams.js';
import { Students } from './students.js'; // 🔹 إضافة استيراد الطلاب

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
        
        if (!user || user.role !== 'teacher') {
            window.location.replace('/login.html');
            return;
        }

        // ===== تعريف عناوين الأقسام =====
        const sectionTitles = {
            profile: { title: 'الملف الشخصي', icon: 'fa-user' },
            classes: { title: 'صفوفي', icon: 'fa-school' },
            students: { title: 'طلابي', icon: 'fa-users' }, // 🔹 إضافة عنوان لقسم طلابي
            'class-details': { title: 'تفاصيل الصف', icon: 'fa-info-circle' }
        };

        // ===== تهيئة التنقل =====
        Navigation.init(sectionTitles);

        // ===== ربط الوحدات =====
        window.Auth = Auth;
        window.Navigation = Navigation;
        window.API = API;
        window.Utils = Utils;
        window.TeacherProfile = Profile;
        window.TeacherClasses = Classes;
        window.TeacherExams = Exams;
        window.TeacherStudents = Students; // 🔹 ربط كائن الطلاب

        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName) {
            sidebarName.textContent = user.username || 'الأستاذ';
        }
        
        // تحميل البيانات
        await Profile.load();
        await Classes.load();
        await Exams.load();
        await Students.load(); // 🔹 تحميل الطلاب عند بدء الصفحة
        
        // ربط الأحداث
        document.getElementById('profileForm')?.addEventListener('submit', (e) => Profile.update(e));
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => Profile.changePassword(e));
        document.getElementById('profileImageInput')?.addEventListener('change', (e) => Profile.previewImage(e));
        document.getElementById('addExamForm')?.addEventListener('submit', (e) => Exams.addExam(e));
        
        // ===== حدث تغيير القسم =====
        window.onSectionChange = function(sectionId) {
            switch(sectionId) {
                case 'classes': 
                    Classes.load(); 
                    break;
                case 'profile': 
                    Profile.load(); 
                    break;
                case 'students': // 🔹 تفعيل تحميل الطلاب عند الانتقال إلى القسم
                    Students.load();
                    break;
                case 'class-details':
                    // لا تفعل شيئاً، تم التعامل معه في Classes
                    break;
            }
        };
        
        console.log('✅ تم تهيئة لوحة الأستاذ بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة الأستاذ:', error);
        Utils.showError('حدث خطأ في تهيئة الصفحة. يرجى تحديث الصفحة.');
    }
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) window.location.reload();
});