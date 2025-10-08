// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// API Helper Functions
const api = {
    // Halaqas
    async getHalaqas() {
        try {
            const response = await fetch(`${API_BASE_URL}/halaqas`);
            if (!response.ok) throw new Error('Failed to fetch halaqas');
            return await response.json();
        } catch (error) {
            console.error('Error fetching halaqas:', error);
            throw error;
        }
    },

    async getHalaqa(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/halaqas/${id}`);
            if (!response.ok) throw new Error('Failed to fetch halaqa');
            return await response.json();
        } catch (error) {
            console.error('Error fetching halaqa:', error);
            throw error;
        }
    },

    async createHalaqa(name) {
        try {
            const response = await fetch(`${API_BASE_URL}/halaqas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create halaqa');
            return await response.json();
        } catch (error) {
            console.error('Error creating halaqa:', error);
            throw error;
        }
    },

    async updateHalaqa(id, name) {
        try {
            const response = await fetch(`${API_BASE_URL}/halaqas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to update halaqa');
            return await response.json();
        } catch (error) {
            console.error('Error updating halaqa:', error);
            throw error;
        }
    },

    async deleteHalaqa(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/halaqas/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete halaqa');
            return await response.json();
        } catch (error) {
            console.error('Error deleting halaqa:', error);
            throw error;
        }
    },

    // Students
    async getStudents(halaqaId = null) {
        try {
            const url = halaqaId 
                ? `${API_BASE_URL}/students?halaqaId=${halaqaId}`
                : `${API_BASE_URL}/students`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch students');
            return await response.json();
        } catch (error) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },

    async getStudent(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`);
            if (!response.ok) throw new Error('Failed to fetch student');
            return await response.json();
        } catch (error) {
            console.error('Error fetching student:', error);
            throw error;
        }
    },

    async createStudent(studentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
            if (!response.ok) throw new Error('Failed to create student');
            return await response.json();
        } catch (error) {
            console.error('Error creating student:', error);
            throw error;
        }
    },

    async updateStudent(id, studentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
            if (!response.ok) throw new Error('Failed to update student');
            return await response.json();
        } catch (error) {
            console.error('Error updating student:', error);
            throw error;
        }
    },

    async deleteStudent(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete student');
            return await response.json();
        } catch (error) {
            console.error('Error deleting student:', error);
            throw error;
        }
    },

    // Statistics
    async getStatistics() {
        try {
            const response = await fetch(`${API_BASE_URL}/statistics`);
            if (!response.ok) throw new Error('Failed to fetch statistics');
            return await response.json();
        } catch (error) {
            console.error('Error fetching statistics:', error);
            throw error;
        }
    },

    // Seed Data (for testing)
    async seedDatabase() {
        try {
            const response = await fetch(`${API_BASE_URL}/seed`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error('Failed to seed database');
            return await response.json();
        } catch (error) {
            console.error('Error seeding database:', error);
            throw error;
        }
    }
};

// Export for use in HTML files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
// ✅ تعديل الحفظ الجزئي للسور/الأجزاء
app.patch("/api/students/:id/memorization", authenticate, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).json({ message: "الطالب غير موجود" });
        }

        // صلاحية الطالب لتعديل نفسه فقط
        if (req.user.role === "student") {
            if (!req.user.studentProfile || req.user.studentProfile.toString() !== req.params.id) {
                return res.status(403).json({ message: "لا يمكنك تعديل بيانات طالب آخر" });
            }
        }

        const { surahNumber, juzNumber, isMemorized } = req.body;

        if (surahNumber) {
            const surah = student.memorization.surahs.find(s => s.surahNumber === surahNumber);
            if (surah) {
                surah.isMemorized = isMemorized;
                surah.memorizedDate = isMemorized ? new Date() : null;
            }
        }

        if (juzNumber) {
            const juz = student.memorization.juzs.find(j => j.juzNumber === juzNumber);
            if (juz) {
                juz.isMemorized = isMemorized;
                juz.memorizedDate = isMemorized ? new Date() : null;
            }
        }

        // إعادة حساب التقدم
        student.calculateProgress();

        await student.save();

        res.json({ message: "✅ تم تحديث بيانات الحفظ", student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ أثناء تحديث الحفظ", error: error.message });
    }
});
