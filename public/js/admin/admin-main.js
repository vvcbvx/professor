import { Auth } from '../modules/auth.js';
import { Navigation } from '../modules/navigation.js';
import { Utils } from '../modules/utils.js';
import { API } from '../modules/api.js';
import { Dashboard } from './dashboard.js';
import { Students } from './students.js';
import { Teachers } from './teachers.js';
import { Classes } from './classes.js';
import { Profile } from './profile.js';
import { Attendance } from './attendance.js';

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // التحقق من المصادقة
        const isAuth = await Auth.init();
        if (!isAuth) {
            return;
        }

        const user = Auth.getUser();
        
        // التحقق من الدور
        if (!user || user.role !== 'admin') {
            window.location.replace('/login.html');
            return;
        }

        // ===== تعريف عناوين الأقسام =====
        const sectionTitles = {
            dashboard: { title: 'لوحة التحكم', icon: 'fa-chart-pie' },
            profile: { title: 'الملف الشخصي', icon: 'fa-user' },
            students: { title: 'إدارة الطلاب', icon: 'fa-user-graduate' },
            teachers: { title: 'إدارة الأساتذة', icon: 'fa-chalkboard-teacher' },
            classes: { title: 'إدارة الصفوف', icon: 'fa-school' },
            attendance: { title: 'الغيابات', icon: 'fa-calendar-check' },
             exams: { title: 'الامتحانات', icon: 'fa-pencil-alt' } 
        };

        // ===== تهيئة التنقل =====
        Navigation.init(sectionTitles);

        // ===== ربط الوحدات =====
        window.Auth = Auth;
        window.Navigation = Navigation;
        window.Utils = Utils;
        window.API = API;
        window.Dashboard = Dashboard;
        window.Students = Students;
        window.Teachers = Teachers;
        window.Classes = Classes;
        window.Profile = Profile;
        window.Attendance = Attendance;

        // تعيين اسم المستخدم
        const sidebarName = document.getElementById('sidebarName');
        if (sidebarName) {
            sidebarName.textContent = user.username || 'المدير';
        }
        
        // تحميل البيانات
        await Promise.all([
            Dashboard.loadStats(),
            Profile.load(),
            Students.loadClassesSelect(),
            Teachers.loadSelect(),
            Students.load(),
            Teachers.load(),
            Classes.load(),
            Attendance.loadStudentsAttendance()
        ]);
        
        Students.setupUsernameValidation();
        
        // ===== ربط الأحداث =====
        document.getElementById('addStudentForm')?.addEventListener('submit', (e) => Students.addStudent(e));
        document.getElementById('addTeacherForm')?.addEventListener('submit', (e) => Teachers.addTeacher(e));
        document.getElementById('addClassForm')?.addEventListener('submit', (e) => Classes.addClass(e));
        document.getElementById('profileForm')?.addEventListener('submit', (e) => Profile.update(e));
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => Profile.changePassword(e));
        document.getElementById('profileImageInput')?.addEventListener('change', (e) => Profile.previewImage(e));
        
        // ===== حدث تغيير القسم =====
        window.onSectionChange = function(sectionId) {
            switch(sectionId) {
                case 'exams': 
    if (window.Exams) window.Exams.loadTeacherExams();
    break;
                case 'dashboard': 
                    Dashboard.loadStats(); 
                    break;
                case 'students': 
                    Students.load(); 
                    Students.loadClassesSelect(); 
                    Students.setupUsernameValidation(); 
                    break;
                case 'teachers': 
                    Teachers.load(); 
                    Teachers.loadSelect(); 
                    break;
                case 'classes': 
                    Classes.load(); 
                    Teachers.loadSelect(); 
                    break;
                case 'profile': 
                    Profile.load(); 
                    break;
                case 'attendance': 
                    if (Attendance.currentTab === 'students') {
                        Attendance.loadStudentsAttendance();
                    } else {
                        Attendance.loadTeachersAttendance();
                    }
                    break;
            }
        };
        
        // ===== إغلاق القوائم المنسدلة =====
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.teacher-select-dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(d => d.classList.remove('show'));
            }
        });
        
        console.log('✅ تم تهيئة لوحة المدير بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة لوحة المدير:', error);
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
    // Ctrl + M: فتح/إغلاق القائمة
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        Navigation.toggleSidebar();
    }
    
    // Alt + 1-6: التنقل السريع بين الأقسام
    const sections = ['dashboard', 'profile', 'students', 'teachers', 'classes', 'attendance'];
    if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (sections[index]) {
            Navigation.navigateTo(sections[index]);
        }
    }
});

console.log('⌨️ اختصارات لوحة المفاتيح:');
console.log('  Ctrl+M: فتح/إغلاق القائمة');
console.log('  Alt+1: لوحة التحكم');
console.log('  Alt+2: الملف الشخصي');
console.log('  Alt+3: الطلاب');
console.log('  Alt+4: الأساتذة');
console.log('  Alt+5: الصفوف');
console.log('  Alt+6: الغيابات');