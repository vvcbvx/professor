const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ============================
// إعدادات multer لرفع الصور
// ============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const userId = req.session.user ? req.session.user.id : Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${userId}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف غير مدعوم'));
        }
    }
});

// ============================
// Middleware
// ============================
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// منع التخزين المؤقت
// ============================
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// ============================
// إعدادات الجلسة
// ============================
app.use(session({
    secret: 'my-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// ============================
// خدمة الملفات الثابتة
// ============================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================
// إعدادات الملفات
// ============================
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const EXAMS_FILE = path.join(DATA_DIR, 'exams.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const NOTES_FILE = path.join(DATA_DIR, 'student_notes.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ============================
// دوال قراءة وكتابة الملفات
// ============================
const readData = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
};

const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing file:', error);
        return false;
    }
};

// ============================
// تهيئة البيانات
// ============================
const initializeFiles = () => {
    if (!fs.existsSync(USERS_FILE) || fs.readFileSync(USERS_FILE, 'utf8').trim() === '[]') {
        const adminPassword = bcrypt.hashSync('admin123', 10);
        const users = [{
            id: 1,
            username: 'admin',
            password: adminPassword,
            role: 'admin',
            email: 'admin@school.com',
            profileId: 1,
            createdAt: new Date().toISOString()
        }];
        writeData(USERS_FILE, users);
        console.log('✅ تم إنشاء حساب المدير الافتراضي');
        console.log('   👤 اسم المستخدم: admin');
        console.log('   🔑 كلمة المرور: admin123');
    }

    if (!fs.existsSync(PROFILES_FILE) || fs.readFileSync(PROFILES_FILE, 'utf8').trim() === '[]') {
        writeData(PROFILES_FILE, [{
            userId: 1,
            fullName: 'المدير العام',
            phone: '',
            address: '',
            bio: '',
            createdAt: new Date().toISOString()
        }]);
        console.log('✅ تم إنشاء الملف الشخصي للمدير');
    }

    if (!fs.existsSync(CLASSES_FILE)) {
        writeData(CLASSES_FILE, []);
        console.log('✅ تم إنشاء ملف الصفوف');
    }

    if (!fs.existsSync(ATTENDANCE_FILE)) {
        writeData(ATTENDANCE_FILE, []);
        console.log('✅ تم إنشاء ملف الغيابات');
    }

    if (!fs.existsSync(EXAMS_FILE)) {
        writeData(EXAMS_FILE, []);
        console.log('✅ تم إنشاء ملف الامتحانات');
    }

    if (!fs.existsSync(RATINGS_FILE)) {
        writeData(RATINGS_FILE, []);
        console.log('✅ تم إنشاء ملف التقييمات');
    }

    if (!fs.existsSync(NOTES_FILE)) {
        writeData(NOTES_FILE, []);
        console.log('✅ تم إنشاء ملف ملاحظات الطلاب');
    }
};

// ============================
// تحديث البيانات القديمة للصفوف
// ============================
const migrateOldData = () => {
    let classes = readData(CLASSES_FILE);
    let updated = false;

    classes = classes.map(cls => {
        if (cls.teacherId !== undefined && cls.teacherId !== null) {
            cls.teacherIds = [cls.teacherId];
            delete cls.teacherId;
            updated = true;
        }
        if (!cls.teacherIds) {
            cls.teacherIds = [];
            updated = true;
        }
        return cls;
    });

    if (updated) {
        writeData(CLASSES_FILE, classes);
        console.log('✅ تم تحديث بيانات الصفوف إلى النظام الجديد (دعم عدة أساتذة)');
    }
};

// ============================
// دوال المصادقة
// ============================
const authenticateUser = (username, password, role) => {
    const users = readData(USERS_FILE);
    const user = users.find(u => u.username === username && u.role === role);
    if (!user) return null;
    const isMatch = bcrypt.compareSync(password, user.password);
    return isMatch ? user : null;
};

const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            error: 'غير مصرح لك',
            redirect: '/login.html'
        });
    }

    const users = readData(USERS_FILE);
    const userExists = users.find(u => u.id === req.session.user.id);
    if (!userExists) {
        req.session.destroy();
        return res.status(401).json({
            error: 'المستخدم غير موجود',
            redirect: '/login.html'
        });
    }

    next();
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ error: 'غير مصرح لك' });
        }

        if (req.session.user.role !== role) {
            return res.status(403).json({ error: 'ليس لديك الصلاحية' });
        }

        next();
    };
};

// ============================
// مسار التحقق من الجلسة
// ============================
app.get('/api/check-session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// ============================
// مسارات المصادقة
// ============================
app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const user = authenticateUser(username, password, role);
    if (!user) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email || ''
    };

    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'خطأ في حفظ الجلسة' });
        }

        const profiles = readData(PROFILES_FILE);
        const profile = profiles.find(p => p.userId === user.id);

        const rolePages = {
            admin: '/pages/admin.html',
            teacher: '/pages/teacher.html',
            student: '/pages/student.html'
        };

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                profile: profile || null
            },
            redirect: rolePages[user.role] || '/pages/student.html'
        });
    });
});

// ============================
// مسار تسجيل الخروج
// ============================
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                error: 'خطأ في تسجيل الخروج'
            });
        }

        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح',
            redirect: '/login.html'
        });
    });
});

// ============================
// الحصول على المستخدم الحالي
// ============================
app.get('/api/current-user', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'غير مسجل الدخول' });
    }

    const users = readData(USERS_FILE);
    const user = users.find(u => u.id === req.session.user.id);

    if (!user) {
        req.session.destroy();
        return res.status(401).json({ error: 'المستخدم غير موجود' });
    }

    const profiles = readData(PROFILES_FILE);
    const profile = profiles.find(p => p.userId === user?.id);

    res.json({
        user: {
            id: user?.id,
            username: user?.username,
            role: user?.role,
            profile: profile || null
        }
    });
});

// ============================
// مسارات الملف الشخصي
// ============================
app.get('/api/profile', requireAuth, (req, res) => {
    const profiles = readData(PROFILES_FILE);
    const profile = profiles.find(p => p.userId === req.session.user.id);
    res.json({ profile: profile || null });
});

app.post('/api/profile', requireAuth, upload.single('profileImage'), (req, res) => {
    const userId = req.session.user.id;
    const { fullName, phone, address, bio } = req.body;

    let profiles = readData(PROFILES_FILE);
    let profile = profiles.find(p => p.userId === userId);

    const profileData = {
        userId,
        fullName: fullName || '',
        phone: phone || '',
        address: address || '',
        bio: bio || '',
        updatedAt: new Date().toISOString()
    };

    if (req.file) {
        profileData.profileImage = `/uploads/${req.file.filename}`;
    }

    if (profile) {
        const index = profiles.indexOf(profile);
        profiles[index] = { ...profile, ...profileData };
    } else {
        profileData.createdAt = new Date().toISOString();
        profiles.push(profileData);
    }

    if (writeData(PROFILES_FILE, profiles)) {
        res.json({ success: true, profile: profileData });
    } else {
        res.status(500).json({ error: 'فشل حفظ الملف الشخصي' });
    }
});

app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    if (newPassword.length < 4) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
    }

    let users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    const user = users[userIndex];
    if (!bcrypt.compareSync(currentPassword, user.password)) {
        return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    users[userIndex].password = bcrypt.hashSync(newPassword, 10);
    if (writeData(USERS_FILE, users)) {
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } else {
        res.status(500).json({ error: 'فشل تغيير كلمة المرور' });
    }
});

// ============================
// مسارات المدير
// ============================
app.get('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const usersWithProfiles = users.map(user => ({
        ...user,
        profile: profiles.find(p => p.userId === user.id) || null
    }));
    res.json({ users: usersWithProfiles });
});

app.get('/api/admin/classes', requireAuth, requireRole('admin'), (req, res) => {
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const classesWithDetails = classes.map(cls => {
        const teachers = cls.teacherIds ? cls.teacherIds.map(id => {
            const teacher = users.find(u => u.id === id && u.role === 'teacher');
            const teacherProfile = teacher ? profiles.find(p => p.userId === teacher.id) : null;
            return teacher ? {
                id: teacher.id,
                username: teacher.username,
                fullName: teacherProfile?.fullName || teacher.username,
                subject: teacher.subject || teacherProfile?.subject || 'غير محدد',
                profileImage: teacherProfile?.profileImage || null
            } : null;
        }).filter(t => t !== null) : [];

        return {
            ...cls,
            teachers: teachers,
            teacherIds: cls.teacherIds || [],
            studentsCount: (cls.students || []).length
        };
    });

    res.json({ classes: classesWithDetails });
});

app.get('/api/admin/teachers-with-classes', requireAuth, requireRole('admin'), (req, res) => {
    const users = readData(USERS_FILE);
    const classes = readData(CLASSES_FILE);
    const profiles = readData(PROFILES_FILE);

    const teachers = users.filter(u => u.role === 'teacher');

    const teachersWithClasses = teachers.map(t => {
        const teacherClasses = classes.filter(c =>
            c.teacherIds && c.teacherIds.includes(t.id)
        );
        const profile = profiles.find(p => p.userId === t.id);

        return {
            id: t.id,
            username: t.username,
            fullName: profile?.fullName || t.username,
            email: t.email || '',
            phone: profile?.phone || '',
            subject: t.subject || profile?.subject || 'غير محدد',
            profileImage: profile?.profileImage || null,
            classes: teacherClasses.map(c => ({
                id: c.id,
                className: c.className,
                year: c.year
            })),
            classesCount: teacherClasses.length
        };
    });

    res.json({ teachers: teachersWithClasses });
});

app.get('/api/admin/stats', requireAuth, requireRole('admin'), (req, res) => {
    const users = readData(USERS_FILE);
    const classes = readData(CLASSES_FILE);
    const profiles = readData(PROFILES_FILE);

    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');

    const totalClasses = classes.length;
    const totalStudents = students.length;
    const totalTeachers = teachers.length;

    const classesWithTeacher = classes.filter(c => c.teacherIds && c.teacherIds.length > 0).length;
    const classesWithoutTeacher = classes.filter(c => !c.teacherIds || c.teacherIds.length === 0).length;

    const classStats = classes.map(cls => {
        let teachersDetails = [];
        if (cls.teacherIds && cls.teacherIds.length > 0) {
            teachersDetails = cls.teacherIds.map(id => {
                const teacher = users.find(u => u.id === id && u.role === 'teacher');
                if (teacher) {
                    const profile = profiles.find(p => p.userId === teacher.id);
                    return {
                        id: teacher.id,
                        username: teacher.username,
                        fullName: profile?.fullName || teacher.username,
                        subject: teacher.subject || profile?.subject || 'غير محدد',
                        profileImage: profile?.profileImage || null
                    };
                }
                return null;
            }).filter(t => t !== null);
        }

        return {
            id: cls.id,
            className: cls.className,
            year: cls.year,
            description: cls.description || '',
            teacherIds: cls.teacherIds || [],
            teachers: teachersDetails,
            studentsCount: (cls.students || []).length,
            students: cls.students || []
        };
    });

    res.json({
        stats: {
            totalStudents,
            totalTeachers,
            totalClasses,
            classesWithTeacher,
            classesWithoutTeacher
        },
        classStats: classStats
    });
});

app.post('/api/admin/add-class', requireAuth, requireRole('admin'), (req, res) => {
    const { className, year, description } = req.body;

    if (!className) {
        return res.status(400).json({ error: 'اسم الصف مطلوب' });
    }

    let classes = readData(CLASSES_FILE);

    if (classes.find(c => c.className === className && c.year === year)) {
        return res.status(400).json({ error: 'الصف موجود بالفعل' });
    }

    const newClass = {
        id: Date.now(),
        className,
        year: year || new Date().getFullYear(),
        description: description || '',
        teacherIds: [],
        students: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    classes.push(newClass);
    if (writeData(CLASSES_FILE, classes)) {
        res.json({
            success: true,
            class: newClass,
            message: 'تم إضافة الصف بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة الصف' });
    }
});

app.put('/api/admin/update-class/:classId', requireAuth, requireRole('admin'), (req, res) => {
    const classId = parseInt(req.params.classId);
    const { className, year, description } = req.body;

    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === classId);

    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    classes[classIndex] = {
        ...classes[classIndex],
        className: className || classes[classIndex].className,
        year: year || classes[classIndex].year,
        description: description || classes[classIndex].description,
        updatedAt: new Date().toISOString()
    };

    if (writeData(CLASSES_FILE, classes)) {
        res.json({
            success: true,
            class: classes[classIndex],
            message: 'تم تحديث بيانات الصف بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل تحديث الصف' });
    }
});

app.delete('/api/admin/delete-class/:classId', requireAuth, requireRole('admin'), (req, res) => {
    const classId = parseInt(req.params.classId);
    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === classId);
    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    classes.splice(classIndex, 1);
    if (writeData(CLASSES_FILE, classes)) {
        res.json({ success: true, message: 'تم حذف الصف بنجاح' });
    } else {
        res.status(500).json({ error: 'فشل حذف الصف' });
    }
});

app.post('/api/admin/add-teacher', requireAuth, requireRole('admin'), (req, res) => {
    const { username, password, fullName, email, phone, subject } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'الحقول الأساسية مطلوبة' });
    }

    let users = readData(USERS_FILE);
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'الرقم الموظفي موجود بالفعل' });
    }

    const newUser = {
        id: Date.now(),
        username,
        password: bcrypt.hashSync(password, 10),
        role: 'teacher',
        email: email || '',
        subject: subject || '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    if (writeData(USERS_FILE, users)) {
        let profiles = readData(PROFILES_FILE);
        profiles.push({
            userId: newUser.id,
            fullName: fullName || '',
            phone: phone || '',
            subject: subject || '',
            createdAt: new Date().toISOString()
        });
        writeData(PROFILES_FILE, profiles);
        res.json({
            success: true,
            user: newUser,
            message: 'تم إضافة الأستاذ بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة الأستاذ' });
    }
});

app.post('/api/admin/add-teacher-to-class', requireAuth, requireRole('admin'), (req, res) => {
    const { classId, teacherId } = req.body;

    if (!classId || !teacherId) {
        return res.status(400).json({ error: 'معرف الصف والأستاذ مطلوبان' });
    }

    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === parseInt(classId));
    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    const users = readData(USERS_FILE);
    const teacher = users.find(u => u.id === parseInt(teacherId) && u.role === 'teacher');
    if (!teacher) {
        return res.status(404).json({ error: 'الأستاذ غير موجود' });
    }

    if (!classes[classIndex].teacherIds) {
        classes[classIndex].teacherIds = [];
    }

    if (!classes[classIndex].teacherIds.includes(parseInt(teacherId))) {
        classes[classIndex].teacherIds.push(parseInt(teacherId));
    } else {
        return res.status(400).json({ error: 'الأستاذ مضاف بالفعل لهذا الصف' });
    }

    classes[classIndex].updatedAt = new Date().toISOString();

    if (writeData(CLASSES_FILE, classes)) {
        res.json({
            success: true,
            message: 'تم إضافة الأستاذ للصف بنجاح',
            class: classes[classIndex]
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة الأستاذ' });
    }
});

app.post('/api/admin/remove-teacher-from-class', requireAuth, requireRole('admin'), (req, res) => {
    const { classId, teacherId } = req.body;

    if (!classId || !teacherId) {
        return res.status(400).json({ error: 'معرف الصف والأستاذ مطلوبان' });
    }

    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === parseInt(classId));
    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    if (!classes[classIndex].teacherIds) {
        classes[classIndex].teacherIds = [];
    }

    if (!classes[classIndex].teacherIds.includes(parseInt(teacherId))) {
        return res.status(400).json({ error: 'الأستاذ غير معين على هذا الصف' });
    }

    classes[classIndex].teacherIds = classes[classIndex].teacherIds.filter(id => id !== parseInt(teacherId));
    classes[classIndex].updatedAt = new Date().toISOString();

    if (writeData(CLASSES_FILE, classes)) {
        res.json({
            success: true,
            message: 'تم إزالة الأستاذ من الصف بنجاح',
            class: classes[classIndex]
        });
    } else {
        res.status(500).json({ error: 'فشل إزالة الأستاذ' });
    }
});

app.post('/api/admin/assign-teachers', requireAuth, requireRole('admin'), (req, res) => {
    const { classId, teacherIds } = req.body;

    if (!classId || !teacherIds || !Array.isArray(teacherIds)) {
        return res.status(400).json({ error: 'معرف الصف وقائمة الأساتذة مطلوبة' });
    }

    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === parseInt(classId));
    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    const users = readData(USERS_FILE);
    const teachers = users.filter(u => teacherIds.includes(u.id) && u.role === 'teacher');
    if (teachers.length !== teacherIds.length) {
        return res.status(404).json({ error: 'بعض الأساتذة غير موجودين' });
    }

    classes[classIndex].teacherIds = teacherIds;
    classes[classIndex].updatedAt = new Date().toISOString();

    if (writeData(CLASSES_FILE, classes)) {
        res.json({
            success: true,
            message: 'تم تعيين الأساتذة للصف بنجاح',
            class: classes[classIndex]
        });
    } else {
        res.status(500).json({ error: 'فشل تعيين الأساتذة' });
    }
});

app.post('/api/admin/add-student', requireAuth, requireRole('admin'), (req, res) => {
    const { username, password, fullName, fatherName, motherName, nickname, classId, phone, notes } = req.body;

    if (!username || !password || !classId) {
        return res.status(400).json({ error: 'الحقول الأساسية مطلوبة' });
    }

    let users = readData(USERS_FILE);
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'الرقم المدرسي موجود بالفعل' });
    }

    let classes = readData(CLASSES_FILE);
    const classIndex = classes.findIndex(c => c.id === parseInt(classId));
    if (classIndex === -1) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }

    const newUser = {
        id: Date.now(),
        username,
        password: bcrypt.hashSync(password, 10),
        role: 'student',
        classId: parseInt(classId),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    if (writeData(USERS_FILE, users)) {
        let profiles = readData(PROFILES_FILE);
        profiles.push({
            userId: newUser.id,
            fullName: fullName || '',
            fatherName: fatherName || '',
            motherName: motherName || '',
            nickname: nickname || '',
            phone: phone || '',
            notes: notes || '',
            createdAt: new Date().toISOString()
        });
        writeData(PROFILES_FILE, profiles);

        if (!classes[classIndex].students) classes[classIndex].students = [];
        if (!classes[classIndex].students.includes(newUser.id)) {
            classes[classIndex].students.push(newUser.id);
            classes[classIndex].updatedAt = new Date().toISOString();
            writeData(CLASSES_FILE, classes);
        }

        res.json({
            success: true,
            user: newUser,
            message: 'تم إضافة الطالب بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة الطالب' });
    }
});

app.delete('/api/admin/delete-user/:userId', requireAuth, requireRole('admin'), (req, res) => {
    const userId = parseInt(req.params.userId);

    if (userId === 1) {
        return res.status(403).json({ error: 'لا يمكن حذف المدير الرئيسي' });
    }

    let users = readData(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    let classes = readData(CLASSES_FILE);
    classes = classes.map(cls => {
        if (cls.teacherIds) {
            cls.teacherIds = cls.teacherIds.filter(id => id !== userId);
        }
        if (cls.students) {
            cls.students = cls.students.filter(id => id !== userId);
        }
        return cls;
    });
    writeData(CLASSES_FILE, classes);

    users.splice(userIndex, 1);
    if (writeData(USERS_FILE, users)) {
        let profiles = readData(PROFILES_FILE);
        profiles = profiles.filter(p => p.userId !== userId);
        writeData(PROFILES_FILE, profiles);
        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    } else {
        res.status(500).json({ error: 'فشل حذف المستخدم' });
    }
});

// ============================
// مسارات الأستاذ
// ============================
app.get('/api/teacher/students', requireAuth, requireRole('teacher'), (req, res) => {
    const teacherId = req.session.user.id;
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);

    const teacherClasses = classes.filter(cls =>
        cls.teacherIds && cls.teacherIds.includes(teacherId)
    );
    const studentIds = [...new Set(teacherClasses.flatMap(cls => cls.students || []))];
    const students = users.filter(u => studentIds.includes(u.id) && u.role === 'student');

    const profiles = readData(PROFILES_FILE);
    const studentsWithProfiles = students.map(student => ({
        ...student,
        profile: profiles.find(p => p.userId === student.id) || null
    }));

    res.json({ students: studentsWithProfiles });
});

app.get('/api/teacher/classes', requireAuth, requireRole('teacher'), (req, res) => {
    const teacherId = req.session.user.id;
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const teacherClasses = classes.filter(cls =>
        cls.teacherIds && cls.teacherIds.includes(teacherId)
    );

    const teacher = users.find(u => u.id === teacherId);
    const profile = teacher ? profiles.find(p => p.userId === teacher.id) : null;
    const subject = teacher?.subject || profile?.subject || 'غير محدد';

    const classesWithSubject = teacherClasses.map(cls => ({
        ...cls,
        subject: subject
    }));

    res.json({ classes: classesWithSubject });
});

// ============================
// مسارات الطالب
// ============================
app.get('/api/student/classes', requireAuth, requireRole('student'), (req, res) => {
    const userId = req.session.user.id;
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const studentClasses = classes.filter(cls => (cls.students || []).includes(userId));

    const classesWithDetails = studentClasses.map(cls => {
        let teachersWithSubjects = [];

        if (cls.teacherIds && cls.teacherIds.length > 0) {
            teachersWithSubjects = cls.teacherIds.map(id => {
                const teacher = users.find(u => u.id === id && u.role === 'teacher');
                if (teacher) {
                    const profile = profiles.find(p => p.userId === teacher.id);
                    return {
                        id: teacher.id,
                        username: teacher.username,
                        fullName: profile?.fullName || teacher.username,
                        subject: teacher.subject || profile?.subject || 'غير محدد',
                        profileImage: profile?.profileImage || null
                    };
                }
                return null;
            }).filter(t => t !== null);
        }

        return {
            ...cls,
            teachers: teachersWithSubjects
        };
    });

    res.json({ classes: classesWithDetails });
});

// ============================
// مسارات الغيابات
// ============================
app.get('/api/attendance/all', requireAuth, requireRole('admin'), (req, res) => {
    const attendance = readData(ATTENDANCE_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const attendanceWithDetails = attendance.map(record => {
        const user = users.find(u => u.id === record.userId);
        const profile = user ? profiles.find(p => p.userId === user.id) : null;
        return {
            ...record,
            user: user ? {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: profile?.fullName || user.username,
                profileImage: profile?.profileImage || null
            } : null
        };
    });

    res.json({ attendance: attendanceWithDetails });
});

app.get('/api/attendance/check', requireAuth, (req, res) => {
    const { userId, date } = req.query;

    if (!userId || !date) {
        return res.status(400).json({ error: 'معرف المستخدم والتاريخ مطلوبان' });
    }

    const attendance = readData(ATTENDANCE_FILE);
    const exists = attendance.some(a => a.userId === parseInt(userId) && a.date === date);

    res.json({ exists });
});

app.get('/api/attendance/student', requireAuth, (req, res) => {
    const userId = req.query.userId || req.session.user.id;
    const attendance = readData(ATTENDANCE_FILE);

    const studentAttendance = attendance.filter(a => a.userId === parseInt(userId));

    const unexcusedDays = studentAttendance.filter(a => a.status === 'unexcused').length;
    const excusedDays = studentAttendance.filter(a => a.status === 'excused').length;
    const totalAbsentDays = unexcusedDays + excusedDays;
    const totalDays = studentAttendance.length;

    res.json({
        attendance: studentAttendance,
        stats: {
            totalDays: totalDays,
            absentDays: totalAbsentDays,
            excusedDays: excusedDays,
            unexcusedDays: unexcusedDays
        }
    });
});

app.get('/api/attendance/teacher', requireAuth, (req, res) => {
    const userId = req.query.userId || req.session.user.id;
    const attendance = readData(ATTENDANCE_FILE);

    const teacherAttendance = attendance.filter(a => a.userId === parseInt(userId));

    const unexcusedDays = teacherAttendance.filter(a => a.status === 'unexcused').length;
    const excusedDays = teacherAttendance.filter(a => a.status === 'excused').length;
    const totalAbsentDays = unexcusedDays + excusedDays;
    const totalDays = teacherAttendance.length;

    res.json({
        attendance: teacherAttendance,
        stats: {
            totalDays: totalDays,
            absentDays: totalAbsentDays,
            excusedDays: excusedDays,
            unexcusedDays: unexcusedDays
        }
    });
});

app.get('/api/attendance/students', requireAuth, requireRole('admin'), (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const attendance = readData(ATTENDANCE_FILE);

    const students = users.filter(u => u.role === 'student');
    const studentsWithAttendance = students.map(student => {
        const profile = profiles.find(p => p.userId === student.id);
        const studentAttendance = attendance.filter(a => a.userId === student.id);

        const unexcusedDays = studentAttendance.filter(a => a.status === 'unexcused').length;
        const excusedDays = studentAttendance.filter(a => a.status === 'excused').length;
        const totalAbsentDays = unexcusedDays + excusedDays;
        const totalDays = studentAttendance.length;

        return {
            ...student,
            profile: profile || null,
            attendance: studentAttendance,
            stats: {
                totalDays: totalDays,
                absentDays: totalAbsentDays,
                excusedDays: excusedDays,
                unexcusedDays: unexcusedDays
            }
        };
    });

    res.json({ students: studentsWithAttendance });
});

app.get('/api/attendance/teachers', requireAuth, requireRole('admin'), (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const attendance = readData(ATTENDANCE_FILE);

    const teachers = users.filter(u => u.role === 'teacher');
    const teachersWithAttendance = teachers.map(teacher => {
        const profile = profiles.find(p => p.userId === teacher.id);
        const teacherAttendance = attendance.filter(a => a.userId === teacher.id);

        const unexcusedDays = teacherAttendance.filter(a => a.status === 'unexcused').length;
        const excusedDays = teacherAttendance.filter(a => a.status === 'excused').length;
        const totalAbsentDays = unexcusedDays + excusedDays;
        const totalDays = teacherAttendance.length;

        return {
            ...teacher,
            profile: profile || null,
            attendance: teacherAttendance,
            stats: {
                totalDays: totalDays,
                absentDays: totalAbsentDays,
                excusedDays: excusedDays,
                unexcusedDays: unexcusedDays
            }
        };
    });

    res.json({ teachers: teachersWithAttendance });
});

app.post('/api/attendance/add', requireAuth, (req, res) => {
    const { userId, date, status, reason, type } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }

    if (!date) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
    }

    if (!status) {
        return res.status(400).json({ error: 'الحالة مطلوبة' });
    }

    const validStatuses = ['present', 'absent', 'excused', 'unexcused'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'حالة غير صحيحة' });
    }

    const users = readData(USERS_FILE);
    const userExists = users.find(u => u.id === parseInt(userId));
    if (!userExists) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    let attendance = readData(ATTENDANCE_FILE);

    const existing = attendance.find(a => a.userId === parseInt(userId) && a.date === date);
    if (existing) {
        return res.status(400).json({ error: 'تم تسجيل هذا اليوم بالفعل' });
    }

    const newRecord = {
        id: Date.now(),
        userId: parseInt(userId),
        date: date,
        status: status,
        reason: reason || '',
        type: type || 'student',
        createdBy: req.session.user.id,
        createdAt: new Date().toISOString()
    };

    attendance.push(newRecord);

    if (writeData(ATTENDANCE_FILE, attendance)) {
        res.json({
            success: true,
            record: newRecord,
            message: 'تم تسجيل الغياب بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل تسجيل الغياب' });
    }
});

app.put('/api/attendance/update/:id', requireAuth, requireRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const { status, reason } = req.body;

    let attendance = readData(ATTENDANCE_FILE);
    const index = attendance.findIndex(a => a.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'الغياب غير موجود' });
    }

    attendance[index].status = status || attendance[index].status;
    attendance[index].reason = reason || attendance[index].reason;
    attendance[index].updatedAt = new Date().toISOString();

    if (writeData(ATTENDANCE_FILE, attendance)) {
        res.json({ success: true, record: attendance[index], message: 'تم تحديث الغياب بنجاح' });
    } else {
        res.status(500).json({ error: 'فشل تحديث الغياب' });
    }
});

app.delete('/api/attendance/delete/:id', requireAuth, requireRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    let attendance = readData(ATTENDANCE_FILE);
    const index = attendance.findIndex(a => a.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'الغياب غير موجود' });
    }

    attendance.splice(index, 1);

    if (writeData(ATTENDANCE_FILE, attendance)) {
        res.json({ success: true, message: 'تم حذف الغياب بنجاح' });
    } else {
        res.status(500).json({ error: 'فشل حذف الغياب' });
    }
});

// ============================
// مسارات الامتحانات
// ============================

app.get('/api/exams/teacher', requireAuth, requireRole('teacher'), (req, res) => {
    const teacherId = req.session.user.id;
    const exams = readData(EXAMS_FILE);
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const teacherExams = exams.filter(e => e.teacherId === teacherId);
    
    const examsWithDetails = teacherExams.map(exam => {
        const classData = classes.find(c => c.id === exam.classId);
        const students = classData ? classData.students || [] : [];
        const studentsWithDetails = students.map(id => {
            const user = users.find(u => u.id === id);
            const profile = user ? profiles.find(p => p.userId === user.id) : null;
            return {
                id: user?.id,
                username: user?.username,
                fullName: profile?.fullName || user?.username
            };
        });

        return {
            ...exam,
            className: classData?.className || 'غير محدد',
            students: studentsWithDetails,
            results: exam.results || []
        };
    });

    res.json({ exams: examsWithDetails });
});

app.get('/api/exams/student', requireAuth, requireRole('student'), (req, res) => {
    const studentId = req.session.user.id;
    const exams = readData(EXAMS_FILE);
    const classes = readData(CLASSES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);

    const studentClasses = classes.filter(c => (c.students || []).includes(studentId));
    const classIds = studentClasses.map(c => c.id);

    const studentExams = exams.filter(e => classIds.includes(e.classId));
    
    const examsWithDetails = studentExams.map(exam => {
        const classData = classes.find(c => c.id === exam.classId);
        const teacher = users.find(u => u.id === exam.teacherId);
        const teacherProfile = teacher ? profiles.find(p => p.userId === teacher.id) : null;
        
        const result = (exam.results || []).find(r => r.studentId === studentId);

        return {
            ...exam,
            className: classData?.className || 'غير محدد',
            teacherName: teacherProfile?.fullName || teacher?.username || 'غير معين',
            result: result || null,
            isCompleted: exam.status === 'completed'
        };
    });

    res.json({ exams: examsWithDetails });
});

app.post('/api/exams/add', requireAuth, requireRole('teacher'), (req, res) => {
    const { classId, subject, date, description } = req.body;
    const teacherId = req.session.user.id;

    console.log('📥 استلام طلب إضافة امتحان:', req.body);

    if (!classId) {
        return res.status(400).json({ error: 'معرف الصف مطلوب' });
    }

    if (!subject) {
        return res.status(400).json({ error: 'اسم المادة مطلوب' });
    }

    if (!date) {
        return res.status(400).json({ error: 'التاريخ مطلوب' });
    }

    const classes = readData(CLASSES_FILE);
    const classData = classes.find(c => c.id === parseInt(classId));
    if (!classData) {
        return res.status(404).json({ error: 'الصف غير موجود' });
    }
    if (!classData.teacherIds || !classData.teacherIds.includes(teacherId)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الصف' });
    }

    let exams = readData(EXAMS_FILE);

    const existing = exams.find(e => 
        e.classId === parseInt(classId) && 
        e.date === date
    );
    if (existing) {
        return res.status(400).json({ error: 'يوجد امتحان في هذا اليوم لهذا الصف' });
    }

    const newExam = {
        id: Date.now(),
        classId: parseInt(classId),
        teacherId: teacherId,
        subject: subject,
        date: date,
        description: description || '',
        status: 'upcoming',
        results: [],
        createdAt: new Date().toISOString()
    };

    exams.push(newExam);
    if (writeData(EXAMS_FILE, exams)) {
        console.log('✅ تم إضافة الامتحان بنجاح:', newExam);
        res.json({
            success: true,
            exam: newExam,
            message: 'تم إضافة الامتحان بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة الامتحان' });
    }
});

app.put('/api/exams/update-status/:examId', requireAuth, requireRole('teacher'), (req, res) => {
    const examId = parseInt(req.params.examId);
    const { status } = req.body;
    const teacherId = req.session.user.id;

    let exams = readData(EXAMS_FILE);
    const examIndex = exams.findIndex(e => e.id === examId);
    if (examIndex === -1) {
        return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    if (exams[examIndex].teacherId !== teacherId) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الامتحان' });
    }

    if (status === 'completed' && exams[examIndex].status !== 'completed') {
        const classData = readData(CLASSES_FILE).find(c => c.id === exams[examIndex].classId);
        if (classData) {
            const students = classData.students || [];
            exams[examIndex].results = students.map(studentId => ({
                studentId: studentId,
                attended: false,
                grade: null
            }));
        }
    }

    exams[examIndex].status = status;
    exams[examIndex].updatedAt = new Date().toISOString();

    if (writeData(EXAMS_FILE, exams)) {
        res.json({
            success: true,
            message: 'تم تحديث حالة الامتحان بنجاح',
            exam: exams[examIndex]
        });
    } else {
        res.status(500).json({ error: 'فشل تحديث حالة الامتحان' });
    }
});

app.put('/api/exams/update-results/:examId', requireAuth, requireRole('teacher'), (req, res) => {
    const examId = parseInt(req.params.examId);
    const { results } = req.body;
    const teacherId = req.session.user.id;

    let exams = readData(EXAMS_FILE);
    const examIndex = exams.findIndex(e => e.id === examId);
    if (examIndex === -1) {
        return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    if (exams[examIndex].teacherId !== teacherId) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الامتحان' });
    }

    results.forEach(result => {
        const existingResult = exams[examIndex].results.find(r => r.studentId === result.studentId);
        if (existingResult) {
            existingResult.attended = result.attended;
            existingResult.grade = result.grade;
        } else {
            exams[examIndex].results.push({
                studentId: result.studentId,
                attended: result.attended,
                grade: result.grade
            });
        }
    });

    exams[examIndex].updatedAt = new Date().toISOString();

    if (writeData(EXAMS_FILE, exams)) {
        res.json({
            success: true,
            message: 'تم تحديث نتائج الامتحان بنجاح',
            exam: exams[examIndex]
        });
    } else {
        res.status(500).json({ error: 'فشل تحديث النتائج' });
    }
});

app.delete('/api/exams/delete/:examId', requireAuth, requireRole('teacher'), (req, res) => {
    const examId = parseInt(req.params.examId);
    const teacherId = req.session.user.id;

    let exams = readData(EXAMS_FILE);
    const examIndex = exams.findIndex(e => e.id === examId);
    if (examIndex === -1) {
        return res.status(404).json({ error: 'الامتحان غير موجود' });
    }

    if (exams[examIndex].teacherId !== teacherId) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الامتحان' });
    }

    exams.splice(examIndex, 1);

    if (writeData(EXAMS_FILE, exams)) {
        res.json({
            success: true,
            message: 'تم حذف الامتحان بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل حذف الامتحان' });
    }
});

app.get('/api/exams/teacher/booked-days', requireAuth, requireRole('teacher'), (req, res) => {
    const teacherId = req.session.user.id;
    const exams = readData(EXAMS_FILE);
    
    const teacherExams = exams.filter(e => e.teacherId === teacherId);
    const bookedDays = teacherExams.map(e => e.date);
    
    res.json({ bookedDays: bookedDays });
});

app.get('/api/exams/class/booked-days/:classId', requireAuth, requireRole('teacher'), (req, res) => {
    const classId = parseInt(req.params.classId);
    const teacherId = req.session.user.id;
    const exams = readData(EXAMS_FILE);
    
    const classes = readData(CLASSES_FILE);
    const classData = classes.find(c => c.id === classId);
    if (!classData || !classData.teacherIds || !classData.teacherIds.includes(teacherId)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الصف' });
    }
    
    const classExams = exams.filter(e => e.classId === classId);
    const bookedDays = classExams.map(e => e.date);
    
    res.json({ bookedDays: bookedDays });
});

// ============================
// نظام التصويت ولوحة الشرف (مدمج)
// ============================

// الحصول على الأساتذة المتاحين للتصويت
app.get('/api/ratings/available-teachers', requireAuth, (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const ratings = readData(RATINGS_FILE);
    const studentId = req.session.user.id;
    
    const teachers = users.filter(u => u.role === 'teacher');
    
    const teachersWithRating = teachers.map(teacher => {
        const profile = profiles.find(p => p.userId === teacher.id);
        const teacherRatings = ratings.filter(r => r.teacherId === teacher.id);
        const studentRating = ratings.find(r => r.teacherId === teacher.id && r.studentId === studentId);
        
        const votesCount = teacherRatings.length;
        const total = teacherRatings.reduce((sum, r) => sum + r.rating, 0);
        const average = votesCount > 0 ? Math.round((total / votesCount) * 10) / 10 : 0;
        
        return {
            id: teacher.id,
            username: teacher.username,
            fullName: profile?.fullName || teacher.username,
            subject: teacher.subject || profile?.subject || 'غير محدد',
            profileImage: profile?.profileImage || null,
            votesCount: votesCount,
            averageRating: average,
            studentRating: studentRating || null,
            hasVoted: !!studentRating
        };
    });
    
    res.json({ teachers: teachersWithRating });
});

// إضافة تصويت (تفضيل) - يضيف تقييم 5 نجوم تلقائياً
app.post('/api/ratings/add', requireAuth, requireRole('student'), (req, res) => {
    const { teacherId } = req.body;
    const studentId = req.session.user.id;
    
    console.log('📥 استلام طلب تفضيل:', { teacherId, studentId });
    
    if (!teacherId) {
        return res.status(400).json({ error: 'معرف الأستاذ مطلوب' });
    }
    
    const users = readData(USERS_FILE);
    const teacher = users.find(u => u.id === parseInt(teacherId) && u.role === 'teacher');
    if (!teacher) {
        return res.status(404).json({ error: 'الأستاذ غير موجود' });
    }
    
    let ratings = readData(RATINGS_FILE);
    
    const existing = ratings.find(r => r.teacherId === parseInt(teacherId) && r.studentId === studentId);
    if (existing) {
        return res.status(400).json({ error: 'لقد قمت بالتصويت لهذا الأستاذ بالفعل' });
    }
    
    const studentRatings = ratings.filter(r => r.studentId === studentId);
    if (studentRatings.length >= 2) {
        return res.status(400).json({ error: 'لقد قمت بالتصويت لأستاذين بالفعل (الحد الأقصى 2)' });
    }
    
    const newRating = {
        id: Date.now(),
        teacherId: parseInt(teacherId),
        studentId: studentId,
        rating: 5,
        createdAt: new Date().toISOString()
    };
    
    ratings.push(newRating);
    
    if (writeData(RATINGS_FILE, ratings)) {
        console.log('✅ تم إضافة التفضيل بنجاح');
        res.json({
            success: true,
            rating: newRating,
            message: 'تم إضافة تفضيلك بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إضافة التفضيل' });
    }
});

// إلغاء التصويت
app.delete('/api/ratings/remove/:teacherId', requireAuth, requireRole('student'), (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const studentId = req.session.user.id;
    
    let ratings = readData(RATINGS_FILE);
    const index = ratings.findIndex(r => r.teacherId === teacherId && r.studentId === studentId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'التصويت غير موجود' });
    }
    
    ratings.splice(index, 1);
    
    if (writeData(RATINGS_FILE, ratings)) {
        res.json({
            success: true,
            message: 'تم إلغاء التصويت بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل إلغاء التصويت' });
    }
});

// الحصول على تصويتات الطالب
app.get('/api/ratings/my-ratings', requireAuth, requireRole('student'), (req, res) => {
    const studentId = req.session.user.id;
    const ratings = readData(RATINGS_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    
    const studentRatings = ratings.filter(r => r.studentId === studentId);
    
    const ratingsWithDetails = studentRatings.map(r => {
        const teacher = users.find(u => u.id === r.teacherId);
        const profile = teacher ? profiles.find(p => p.userId === teacher.id) : null;
        return {
            ...r,
            teacherName: profile?.fullName || teacher?.username || 'غير معروف',
            teacherSubject: teacher?.subject || profile?.subject || 'غير محدد'
        };
    });
    
    res.json({ ratings: ratingsWithDetails });
});

// ============================
// لوحة الشرف المتقدم - معالجة التعادل
// ============================
app.get('/api/leaderboard', requireAuth, (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const ratings = readData(RATINGS_FILE);
    
    const teachers = users.filter(u => u.role === 'teacher');
    
    // إذا لم يكن هناك أساتذة
    if (teachers.length === 0) {
        return res.json({
            leaderboard: [],
            topTeacher: null,
            topTeachers: [],
            totalTeachers: 0,
            hasTie: false,
            maxVotes: 0
        });
    }
    
    const teachersWithVotes = teachers.map(teacher => {
        const profile = profiles.find(p => p.userId === teacher.id);
        const teacherRatings = ratings.filter(r => r.teacherId === teacher.id);
        const votesCount = teacherRatings.length;
        
        const total = teacherRatings.reduce((sum, r) => sum + r.rating, 0);
        const average = votesCount > 0 ? Math.round((total / votesCount) * 10) / 10 : 0;
        
        return {
            id: teacher.id,
            username: teacher.username,
            fullName: profile?.fullName || teacher.username,
            subject: teacher.subject || profile?.subject || 'غير محدد',
            profileImage: profile?.profileImage || null,
            votesCount: votesCount,
            averageRating: average,
            hasVotes: votesCount > 0
        };
    });
    
    // ترتيب حسب عدد الأصوات (تنازلي)
    const sorted = teachersWithVotes.sort((a, b) => b.votesCount - a.votesCount);
    
    // الحصول على أعلى عدد أصوات
    const maxVotes = sorted.length > 0 ? sorted[0].votesCount : 0;
    
    // الحصول على جميع الأساتذة الذين لديهم أعلى عدد أصوات (مع التعادل)
    const topTeachers = sorted.filter(t => t.votesCount === maxVotes && t.votesCount > 0);
    const hasTie = topTeachers.length > 1;
    
    // بناء القائمة مع المراكز
    let rank = 1;
    const ranked = [];
    let currentVotes = -1;
    let currentRank = 1;
    
    sorted.forEach((teacher, index) => {
        if (teacher.votesCount !== currentVotes) {
            currentRank = index + 1;
            currentVotes = teacher.votesCount;
        }
        
        const isTopTeacher = teacher.votesCount === maxVotes && maxVotes > 0;
        
        ranked.push({
            ...teacher,
            rank: currentRank,
            isTopTeacher: isTopTeacher,
            isTie: hasTie && isTopTeacher && topTeachers.length > 1
        });
    });
    
    // اختيار أول أستاذ كـ topTeacher (للتوافق مع الإصدارات السابقة)
    const topTeacher = topTeachers.length > 0 ? topTeachers[0] : null;
    
    console.log('📊 لوحة الشرف:', {
        totalTeachers: ranked.length,
        topTeachers: topTeachers.length,
        hasTie: hasTie,
        maxVotes: maxVotes,
        topTeachersNames: topTeachers.map(t => t.fullName)
    });
    
    res.json({
        leaderboard: ranked,
        topTeacher: topTeacher,
        topTeachers: topTeachers,
        totalTeachers: ranked.length,
        hasTie: hasTie,
        maxVotes: maxVotes
    });
});
// الحصول على مركز الأستاذ في التصويتات
app.get('/api/teacher/rank/:teacherId', requireAuth, (req, res) => {
    const teacherId = parseInt(req.params.teacherId);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const ratings = readData(RATINGS_FILE);
    
    const teacher = users.find(u => u.id === teacherId && u.role === 'teacher');
    if (!teacher) {
        return res.status(404).json({ error: 'الأستاذ غير موجود' });
    }
    
    const profile = profiles.find(p => p.userId === teacherId);
    
    const teachers = users.filter(u => u.role === 'teacher');
    const teachersWithVotes = teachers.map(t => {
        const teacherRatings = ratings.filter(r => r.teacherId === t.id);
        const votesCount = teacherRatings.length;
        return {
            id: t.id,
            votesCount: votesCount
        };
    });
    
    const sorted = teachersWithVotes.sort((a, b) => b.votesCount - a.votesCount);
    
    let rank = 1;
    let currentVotes = sorted[0]?.votesCount || 0;
    let currentRank = 1;
    
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].votesCount < currentVotes) {
            currentRank = i + 1;
            currentVotes = sorted[i].votesCount;
        }
        if (sorted[i].id === teacherId) {
            rank = currentRank;
            break;
        }
    }
    
    const totalTeachers = sorted.length;
    const teacherVotes = sorted.find(t => t.id === teacherId)?.votesCount || 0;
    const maxVotes = sorted.length > 0 ? sorted[0].votesCount : 0;
    
    res.json({
        teacherId: teacherId,
        fullName: profile?.fullName || teacher.username,
        rank: rank,
        totalTeachers: totalTeachers,
        votesCount: teacherVotes,
        maxVotes: maxVotes,
        hasVotes: teacherVotes > 0
    });
});

// الحصول على جميع مراكز الأساتذة
app.get('/api/teacher/all-ranks', requireAuth, (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const ratings = readData(RATINGS_FILE);
    
    const teachers = users.filter(u => u.role === 'teacher');
    
    const teachersWithVotes = teachers.map(teacher => {
        const profile = profiles.find(p => p.userId === teacher.id);
        const teacherRatings = ratings.filter(r => r.teacherId === teacher.id);
        const votesCount = teacherRatings.length;
        
        return {
            id: teacher.id,
            username: teacher.username,
            fullName: profile?.fullName || teacher.username,
            subject: teacher.subject || profile?.subject || 'غير محدد',
            profileImage: profile?.profileImage || null,
            votesCount: votesCount
        };
    });
    
    const sorted = teachersWithVotes.sort((a, b) => b.votesCount - a.votesCount);
    
    let rank = 1;
    const ranked = sorted.map((teacher, index) => {
        if (index > 0 && teacher.votesCount < sorted[index - 1].votesCount) {
            rank = index + 1;
        }
        return {
            ...teacher,
            rank: rank
        };
    });
    
    res.json({
        teachers: ranked,
        totalTeachers: ranked.length
    });
});

// ============================
// الحصول على جميع مراكز الأساتذة (للملف الشخصي)
// ============================
app.get('/api/teacher/all-ranks', requireAuth, (req, res) => {
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const ratings = readData(RATINGS_FILE);
    
    const teachers = users.filter(u => u.role === 'teacher');
    
    const teachersWithVotes = teachers.map(teacher => {
        const profile = profiles.find(p => p.userId === teacher.id);
        const teacherRatings = ratings.filter(r => r.teacherId === teacher.id);
        const votesCount = teacherRatings.length;
        
        return {
            id: teacher.id,
            username: teacher.username,
            fullName: profile?.fullName || teacher.username,
            subject: teacher.subject || profile?.subject || 'غير محدد',
            profileImage: profile?.profileImage || null,
            votesCount: votesCount
        };
    });
    
    const sorted = teachersWithVotes.sort((a, b) => b.votesCount - a.votesCount);
    
    let rank = 1;
    const ranked = sorted.map((teacher, index) => {
        if (index > 0 && teacher.votesCount < sorted[index - 1].votesCount) {
            rank = index + 1;
        }
        return {
            ...teacher,
            rank: rank
        };
    });
    
    res.json({
        teachers: ranked,
        totalTeachers: ranked.length
    });
});

// ============================
// نظام تقييم الطالب
// ============================
// ============================
// نظام تقييم الطالب (مطور)
// ============================
// ============================
// نظام تقييم الطالب (مطور - يدعم الملاحظات)
// ============================

app.get('/api/student/evaluation/:studentId', requireAuth, (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const exams = readData(EXAMS_FILE);
    const classes = readData(CLASSES_FILE);
    const notes = readData(NOTES_FILE);
    
    const student = users.find(u => u.id === studentId && u.role === 'student');
    if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
    }
    
    const profile = profiles.find(p => p.userId === studentId);
    
    // جلب الصفوف التي يدرسها الطالب
    const studentClasses = classes.filter(c => (c.students || []).includes(studentId));
    const classIds = studentClasses.map(c => c.id);
    
    // جلب الامتحانات الخاصة بالطالب
    const studentExams = exams.filter(e => classIds.includes(e.classId));
    
    // ===== 1. تجميع بيانات الامتحانات =====
    const subjectsData = {};
    const allGrades = [];
    let hasExamData = false;
    
    studentExams.forEach(exam => {
        if (exam.results && exam.results.length > 0) {
            const result = exam.results.find(r => r.studentId === studentId);
            if (result && result.grade !== null && result.grade !== undefined && exam.status === 'completed') {
                const grade = result.grade;
                const subject = exam.subject || 'غير محدد';
                
                if (!subjectsData[subject]) {
                    subjectsData[subject] = {
                        subject: subject,
                        grades: [],
                        exams: [],
                        teacherRatings: [],
                        fromNotes: false
                    };
                }
                
                subjectsData[subject].grades.push(grade);
                subjectsData[subject].exams.push({
                    date: exam.date,
                    grade: grade,
                    status: exam.status,
                    examId: exam.id
                });
                allGrades.push(grade);
                hasExamData = true;
            }
        }
    });
    
    // ===== 2. إذا لم توجد بيانات امتحانات، استخدم الملاحظات =====
    let hasNoteData = false;
    const studentNotes = notes.filter(n => n.studentId === studentId);
    
    if (!hasExamData && studentNotes.length > 0) {
        console.log(`📝 استخدام الملاحظات للتقييم للطالب ${studentId}`);
        
        // تجميع الملاحظات حسب المادة (إذا كانت المادة محددة) أو تحت مادة "عام"
        studentNotes.forEach(note => {
            // محاولة تحديد المادة من الملاحظة (يمكن تحسين هذا)
            // نستخدم subject من الملاحظة إذا وجد، وإلا نضع "عام"
            const subject = note.subject || 'عام';
            
            if (!subjectsData[subject]) {
                subjectsData[subject] = {
                    subject: subject,
                    grades: [],
                    exams: [],
                    teacherRatings: [],
                    fromNotes: true,
                    notes: []
                };
            }
            
            // استخدام متوسط نسبة التفوق والتركيز كتقييم
            const avgRate = Math.round(((note.successRate || 50) + (note.focusRate || 50)) / 2);
            subjectsData[subject].grades.push(avgRate);
            subjectsData[subject].exams.push({
                date: note.createdAt || note.updatedAt || new Date().toISOString(),
                grade: avgRate,
                status: 'completed',
                isNote: true,
                noteText: note.note
            });
            subjectsData[subject].notes.push(note.note);
            allGrades.push(avgRate);
            hasNoteData = true;
        });
    }
    
    // ===== 3. حساب المتوسطات =====
    const subjectsWithAvg = Object.keys(subjectsData).map(subject => {
        const data = subjectsData[subject];
        const avg = data.grades.length > 0 ? Math.round(data.grades.reduce((a, b) => a + b, 0) / data.grades.length) : 0;
        
        let level = 'ضعيف';
        let levelColor = '#ef4444';
        let levelEmoji = '📚';
        if (avg >= 90) { level = 'متفوق'; levelColor = '#10b981'; levelEmoji = '🌟'; }
        else if (avg >= 80) { level = 'جيد جداً'; levelColor = '#34d399'; levelEmoji = '💫'; }
        else if (avg >= 70) { level = 'جيد'; levelColor = '#fbbf24'; levelEmoji = '✅'; }
        else if (avg >= 60) { level = 'مقبول'; levelColor = '#f59e0b'; levelEmoji = '📝'; }
        else { level = 'ضعيف'; levelColor = '#ef4444'; levelEmoji = '⚠️'; }
        
        return {
            ...data,
            average: avg,
            level: level,
            levelColor: levelColor,
            levelEmoji: levelEmoji,
            gradesCount: data.grades.length,
            fromNotes: data.fromNotes || false,
            notes: data.notes || []
        };
    });
    
    // ===== 4. حساب المعدل العام =====
    const overallAverage = allGrades.length > 0 ? Math.round(allGrades.reduce((a, b) => a + b, 0) / allGrades.length) : 0;
    
    let overallLevel = 'ضعيف';
    let overallColor = '#ef4444';
    let overallEmoji = '📚';
    if (overallAverage >= 90) { overallLevel = 'متفوق'; overallColor = '#10b981'; overallEmoji = '🌟'; }
    else if (overallAverage >= 80) { overallLevel = 'جيد جداً'; overallColor = '#34d399'; overallEmoji = '💫'; }
    else if (overallAverage >= 70) { overallLevel = 'جيد'; overallColor = '#fbbf24'; overallEmoji = '✅'; }
    else if (overallAverage >= 60) { overallLevel = 'مقبول'; overallColor = '#f59e0b'; overallEmoji = '📝'; }
    else { overallLevel = 'ضعيف'; overallColor = '#ef4444'; overallEmoji = '⚠️'; }
    
    // ===== 5. إرسال الرد =====
    const hasData = hasExamData || hasNoteData;
    
    res.json({
        student: {
            id: student.id,
            username: student.username,
            fullName: profile?.fullName || student.username,
            profileImage: profile?.profileImage || null
        },
        subjects: subjectsWithAvg,
        overall: {
            average: overallAverage,
            level: overallLevel,
            levelColor: overallColor,
            levelEmoji: overallEmoji,
            totalExams: allGrades.length,
            subjectsCount: subjectsWithAvg.length,
            hasData: hasData,
            fromNotes: hasNoteData && !hasExamData,
            hasExams: hasExamData,
            hasNotes: hasNoteData
        },
        hasData: hasData,
        fromNotes: hasNoteData && !hasExamData,
        notesCount: studentNotes.length
    });
});
app.get('/api/student/subject-details/:studentId/:subject', requireAuth, (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const subject = decodeURIComponent(req.params.subject);
    const exams = readData(EXAMS_FILE);
    const classes = readData(CLASSES_FILE);
    
    const studentClasses = classes.filter(c => (c.students || []).includes(studentId));
    const classIds = studentClasses.map(c => c.id);
    
    const studentExams = exams.filter(e => classIds.includes(e.classId) && e.subject === subject);
    const sortedExams = studentExams.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const gradesData = [];
    sortedExams.forEach(exam => {
        const result = (exam.results || []).find(r => r.studentId === studentId);
        if (result && result.grade !== null && result.grade !== undefined) {
            gradesData.push({
                date: exam.date,
                grade: result.grade,
                examId: exam.id,
                status: exam.status
            });
        }
    });
    
    const grades = gradesData.map(g => g.grade);
    const average = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
    
    res.json({
        subject: subject,
        gradesData: gradesData,
        average: average,
        totalExams: gradesData.length
    });
});

// ============================
// دوال ملاحظات الطلاب
// ============================

app.post('/api/teacher/student-note', requireAuth, requireRole('teacher'), (req, res) => {
    const { studentId, note, focusRate, successRate } = req.body;
    const teacherId = req.session.user.id;
    
    if (!studentId || !note) {
        return res.status(400).json({ error: 'معرف الطالب والملاحظة مطلوبان' });
    }
    
    let notes = readData(NOTES_FILE);
    const existingIndex = notes.findIndex(n => n.studentId === parseInt(studentId) && n.teacherId === teacherId);
    
    const noteData = {
        studentId: parseInt(studentId),
        teacherId: teacherId,
        note: note,
        focusRate: focusRate || 50,
        successRate: successRate || 50,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
        notes[existingIndex] = { ...notes[existingIndex], ...noteData };
    } else {
        notes.push(noteData);
    }
    
    if (writeData(NOTES_FILE, notes)) {
        res.json({
            success: true,
            note: noteData,
            message: 'تم حفظ الملاحظة بنجاح'
        });
    } else {
        res.status(500).json({ error: 'فشل حفظ الملاحظة' });
    }
});

app.get('/api/student/notes/:studentId', requireAuth, (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const notes = readData(NOTES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    
    const studentNotes = notes.filter(n => n.studentId === studentId);
    
    const notesWithDetails = studentNotes.map(n => {
        const teacher = users.find(u => u.id === n.teacherId);
        const teacherProfile = teacher ? profiles.find(p => p.userId === teacher.id) : null;
        return {
            ...n,
            teacherName: teacherProfile?.fullName || teacher?.username || 'غير معروف'
        };
    });
    
    res.json({ notes: notesWithDetails });
});

app.get('/api/teacher/students-notes/:classId', requireAuth, requireRole('teacher'), (req, res) => {
    const classId = parseInt(req.params.classId);
    const teacherId = req.session.user.id;
    const notes = readData(NOTES_FILE);
    const users = readData(USERS_FILE);
    const profiles = readData(PROFILES_FILE);
    const classes = readData(CLASSES_FILE);
    
    const classData = classes.find(c => c.id === classId);
    if (!classData || !classData.teacherIds || !classData.teacherIds.includes(teacherId)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية على هذا الصف' });
    }
    
    const students = classData.students || [];
    const studentsWithNotes = students.map(studentId => {
        const user = users.find(u => u.id === studentId);
        const profile = profiles.find(p => p.userId === studentId);
        const studentNotes = notes.filter(n => n.studentId === studentId);
        const latestNote = studentNotes.length > 0 ? studentNotes[studentNotes.length - 1] : null;
        
        return {
            id: user?.id,
            username: user?.username,
            fullName: profile?.fullName || user?.username,
            profileImage: profile?.profileImage || null,
            note: latestNote?.note || null,
            focusRate: latestNote?.focusRate || null,
            successRate: latestNote?.successRate || null,
            hasNote: !!latestNote,
            notesCount: studentNotes.length
        };
    });
    
    res.json({ students: studentsWithNotes, className: classData.className });
});

// ============================
// الصفحات
// ============================
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        const rolePages = {
            admin: '/pages/admin.html',
            teacher: '/pages/teacher.html',
            student: '/pages/student.html'
        };
        return res.redirect(rolePages[req.session.user.role] || '/pages/student.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    if (req.session && req.session.user) {
        const rolePages = {
            admin: '/pages/admin.html',
            teacher: '/pages/teacher.html',
            student: '/pages/student.html'
        };
        return res.redirect(rolePages[req.session.user.role] || '/pages/student.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/pages/admin.html', (req, res) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
});

app.get('/pages/teacher.html', (req, res) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'teacher') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'pages', 'teacher.html'));
});

app.get('/pages/student.html', (req, res) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'student') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'pages', 'student.html'));
});

// ============================
// معالجة الأخطاء
// ============================
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت' });
        }
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({
        error: 'حدث خطأ في السيرفر',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================
// تشغيل السيرفر
// ============================
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 السيرفر يعمل على:', `http://localhost:${PORT}`);
    console.log('========================================');
    console.log('👤 بيانات الدخول:');
    console.log('   اسم المستخدم: admin');
    console.log('   كلمة المرور: admin123');
    console.log('   الدور: مدير');
    console.log('========================================');

    initializeFiles();
    migrateOldData();

    console.log('✅ النظام جاهز للاستخدام!');
    console.log('✅ دعم تعيين عدة أساتذة على نفس الصف');
    console.log('✅ نظام الغيابات مفعل');
    console.log('✅ نظام الامتحانات مفعل');
    console.log('✅ نظام التصويت ولوحة الشرف مفعل');
    console.log('✅ نظام ملاحظات الطلاب مفعل');
    console.log('✅ نظام تقييم الطلاب مفعل');
    console.log('========================================');
});

process.on('SIGINT', () => {
    console.log('\n🛑 إيقاف السيرفر...');
    process.exit(0);
});

module.exports = app;