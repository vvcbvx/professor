// ===== الملف الرئيسي =====
// استيراد جميع الوحدات (في المتصفح)

// تهيئة المصادقة
if (!Auth.init()) {
    throw new Error('غير مصرح');
}

// التحقق من دور المستخدم
const user = Auth.getUser();

// ===== تعريف عناوين الأقسام =====
const sectionTitles = {
    dashboard: { title: 'لوحة التحكم', icon: 'fa-chart-pie' },
    profile: { title: 'الملف الشخصي', icon: 'fa-user' },
    students: { title: 'إدارة الطلاب', icon: 'fa-user-graduate' },
    teachers: { title: 'إدارة الأساتذة', icon: 'fa-chalkboard-teacher' },
    classes: { title: 'إدارة الصفوف', icon: 'fa-school' }
};

// ===== تهيئة التنقل =====
Navigation.init(sectionTitles);

// ===== تسجيل الدوال في النافذة العالمية =====
window.Auth = Auth;
window.Navigation = Navigation;
window.API = API;
window.Utils = Utils;

// ===== إعداد الأحداث =====
document.addEventListener('DOMContentLoaded', function() {
    // تعيين اسم المستخدم في الشريط الجانبي
    document.getElementById('sidebarName').textContent = user.username;
    
    // ===== تحميل البيانات حسب الدور =====
    if (user.role === 'admin') {
        // تهيئة وحدات المدير
        window.Dashboard = Dashboard;
        window.Students = Students;
        window.Teachers = Teachers;
        window.Classes = Classes;
        window.Profile = Profile;
        
        // تحميل البيانات الأولية
        Dashboard.loadStats();
        Profile.loadProfile();
        Students.loadClassesSelect();
        Teachers.loadTeachersSelect();
        Students.loadStudents();
        Teachers.loadTeachers();
        Classes.loadClasses();
        Students.setupUsernameValidation();
        
        // ربط الأحداث
        document.getElementById('addStudentForm').addEventListener('submit', Students.addStudent);
        document.getElementById('addTeacherForm').addEventListener('submit', Teachers.addTeacher);
        document.getElementById('addClassForm').addEventListener('submit', Classes.addClass);
        document.getElementById('editClassForm').addEventListener('submit', Classes.updateClass);
        document.getElementById('profileForm').addEventListener('submit', Profile.updateProfile);
        document.getElementById('passwordForm').addEventListener('submit', Profile.changePassword);
        document.getElementById('profileImageInput').addEventListener('change', Profile.previewImage);
        
        // إغلاق المودال عند النقر خارجها
        document.getElementById('editClassModal').addEventListener('click', function(e) {
            if (e.target === this) {
                Classes.closeEditModal();
            }
        });
        
    } else if (user.role === 'teacher') {
        // تهيئة وحدات الأستاذ
        window.TeacherProfile = TeacherProfile;
        window.TeacherStudents = TeacherStudents;
        window.TeacherClasses = TeacherClasses;
        
        // تحميل البيانات
        TeacherProfile.loadProfile();
        TeacherStudents.loadStudents();
        TeacherClasses.loadClasses();
        
        // ربط الأحداث
        document.getElementById('profileForm').addEventListener('submit', TeacherProfile.updateProfile);
        document.getElementById('passwordForm').addEventListener('submit', TeacherProfile.changePassword);
        document.getElementById('profileImageInput').addEventListener('change', TeacherProfile.previewImage);
        
    } else if (user.role === 'student') {
        // تهيئة وحدات الطالب
        window.StudentProfile = StudentProfile;
        window.StudentClasses = StudentClasses;
        
        // تحميل البيانات
        StudentProfile.loadProfile();
        StudentClasses.loadClasses();
        
        // ربط الأحداث
        document.getElementById('profileForm').addEventListener('submit', StudentProfile.updateProfile);
        document.getElementById('passwordForm').addEventListener('submit', StudentProfile.changePassword);
        document.getElementById('profileImageInput').addEventListener('change', StudentProfile.previewImage);
    }
    
    // ===== حدث تغيير القسم =====
    window.onSectionChange = function(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                if (user.role === 'admin') Dashboard.loadStats();
                break;
            case 'students':
                if (user.role === 'admin') {
                    Students.loadStudents();
                    Students.loadClassesSelect();
                    Students.setupUsernameValidation();
                }
                break;
            case 'teachers':
                if (user.role === 'admin') {
                    Teachers.loadTeachers();
                    Teachers.loadTeachersSelect();
                }
                break;
            case 'classes':
                if (user.role === 'admin') {
                    Classes.loadClasses();
                    Teachers.loadTeachersSelect();
                }
                break;
            case 'profile':
                if (user.role === 'admin') Profile.loadProfile();
                else if (user.role === 'teacher') TeacherProfile.loadProfile();
                else if (user.role === 'student') StudentProfile.loadProfile();
                break;
        }
    };
    
    // ===== إغلاق القوائم المنسدلة =====
    document.addEventListener('click', function(e) {
        document.querySelectorAll('.dropdown-menu.show').forEach(d => {
            if (!d.contains(e.target) && !d.previousElementSibling?.contains(e.target)) {
                d.classList.remove('show');
            }
        });
    });
});

// ===== منع العودة للخلف =====
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});