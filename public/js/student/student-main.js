import { Auth } from '../modules/auth.js';
import { Navigation } from '../modules/navigation.js';
import { Utils } from '../modules/utils.js';
import { Profile } from './profile.js';
import { Classes } from './classes.js';
import { Attendance } from './attendance.js';
import { Exams } from './exams.js';
import { Ratings } from './ratings.js';
import { Evaluation } from './evaluation.js';

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
        // التحقق من المصادقة
        const isAuth = await authInit();
        if (!isAuth) return;
        
        const user = Auth.getUser();
        
        // التحقق من الدور
        if (!user || user.role !== 'student') {
            window.location.replace('/login.html');
            return;
        }

        // ===== تعريف عناوين الأقسام =====
        const sectionTitles = {
            profile: { title: 'الملف الشخصي', icon: 'fa-user' },
            classes: { title: 'موادي', icon: 'fa-book-open' },
            attendance: { title: 'الغيابات', icon: 'fa-calendar-check' },
            exams: { title: 'الامتحانات', icon: 'fa-pencil-alt' },
            ratings: { title: 'التقييم', icon: 'fa-star' },
            evaluation: { title: 'تقييمي', icon: 'fa-chart-line' }
        };

        // ===== تهيئة التنقل =====
        Navigation.init(sectionTitles);

        // ===== ربط الوحدات =====
        window.Auth = Auth;
        window.Navigation = Navigation;
        window.Utils = Utils;
        window.StudentProfile = Profile;
        window.StudentClasses = Classes;
        window.StudentAttendance = Attendance;
        window.StudentExams = Exams;
        window.StudentRatings = Ratings;
        window.StudentEvaluation = Evaluation;
        
        // تعيين اسم المستخدم في الشريط الجانبي
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName) {
            sidebarName.textContent = user.username || 'الطالب';
        }
        
        // تحميل البيانات
        await Profile.load();
        await Classes.load();
        await Attendance.load();
        await Exams.load();
        await Ratings.load();
        await Evaluation.load();
        
        // ربط الأحداث
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => Profile.update(e));
        }
        
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => Profile.changePassword(e));
        }
        
        const profileImageInput = document.getElementById('profileImageInput');
        if (profileImageInput) {
            profileImageInput.addEventListener('change', (e) => Profile.previewImage(e));
        }
        
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
                case 'ratings': 
                    Ratings.load(); 
                    break;
                case 'evaluation': 
                    Evaluation.load(); 
                    break;
            }
        };
        
        console.log('✅ تم تهيئة لوحة الطالب بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة الطالب:', error);
        Utils.showError('حدث خطأ في تهيئة الصفحة. يرجى تحديث الصفحة.');
    }
});

// ===== منع العودة للخلف =====
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// ===== اختصارات لوحة المفاتيح =====
document.addEventListener('keydown', function(e) {
    // Ctrl + M: فتح/إغلاق القائمة (إذا كانت موجودة)
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        if (window.Navigation && window.Navigation.toggleSidebar) {
            window.Navigation.toggleSidebar();
        }
    }
    
    // Alt + 1-6: التنقل السريع بين الأقسام
    const sections = ['profile', 'classes', 'attendance', 'exams', 'ratings', 'evaluation'];
    if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (sections[index]) {
            window.Navigation.navigateTo(sections[index]);
        }
    }
});

console.log('⌨️ اختصارات لوحة المفاتيح:');
console.log('  Ctrl+M: فتح/إغلاق القائمة');
console.log('  Alt+1: الملف الشخصي');
console.log('  Alt+2: موادي');
console.log('  Alt+3: الغيابات');
console.log('  Alt+4: الامتحانات');
console.log('  Alt+5: التقييم');
console.log('  Alt+6: تقييمي');