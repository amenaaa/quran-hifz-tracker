const mongoose = require("mongoose");

const memorizedPageSchema = new mongoose.Schema({
    pageNumber: { type: Number, required: true, min: 1, max: 604 },
    isMemorized: { type: Boolean, default: false },
    memorizedDate: Date,
    juzNumber: Number,
    surahNumber: Number
});

const memorizedSurahSchema = new mongoose.Schema({
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    surahName: String,
    isMemorized: { type: Boolean, default: false },
    memorizedDate: Date,
    juzNumber: Number,
    startPage: Number,
    endPage: Number
});

const memorizedJuzSchema = new mongoose.Schema({
    juzNumber: { type: Number, required: true, min: 1, max: 30 },
    isMemorized: { type: Boolean, default: false },
    memorizedDate: Date,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startPage: Number,
    endPage: Number
});

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    halaqa: { type: mongoose.Schema.Types.ObjectId, ref: "Halaqa" },
    
    memorization: {
        pages: [memorizedPageSchema],
        surahs: [memorizedSurahSchema],
        juzs: [memorizedJuzSchema],
        
        totalPagesMemorized: { type: Number, default: 0 },
        totalSurahsMemorized: { type: Number, default: 0 },
        totalJuzsMemorized: { type: Number, default: 0 },
        overallProgress: { type: Number, default: 0, min: 0, max: 100 }
    },
    
    khatmDate: String,
    startDate: { type: Date, default: Date.now },
    lastActivityDate: { type: Date, default: Date.now },
    
    teacherNotes: [{
        note: String,
        date: { type: Date, default: Date.now },
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    
    createdAt: { type: Date, default: Date.now }
});

studentSchema.methods.calculateProgress = function() {
    if (!this.memorization.pages || this.memorization.pages.length === 0) {
        return 0;
    }
    
    // حساب الصفحات
    const memorizedPagesCount = this.memorization.pages.filter(p => p.isMemorized).length;
    const pagesProgress = (memorizedPagesCount / 604) * 100;
    this.memorization.totalPagesMemorized = memorizedPagesCount;
    this.memorization.overallProgress = Math.round(pagesProgress * 10) / 10;
    
    // حساب السور
    if (this.memorization.surahs) {
        const memorizedSurahsCount = this.memorization.surahs.filter(s => s.isMemorized).length;
        this.memorization.totalSurahsMemorized = memorizedSurahsCount;
    }
    
    // حساب الأجزاء
    if (this.memorization.juzs) {
        const juzMemorized = this.memorization.juzs.filter(j => j.isMemorized).length;
        this.memorization.totalJuzsMemorized = juzMemorized;
    }
    
    return this.memorization.overallProgress;
};

studentSchema.methods.initializeQuran = function() {
    // بيانات السور مع الصفحات
    const quranData = [
        {number:1,name:"الفاتحة",juz:1,startPage:1,endPage:1},
        {number:2,name:"البقرة",juz:1,startPage:2,endPage:49},
        {number:3,name:"آل عمران",juz:3,startPage:50,endPage:76},
        {number:4,name:"النساء",juz:4,startPage:77,endPage:106},
        {number:5,name:"المائدة",juz:6,startPage:106,endPage:127},
        {number:6,name:"الأنعام",juz:7,startPage:128,endPage:150},
        {number:7,name:"الأعراف",juz:8,startPage:151,endPage:176},
        {number:8,name:"الأنفال",juz:9,startPage:177,endPage:186},
        {number:9,name:"التوبة",juz:10,startPage:187,endPage:207},
        {number:10,name:"يونس",juz:11,startPage:208,endPage:221},
        {number:11,name:"هود",juz:11,startPage:221,endPage:235},
        {number:12,name:"يوسف",juz:12,startPage:235,endPage:248},
        {number:13,name:"الرعد",juz:13,startPage:249,endPage:255},
        {number:14,name:"إبراهيم",juz:13,startPage:255,endPage:261},
        {number:15,name:"الحجر",juz:14,startPage:262,endPage:267},
        {number:16,name:"النحل",juz:14,startPage:267,endPage:281},
        {number:17,name:"الإسراء",juz:15,startPage:282,endPage:293},
        {number:18,name:"الكهف",juz:15,startPage:293,endPage:304},
        {number:19,name:"مريم",juz:16,startPage:305,endPage:311},
        {number:20,name:"طه",juz:16,startPage:312,endPage:321},
        {number:21,name:"الأنبياء",juz:17,startPage:322,endPage:331},
        {number:22,name:"الحج",juz:17,startPage:332,endPage:341},
        {number:23,name:"المؤمنون",juz:18,startPage:342,endPage:349},
        {number:24,name:"النور",juz:18,startPage:350,endPage:359},
        {number:25,name:"الفرقان",juz:18,startPage:359,endPage:366},
        {number:26,name:"الشعراء",juz:19,startPage:367,endPage:376},
        {number:27,name:"النمل",juz:19,startPage:377,endPage:385},
        {number:28,name:"القصص",juz:20,startPage:385,endPage:396},
        {number:29,name:"العنكبوت",juz:20,startPage:396,endPage:404},
        {number:30,name:"الروم",juz:21,startPage:404,endPage:410},
        {number:31,name:"لقمان",juz:21,startPage:411,endPage:414},
        {number:32,name:"السجدة",juz:21,startPage:415,endPage:417},
        {number:33,name:"الأحزاب",juz:21,startPage:418,endPage:427},
        {number:34,name:"سبأ",juz:22,startPage:428,endPage:433},
        {number:35,name:"فاطر",juz:22,startPage:434,endPage:440},
        {number:36,name:"يس",juz:22,startPage:440,endPage:445},
        {number:37,name:"الصافات",juz:23,startPage:446,endPage:452},
        {number:38,name:"ص",juz:23,startPage:453,endPage:458},
        {number:39,name:"الزمر",juz:23,startPage:458,endPage:467},
        {number:40,name:"غافر",juz:24,startPage:467,endPage:476},
        {number:41,name:"فصلت",juz:24,startPage:477,endPage:482},
        {number:42,name:"الشورى",juz:24,startPage:483,endPage:489},
        {number:43,name:"الزخرف",juz:25,startPage:489,endPage:496},
        {number:44,name:"الدخان",juz:25,startPage:496,endPage:498},
        {number:45,name:"الجاثية",juz:25,startPage:499,endPage:502},
        {number:46,name:"الأحقاف",juz:26,startPage:502,endPage:507},
        {number:47,name:"محمد",juz:26,startPage:507,endPage:510},
        {number:48,name:"الفتح",juz:26,startPage:511,endPage:515},
        {number:49,name:"الحجرات",juz:26,startPage:515,endPage:517},
        {number:50,name:"ق",juz:26,startPage:518,endPage:520},
        {number:51,name:"الذاريات",juz:26,startPage:520,endPage:523},
        {number:52,name:"الطور",juz:27,startPage:523,endPage:525},
        {number:53,name:"النجم",juz:27,startPage:526,endPage:528},
        {number:54,name:"القمر",juz:27,startPage:528,endPage:531},
        {number:55,name:"الرحمن",juz:27,startPage:531,endPage:534},
        {number:56,name:"الواقعة",juz:27,startPage:534,endPage:537},
        {number:57,name:"الحديد",juz:27,startPage:537,endPage:541},
        {number:58,name:"المجادلة",juz:28,startPage:542,endPage:545},
        {number:59,name:"الحشر",juz:28,startPage:545,endPage:548},
        {number:60,name:"الممتحنة",juz:28,startPage:549,endPage:551},
        {number:61,name:"الصف",juz:28,startPage:551,endPage:553},
        {number:62,name:"الجمعة",juz:28,startPage:553,endPage:554},
        {number:63,name:"المنافقون",juz:28,startPage:554,endPage:556},
        {number:64,name:"التغابن",juz:28,startPage:556,endPage:558},
        {number:65,name:"الطلاق",juz:28,startPage:558,endPage:560},
        {number:66,name:"التحريم",juz:28,startPage:560,endPage:562},
        {number:67,name:"الملك",juz:29,startPage:562,endPage:564},
        {number:68,name:"القلم",juz:29,startPage:564,endPage:566},
        {number:69,name:"الحاقة",juz:29,startPage:566,endPage:568},
        {number:70,name:"المعارج",juz:29,startPage:568,endPage:570},
        {number:71,name:"نوح",juz:29,startPage:570,endPage:571},
        {number:72,name:"الجن",juz:29,startPage:572,endPage:573},
        {number:73,name:"المزمل",juz:29,startPage:574,endPage:575},
        {number:74,name:"المدثر",juz:29,startPage:575,endPage:577},
        {number:75,name:"القيامة",juz:29,startPage:577,endPage:578},
        {number:76,name:"الإنسان",juz:29,startPage:578,endPage:580},
        {number:77,name:"المرسلات",juz:29,startPage:580,endPage:581},
        {number:78,name:"النبأ",juz:30,startPage:582,endPage:583},
        {number:79,name:"النازعات",juz:30,startPage:583,endPage:584},
        {number:80,name:"عبس",juz:30,startPage:585,endPage:586},
        {number:81,name:"التكوير",juz:30,startPage:586,endPage:587},
        {number:82,name:"الانفطار",juz:30,startPage:587,endPage:587},
        {number:83,name:"المطففين",juz:30,startPage:587,endPage:589},
        {number:84,name:"الانشقاق",juz:30,startPage:589,endPage:590},
        {number:85,name:"البروج",juz:30,startPage:590,endPage:591},
        {number:86,name:"الطارق",juz:30,startPage:591,endPage:591},
        {number:87,name:"الأعلى",juz:30,startPage:591,endPage:592},
        {number:88,name:"الغاشية",juz:30,startPage:592,endPage:592},
        {number:89,name:"الفجر",juz:30,startPage:593,endPage:594},
        {number:90,name:"البلد",juz:30,startPage:594,endPage:595},
        {number:91,name:"الشمس",juz:30,startPage:595,endPage:595},
        {number:92,name:"الليل",juz:30,startPage:595,endPage:596},
        {number:93,name:"الضحى",juz:30,startPage:596,endPage:596},
        {number:94,name:"الشرح",juz:30,startPage:596,endPage:596},
        {number:95,name:"التين",juz:30,startPage:597,endPage:597},
        {number:96,name:"العلق",juz:30,startPage:597,endPage:597},
        {number:97,name:"القدر",juz:30,startPage:598,endPage:598},
        {number:98,name:"البينة",juz:30,startPage:598,endPage:599},
        {number:99,name:"الزلزلة",juz:30,startPage:599,endPage:599},
        {number:100,name:"العاديات",juz:30,startPage:599,endPage:600},
        {number:101,name:"القارعة",juz:30,startPage:600,endPage:600},
        {number:102,name:"التكاثر",juz:30,startPage:600,endPage:600},
        {number:103,name:"العصر",juz:30,startPage:601,endPage:601},
        {number:104,name:"الهمزة",juz:30,startPage:601,endPage:601},
        {number:105,name:"الفيل",juz:30,startPage:601,endPage:601},
        {number:106,name:"قريش",juz:30,startPage:602,endPage:602},
        {number:107,name:"الماعون",juz:30,startPage:602,endPage:602},
        {number:108,name:"الكوثر",juz:30,startPage:602,endPage:602},
        {number:109,name:"الكافرون",juz:30,startPage:603,endPage:603},
        {number:110,name:"النصر",juz:30,startPage:603,endPage:603},
        {number:111,name:"المسد",juz:30,startPage:603,endPage:603},
        {number:112,name:"الإخلاص",juz:30,startPage:604,endPage:604},
        {number:113,name:"الفلق",juz:30,startPage:604,endPage:604},
        {number:114,name:"الناس",juz:30,startPage:604,endPage:604}
    ];
    
    // تهيئة السور
    this.memorization.surahs = quranData.map(s => ({
        surahNumber: s.number,
        surahName: s.name,
        juzNumber: s.juz,
        startPage: s.startPage,
        endPage: s.endPage,
        isMemorized: false
    }));
    
    // تهيئة الصفحات (604 صفحة)
    this.memorization.pages = [];
    for (let i = 1; i <= 604; i++) {
        const surah = quranData.find(s => i >= s.startPage && i <= s.endPage);
        this.memorization.pages.push({
            pageNumber: i,
            juzNumber: surah ? surah.juz : 1,
            surahNumber: surah ? surah.number : 1,
            isMemorized: false
        });
    }
    
    // تهيئة الأجزاء (30 جزء مع الصفحات)
    const juzPages = [
        {juz:1,start:1,end:21},{juz:2,start:22,end:41},{juz:3,start:42,end:61},
        {juz:4,start:62,end:81},{juz:5,start:82,end:101},{juz:6,start:102,end:121},
        {juz:7,start:122,end:141},{juz:8,start:142,end:161},{juz:9,start:162,end:181},
        {juz:10,start:182,end:201},{juz:11,start:202,end:221},{juz:12,start:222,end:241},
        {juz:13,start:242,end:261},{juz:14,start:262,end:281},{juz:15,start:282,end:301},
        {juz:16,start:302,end:321},{juz:17,start:322,end:341},{juz:18,start:342,end:361},
        {juz:19,start:362,end:381},{juz:20,start:382,end:401},{juz:21,start:402,end:421},
        {juz:22,start:422,end:441},{juz:23,start:442,end:461},{juz:24,start:462,end:481},
        {juz:25,start:482,end:501},{juz:26,start:502,end:521},{juz:27,start:522,end:541},
        {juz:28,start:542,end:561},{juz:29,start:562,end:581},{juz:30,start:582,end:604}
    ];
    
    this.memorization.juzs = juzPages.map(j => ({
        juzNumber: j.juz,
        startPage: j.start,
        endPage: j.end,
        isMemorized: false,
        progress: 0
    }));
    
    this.memorization.totalPagesMemorized = 0;
    this.memorization.totalSurahsMemorized = 0;
    this.memorization.totalJuzsMemorized = 0;
    this.memorization.overallProgress = 0;
};

module.exports = mongoose.model("Student", studentSchema);