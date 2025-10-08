const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/quran-hifz";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const Halaqa = require("./Halaqa");
const Student = require("./Student");
const User = require("./User");

// ==================== MIDDLEWARE ====================

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ message: "الرجاء تسجيل الدخول" });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(401).json({ message: "المستخدم غير موجود" });

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "جلسة غير صالحة" });
    }
};

const authorizeTeacher = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ message: "هذه الصفحة للمعلمين فقط" });
    }
    next();
};

const authorizeStudent = (req, res, next) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "هذه الصفحة للطلاب فقط" });
    }
    next();
};

// ==================== AUTH ROUTES ====================

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "جميع الحقول مطلوبة" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "البريد الإلكتروني مسجل مسبقاً" });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

        res.status(201).json({
            message: "تم إنشاء الحساب بنجاح",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

        res.json({
            message: "تم تسجيل الدخول بنجاح",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, studentProfile: user.studentProfile }
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== HALAQA ROUTES ====================

app.get("/api/halaqas", authenticate, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === "teacher") {
            query._id = { $in: req.user.managedHalaqas };
        }
        const halaqas = await Halaqa.find(query).populate("students");
        res.json(halaqas);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.post("/api/halaqas", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "اسم الحلقة مطلوب" });

        const newHalaqa = new Halaqa({ name, students: [] });
        const savedHalaqa = await newHalaqa.save();
        
        await User.findByIdAndUpdate(req.user._id, { $push: { managedHalaqas: savedHalaqa._id } });
        
        res.status(201).json(savedHalaqa);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});
// ==================== AUTH ROUTES - UPDATED ====================

// تحديث تسجيل المستخدمين لإضافة username
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "جميع الحقول مطلوبة" });
        }

        // التحقق من وجود البريد الإلكتروني
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "البريد الإلكتروني مسجل مسبقاً" });
        }

        // التحقق من وجود اسم المستخدم إذا تم إدخاله
        if (username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
            }
        }

        const user = new User({ name, username, email, password, role });
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

        res.status(201).json({
            message: "تم إنشاء الحساب بنجاح",
            token,
            user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// تحديث تسجيل الدخول للسماح باستخدام username أو email
app.post("/api/auth/login", async (req, res) => {
    try {
        const { usernameOrEmail, email, password } = req.body;
        
        // للتوافق مع الكود القديم
        const identifier = usernameOrEmail || email;

        if (!identifier || !password) {
            return res.status(400).json({ message: "يرجى إدخال اسم المستخدم/البريد وكلمة المرور" });
        }

        // البحث عن المستخدم باستخدام username أو email
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });

        res.json({
            message: "تم تسجيل الدخول بنجاح",
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                username: user.username,
                email: user.email, 
                role: user.role, 
                studentProfile: user.studentProfile 
            }
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== HALAQA ROUTES - UPDATED ====================

// حذف حلقة
app.delete("/api/halaqas/:id", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const halaqa = await Halaqa.findById(req.params.id);
        
        if (!halaqa) {
            return res.status(404).json({ message: "الحلقة غير موجودة" });
        }

        // التحقق من أن المعلم هو مالك الحلقة
        const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
        if (!teacherHalaqas.includes(req.params.id)) {
            return res.status(403).json({ message: "ليس لديك صلاحية حذف هذه الحلقة" });
        }

        // حذف الحلقة من الطلاب
        await Student.updateMany(
            { halaqa: req.params.id },
            { $unset: { halaqa: "" } }
        );

        // حذف الحلقة من المعلم
        await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { managedHalaqas: req.params.id } }
        );

        // حذف الحلقة
        await Halaqa.findByIdAndDelete(req.params.id);

        res.json({ message: "تم حذف الحلقة بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// تعديل حلقة
app.put("/api/halaqas/:id", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: "اسم الحلقة مطلوب" });
        }

        const halaqa = await Halaqa.findById(req.params.id);
        
        if (!halaqa) {
            return res.status(404).json({ message: "الحلقة غير موجودة" });
        }

        // التحقق من أن المعلم هو مالك الحلقة
        const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
        if (!teacherHalaqas.includes(req.params.id)) {
            return res.status(403).json({ message: "ليس لديك صلاحية تعديل هذه الحلقة" });
        }

        halaqa.name = name;
        await halaqa.save();

        res.json(halaqa);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== STUDENT ROUTES - UPDATED ====================

// حذف طالب
app.delete("/api/students/:id", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: "الطالب غير موجود" });
        }

        // التحقق من أن الطالب في حلقة المعلم
        if (student.halaqa) {
            const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
            if (!teacherHalaqas.includes(student.halaqa.toString())) {
                return res.status(403).json({ message: "ليس لديك صلاحية حذف هذا الطالب" });
            }
        }

        // حذف الطالب من الحلقة
        if (student.halaqa) {
            await Halaqa.findByIdAndUpdate(
                student.halaqa,
                { $pull: { students: req.params.id } }
            );
        }

        // حذف الطالب
        await Student.findByIdAndDelete(req.params.id);

        res.json({ message: "تم حذف الطالب بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// تعديل معلومات الطالب
app.put("/api/students/:id", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { name, age, halaqaId } = req.body;
        
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: "الطالب غير موجود" });
        }

        // التحقق من أن الطالب في حلقة المعلم
        if (student.halaqa) {
            const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
            if (!teacherHalaqas.includes(student.halaqa.toString())) {
                return res.status(403).json({ message: "ليس لديك صلاحية تعديل هذا الطالب" });
            }
        }

        // تحديث الحلقة القديمة إذا تغيرت
        if (halaqaId && halaqaId !== student.halaqa?.toString()) {
            // حذف من الحلقة القديمة
            if (student.halaqa) {
                await Halaqa.findByIdAndUpdate(
                    student.halaqa,
                    { $pull: { students: req.params.id } }
                );
            }
            
            // إضافة للحلقة الجديدة
            await Halaqa.findByIdAndUpdate(
                halaqaId,
                { $addToSet: { students: req.params.id } }
            );
            
            student.halaqa = halaqaId;
        }

        if (name) student.name = name;
        if (age) student.age = age;

        await student.save();

        const populatedStudent = await Student.findById(student._id).populate("halaqa");
        res.json(populatedStudent);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// البحث عن الطلاب
app.get("/api/students/search", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "يرجى إدخال نص للبحث" });
        }

        // الحصول على طلاب المعلم فقط
        const halaqas = await Halaqa.find({ _id: { $in: req.user.managedHalaqas } });
        const studentIds = halaqas.flatMap(h => h.students);

        const students = await Student.find({
            _id: { $in: studentIds },
            name: { $regex: query, $options: 'i' }
        }).populate("halaqa");

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// البحث عن الحلقات
app.get("/api/halaqas/search", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "يرجى إدخال نص للبحث" });
        }

        const halaqas = await Halaqa.find({
            _id: { $in: req.user.managedHalaqas },
            name: { $regex: query, $options: 'i' }
        }).populate("students");

        res.json(halaqas);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});
// ==================== STUDENT ROUTES ====================

app.get("/api/students", authenticate, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === "teacher") {
            const halaqas = await Halaqa.find({ _id: { $in: req.user.managedHalaqas } });
            const studentIds = halaqas.flatMap(h => h.students);
            query._id = { $in: studentIds };
        } else if (req.user.role === "student") {
            query._id = req.user.studentProfile;
        }

        const students = await Student.find(query).populate("halaqa");
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.post("/api/students", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { name, age, halaqaId } = req.body;
        
        if (!name || !age) {
            return res.status(400).json({ message: "الاسم والعمر مطلوبان" });
        }

        const newStudent = new Student({ name, age, halaqa: halaqaId || null });
        newStudent.initializeQuran();
        
        const savedStudent = await newStudent.save();

        if (halaqaId) {
            await Halaqa.findByIdAndUpdate(halaqaId, { $push: { students: savedStudent._id } });
        }

        const populatedStudent = await Student.findById(savedStudent._id).populate("halaqa");
        res.status(201).json(populatedStudent);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== STUDENT PROFILE ====================

app.get("/api/students/my-profile", authenticate, authorizeStudent, async (req, res) => {
    try {
        let student = await Student.findOne({ _id: req.user.studentProfile }).populate("halaqa");
        
        if (!student) {
            student = new Student({ name: req.user.name, age: 18 });
            student.initializeQuran();
            await student.save();
            
            await User.findByIdAndUpdate(req.user._id, { studentProfile: student._id });
        }
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.post("/api/students/initialize-quran", authenticate, authorizeStudent, async (req, res) => {
    try {
        let student = await Student.findById(req.user.studentProfile);
        
        if (!student) {
            student = new Student({ name: req.user.name, age: 18 });
        }
        
        student.initializeQuran();
        await student.save();
        
        if (!req.user.studentProfile) {
            await User.findByIdAndUpdate(req.user._id, { studentProfile: student._id });
        }
        
        res.json({ message: "تم تهيئة القرآن بنجاح", student });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.put("/api/students/toggle-surah/:surahNumber", authenticate, authorizeStudent, async (req, res) => {
    try {
        const { surahNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(req.user.studentProfile);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const surahIndex = student.memorization.surahs.findIndex(s => s.surahNumber === parseInt(surahNumber));
        if (surahIndex === -1) return res.status(404).json({ message: "السورة غير موجودة" });
        
        student.memorization.surahs[surahIndex].isMemorized = isMemorized;
        if (isMemorized) {
            student.memorization.surahs[surahIndex].memorizedDate = new Date();
        }
        
        student.calculateProgress();
        
        const juzNumber = student.memorization.surahs[surahIndex].juzNumber;
        updateJuzProgress(student, juzNumber);
        
        await student.save();
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

function updateJuzProgress(student, juzNumber) {
    const juzSurahs = student.memorization.surahs.filter(s => s.juzNumber === juzNumber);
    const memorizedCount = juzSurahs.filter(s => s.isMemorized).length;
    const progress = Math.round((memorizedCount / juzSurahs.length) * 100);
    
    const juzIndex = student.memorization.juzs.findIndex(j => j.juzNumber === juzNumber);
    if (juzIndex !== -1) {
        student.memorization.juzs[juzIndex].progress = progress;
        student.memorization.juzs[juzIndex].isMemorized = progress === 100;
        if (progress === 100) {
            student.memorization.juzs[juzIndex].memorizedDate = new Date();
        }
    }
}

// ==================== TEACHER VIEWS STUDENT ====================

app.get("/api/students/:id/memorization", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate("halaqa");
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        res.json({
            student: { id: student._id, name: student.name, age: student.age, halaqa: student.halaqa },
            memorization: student.memorization
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

app.put("/api/students/:id/surah/:surahNumber", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { id, surahNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const surahIndex = student.memorization.surahs.findIndex(s => s.surahNumber === parseInt(surahNumber));
        if (surahIndex === -1) return res.status(404).json({ message: "السورة غير موجودة" });
        
        student.memorization.surahs[surahIndex].isMemorized = isMemorized;
        if (isMemorized) {
            student.memorization.surahs[surahIndex].memorizedDate = new Date();
        }
        
        student.calculateProgress();
        
        const juzNumber = student.memorization.surahs[surahIndex].juzNumber;
        updateJuzProgress(student, juzNumber);
        
        await student.save();
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== STATISTICS ====================

app.get("/api/statistics", authenticate, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === "teacher") {
            const halaqas = await Halaqa.find({ _id: { $in: req.user.managedHalaqas } });
            const studentIds = halaqas.flatMap(h => h.students);
            query._id = { $in: studentIds };
        }
        
        const totalStudents = await Student.countDocuments(query);
        const completedHifz = await Student.countDocuments({ ...query, 'memorization.totalSurahsMemorized': 114 });
        const totalHalaqas = req.user.role === "teacher" ? req.user.managedHalaqas.length : await Halaqa.countDocuments();
        
        const students = await Student.find(query);
        const averageProgress = students.length > 0
            ? (students.reduce((sum, s) => sum + (s.memorization?.overallProgress || 0), 0) / students.length).toFixed(1)
            : 0;

        res.json({ totalStudents, completedHifz, totalHalaqas, averageProgress: parseFloat(averageProgress) });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== SEED ====================

app.post("/api/seed", async (req, res) => {
    try {
        await Student.deleteMany({});
        await Halaqa.deleteMany({});
        await User.deleteMany({});

        const teacher1 = await User.create({ name: "أحمد المعلم", email: "teacher@example.com", password: "123456", role: "teacher" });
        
        const halaqa1 = await Halaqa.create({ name: "حلقة الفجر", students: [] });
        await User.findByIdAndUpdate(teacher1._id, { managedHalaqas: [halaqa1._id] });

        const student1 = new Student({ name: "محمد أحمد", age: 12, halaqa: halaqa1._id });
        student1.initializeQuran();
        for (let i = 0; i < 10; i++) {
            student1.memorization.surahs[i].isMemorized = true;
        }
        student1.calculateProgress();
        await student1.save();

        const studentUser = await User.create({ name: "عمر خالد", email: "student@example.com", password: "123456", role: "student" });
        
        const student2 = new Student({ name: "عمر خالد", age: 13, halaqa: halaqa1._id });
        student2.initializeQuran();
        for (let i = 0; i < 5; i++) {
            student2.memorization.surahs[i].isMemorized = true;
        }
        student2.calculateProgress();
        await student2.save();

        await User.findByIdAndUpdate(studentUser._id, { studentProfile: student2._id });
        await Halaqa.findByIdAndUpdate(halaqa1._id, { students: [student1._id, student2._id] });

        res.json({ 
            message: "تم تهيئة النظام بنجاح!",
            accounts: {
                teacher: { email: "teacher@example.com", password: "123456" },
                student: { email: "student@example.com", password: "123456" }
            }
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});
// ==================== PAGE ROUTES ====================

// تبديل حالة صفحة (للطالب)
app.put("/api/students/toggle-page/:pageNumber", authenticate, authorizeStudent, async (req, res) => {
    try {
        const { pageNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(req.user.studentProfile);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const pageIndex = student.memorization.pages.findIndex(p => p.pageNumber === parseInt(pageNumber));
        if (pageIndex === -1) return res.status(404).json({ message: "الصفحة غير موجودة" });
        
        student.memorization.pages[pageIndex].isMemorized = isMemorized;
        if (isMemorized) {
            student.memorization.pages[pageIndex].memorizedDate = new Date();
        }
        
        // تحديث تقدم السورة والجزء تلقائياً
        updateSurahFromPages(student, student.memorization.pages[pageIndex].surahNumber);
        updateJuzFromPages(student, student.memorization.pages[pageIndex].juzNumber);
        
        student.calculateProgress();
        await student.save();
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// تبديل جزء كامل (للطالب)
app.put("/api/students/toggle-juz/:juzNumber", authenticate, authorizeStudent, async (req, res) => {
    try {
        const { juzNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(req.user.studentProfile);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        // تحديث كل صفحات الجزء
        student.memorization.pages.forEach(page => {
            if (page.juzNumber === parseInt(juzNumber)) {
                page.isMemorized = isMemorized;
                if (isMemorized) page.memorizedDate = new Date();
            }
        });
        
        // تحديث حالة الجزء
        const juzIndex = student.memorization.juzs.findIndex(j => j.juzNumber === parseInt(juzNumber));
        if (juzIndex !== -1) {
            student.memorization.juzs[juzIndex].isMemorized = isMemorized;
            student.memorization.juzs[juzIndex].progress = isMemorized ? 100 : 0;
            if (isMemorized) student.memorization.juzs[juzIndex].memorizedDate = new Date();
        }
        
        // تحديث السور في هذا الجزء
        const surahsInJuz = [...new Set(student.memorization.pages
            .filter(p => p.juzNumber === parseInt(juzNumber))
            .map(p => p.surahNumber))];
        
        surahsInJuz.forEach(surahNum => {
            updateSurahFromPages(student, surahNum);
        });
        
        student.calculateProgress();
        await student.save();
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// الحصول على صفحات جزء معين
app.get("/api/students/juz/:juzNumber/pages", authenticate, authorizeStudent, async (req, res) => {
    try {
        const { juzNumber } = req.params;
        const student = await Student.findById(req.user.studentProfile);
        
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const juzPages = student.memorization.pages.filter(p => p.juzNumber === parseInt(juzNumber));
        const juzInfo = student.memorization.juzs.find(j => j.juzNumber === parseInt(juzNumber));
        
        res.json({
            juzNumber: parseInt(juzNumber),
            pages: juzPages,
            info: juzInfo,
            memorizedCount: juzPages.filter(p => p.isMemorized).length,
            totalPages: juzPages.length
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// الحصول على صفحات سورة معينة
app.get("/api/students/surah/:surahNumber/pages", authenticate, authorizeStudent, async (req, res) => {
    try {
        const { surahNumber } = req.params;
        const student = await Student.findById(req.user.studentProfile);
        
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const surahPages = student.memorization.pages.filter(p => p.surahNumber === parseInt(surahNumber));
        const surahInfo = student.memorization.surahs.find(s => s.surahNumber === parseInt(surahNumber));
        
        res.json({
            surahNumber: parseInt(surahNumber),
            surahName: surahInfo?.surahName,
            pages: surahPages,
            info: surahInfo,
            memorizedCount: surahPages.filter(p => p.isMemorized).length,
            totalPages: surahPages.length
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== TEACHER UPDATES PAGES ====================

// المعلم يحدث صفحة لطالب
app.put("/api/students/:id/page/:pageNumber", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { id, pageNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        const pageIndex = student.memorization.pages.findIndex(p => p.pageNumber === parseInt(pageNumber));
        if (pageIndex === -1) return res.status(404).json({ message: "الصفحة غير موجودة" });
        
        student.memorization.pages[pageIndex].isMemorized = isMemorized;
        if (isMemorized) {
            student.memorization.pages[pageIndex].memorizedDate = new Date();
        }
        
        updateSurahFromPages(student, student.memorization.pages[pageIndex].surahNumber);
        updateJuzFromPages(student, student.memorization.pages[pageIndex].juzNumber);
        
        student.calculateProgress();
        await student.save();
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// المعلم يحدث جزء كامل لطالب
app.put("/api/students/:id/juz/:juzNumber", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const { id, juzNumber } = req.params;
        const { isMemorized } = req.body;
        
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        student.memorization.pages.forEach(page => {
            if (page.juzNumber === parseInt(juzNumber)) {
                page.isMemorized = isMemorized;
                if (isMemorized) page.memorizedDate = new Date();
            }
        });
        
        const juzIndex = student.memorization.juzs.findIndex(j => j.juzNumber === parseInt(juzNumber));
        if (juzIndex !== -1) {
            student.memorization.juzs[juzIndex].isMemorized = isMemorized;
            student.memorization.juzs[juzIndex].progress = isMemorized ? 100 : 0;
            if (isMemorized) student.memorization.juzs[juzIndex].memorizedDate = new Date();
        }
        
        const surahsInJuz = [...new Set(student.memorization.pages
            .filter(p => p.juzNumber === parseInt(juzNumber))
            .map(p => p.surahNumber))];
        
        surahsInJuz.forEach(surahNum => {
            updateSurahFromPages(student, surahNum);
        });
        
        student.calculateProgress();
        await student.save();
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// المعلم يحصل على صفحات طالب
app.get("/api/students/:id/pages", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "الطالب غير موجود" });
        
        res.json({
            pages: student.memorization.pages,
            totalPages: 604,
            memorizedPages: student.memorization.pages.filter(p => p.isMemorized).length
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ", error: error.message });
    }
});

// ==================== HELPER FUNCTIONS ====================

function updateSurahFromPages(student, surahNumber) {
    const surahPages = student.memorization.pages.filter(p => p.surahNumber === surahNumber);
    const memorizedPages = surahPages.filter(p => p.isMemorized).length;
    const allMemorized = memorizedPages === surahPages.length && surahPages.length > 0;
    
    const surahIndex = student.memorization.surahs.findIndex(s => s.surahNumber === surahNumber);
    if (surahIndex !== -1) {
        student.memorization.surahs[surahIndex].isMemorized = allMemorized;
        if (allMemorized) {
            student.memorization.surahs[surahIndex].memorizedDate = new Date();
        }
    }
}

function updateJuzFromPages(student, juzNumber) {
    const juzPages = student.memorization.pages.filter(p => p.juzNumber === juzNumber);
    const memorizedPages = juzPages.filter(p => p.isMemorized).length;
    const progress = Math.round((memorizedPages / juzPages.length) * 100);
    
    const juzIndex = student.memorization.juzs.findIndex(j => j.juzNumber === juzNumber);
    if (juzIndex !== -1) {
        student.memorization.juzs[juzIndex].progress = progress;
        student.memorization.juzs[juzIndex].isMemorized = progress === 100;
        if (progress === 100) {
            student.memorization.juzs[juzIndex].memorizedDate = new Date();
        }
    }
}
// ==================== TEACHER VIEWS STUDENT - FIXED ====================

app.get("/api/students/:id/memorization", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate("halaqa");
        
        if (!student) {
            return res.status(404).json({ message: "الطالب غير موجود" });
        }
        
        // التحقق من أن المعلم لديه صلاحية الوصول لهذا الطالب
        const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
        const studentHalaqaId = student.halaqa ? student.halaqa._id.toString() : null;
        
        if (!teacherHalaqas.includes(studentHalaqaId) && studentHalaqaId !== null) {
            return res.status(403).json({ message: "ليس لديك صلاحية الوصول لهذا الطالب" });
        }
        
        // التحقق من وجود بيانات الحفظ
        if (!student.memorization || !student.memorization.pages || student.memorization.pages.length === 0) {
            console.log("تهيئة بيانات القرآن للطالب:", student.name);
            student.initializeQuran();
            await student.save();
        }
        
        // التأكد من وجود جميع البيانات المطلوبة
        if (!student.memorization.pages || student.memorization.pages.length === 0) {
            return res.status(500).json({ message: "خطأ في تهيئة بيانات القرآن" });
        }
        
        if (!student.memorization.surahs || student.memorization.surahs.length === 0) {
            return res.status(500).json({ message: "خطأ في تهيئة بيانات السور" });
        }
        
        if (!student.memorization.juzs || student.memorization.juzs.length === 0) {
            return res.status(500).json({ message: "خطأ في تهيئة بيانات الأجزاء" });
        }
        
        res.json({
            student: { 
                id: student._id, 
                name: student.name, 
                age: student.age, 
                halaqa: student.halaqa 
            },
            memorization: {
                pages: student.memorization.pages,
                surahs: student.memorization.surahs,
                juzs: student.memorization.juzs,
                totalPagesMemorized: student.memorization.totalPagesMemorized || 0,
                totalSurahsMemorized: student.memorization.totalSurahsMemorized || 0,
                totalJuzsMemorized: student.memorization.totalJuzsMemorized || 0,
                overallProgress: student.memorization.overallProgress || 0
            }
        });
    } catch (error) {
        console.error("خطأ في تحميل تفاصيل الطالب:", error);
        res.status(500).json({ 
            message: "حدث خطأ في تحميل البيانات", 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ==================== إضافة endpoint لتهيئة بيانات طالب ====================

app.post("/api/students/:id/initialize", authenticate, authorizeTeacher, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        
        if (!student) {
            return res.status(404).json({ message: "الطالب غير موجود" });
        }
        
        // التحقق من صلاحية المعلم
        const teacherHalaqas = req.user.managedHalaqas.map(h => h.toString());
        const studentHalaqaId = student.halaqa ? student.halaqa.toString() : null;
        
        if (!teacherHalaqas.includes(studentHalaqaId) && studentHalaqaId !== null) {
            return res.status(403).json({ message: "ليس لديك صلاحية الوصول لهذا الطالب" });
        }
        
        console.log("تهيئة بيانات القرآن للطالب:", student.name);
        student.initializeQuran();
        student.calculateProgress();
        await student.save();
        
        res.json({ 
            message: "تم تهيئة بيانات القرآن بنجاح",
            student: student
        });
    } catch (error) {
        console.error("خطأ في تهيئة بيانات الطالب:", error);
        res.status(500).json({ 
            message: "حدث خطأ في تهيئة البيانات", 
            error: error.message 
        });
    }
});

// ==================== تحديث قائمة الطلاب - إصلاح ====================

app.get("/api/students", authenticate, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === "teacher") {
            const halaqas = await Halaqa.find({ _id: { $in: req.user.managedHalaqas } });
            const studentIds = halaqas.flatMap(h => h.students);
            query._id = { $in: studentIds };
        } else if (req.user.role === "student") {
            query._id = req.user.studentProfile;
        }

        const students = await Student.find(query).populate("halaqa");
        
        // التأكد من أن جميع الطلاب لديهم بيانات مهيأة
        for (let student of students) {
            if (!student.memorization || !student.memorization.pages || student.memorization.pages.length === 0) {
                console.log("تهيئة بيانات القرآن للطالب:", student.name);
                student.initializeQuran();
                student.calculateProgress();
                await student.save();
            }
        }
        
        res.json(students);
    } catch (error) {
        console.error("خطأ في تحميل قائمة الطلاب:", error);
        res.status(500).json({ 
            message: "حدث خطأ في تحميل البيانات", 
            error: error.message 
        });
    }
});
// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Authentication enabled`);
});
