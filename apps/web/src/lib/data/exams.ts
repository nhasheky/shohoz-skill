import type { Exam, ExamSubject, Question } from "@/lib/types";

const banks: Record<string, Question[]> = {
  bangla: [
    { id: "q1", text: "‘সন্ধি’ শব্দের অর্থ কী?", options: ["মিলন", "বিচ্ছেদ", "পরিবর্তন", "উচ্চারণ"], answerIndex: 0, explanation: "সন্ধি = দুটি বর্ণের মিলন।" },
    { id: "q2", text: "‘নদী’ শব্দের বিপরীত শব্দ কোনটি?", options: ["সাগর", "পাহাড়", "বন", "মাঠ"], answerIndex: 1, explanation: "নদী ও পাহাড় ভৌগোলিক বিপরীত।" },
    { id: "q3", text: "রবীন্দ্রনাথ ঠাকুর কোন সালে নোবেল পান?", options: ["১৯১২", "১৯১৩", "১৯১৪", "১৯২১"], answerIndex: 1, explanation: "১৯১৩ সালে গীতাঞ্জলির জন্য।" },
    { id: "q4", text: "‘অগ্নিবীণা’ কার রচনা?", options: ["জীবনানন্দ দাশ", "কাজী নজরুল ইসলাম", "সুকান্ত ভট্টাচার্য", "শামসুর রাহমান"], answerIndex: 1, explanation: "নজরুলের প্রথম কাব্যগ্রন্থ।" },
    { id: "q5", text: "বাংলা ভাষার উৎস কোনটি?", options: ["দ্রাবিড়", "নিগ্রো-ককেশীয়", "ইন্দো-ইউরোপীয়", "অস্ট্রিক"], answerIndex: 2, explanation: "বাংলা ইন্দো-ইউরোপীয় ভাষা-পরিবারের ইন্দো-আর্য শাখার অন্তর্গত।" },
    { id: "q6", text: "‘পদ্মা নদীর মাঝি’ উপন্যাসের লেখক কে?", options: ["মানিক বন্দ্যোপাধ্যায়", "তারাশঙ্কর বন্দ্যোপাধ্যায়", "বিভূতিভূষণ বন্দ্যোপাধ্যায়", "শরৎচন্দ্র চট্টোপাধ্যায়"], answerIndex: 0, explanation: "মানিক বন্দ্যোপাধ্যায় এই কালজয়ী উপন্যাসটি রচনা করেন।" },
  ],
  english: [
    { id: "q1", text: "Choose the correct sentence.", options: ["He go to school", "He goes to school", "He going to school", "He gone to school"], answerIndex: 1, explanation: "Third-person singular present → goes." },
    { id: "q2", text: "Synonym of ‘abandon’:", options: ["keep", "desert", "hold", "retain"], answerIndex: 1, explanation: "Abandon = desert/leave behind." },
    { id: "q3", text: "The passive of ‘She wrote a letter’ is:", options: ["A letter is written by her", "A letter was written by her", "A letter was writing by her", "A letter were written by her"], answerIndex: 1, explanation: "Past simple → was/were + V3." },
    { id: "q4", text: "Antonym of ‘transparent’:", options: ["clear", "opaque", "bright", "visible"], answerIndex: 1, explanation: "Opaque blocks light — opposite of transparent." },
    { id: "q5", text: "Fill in: “He is good ___ mathematics.”", options: ["in", "at", "on", "for"], answerIndex: 1, explanation: "good at = skilled in." },
    { id: "q6", text: "‘To call it a day’ means:", options: ["to celebrate", "to stop working", "to begin", "to delay"], answerIndex: 1, explanation: "An idiom meaning to stop for the day." },
  ],
  math: [
    { id: "q1", text: "১২, ১৫, ১৮, ২১,... পরবর্তী সংখ্যা কত?", options: ["২২", "২৪", "২৫", "২৭"], answerIndex: 1, explanation: "ধারা: +৩ করে (২১+৩=২৪)।" },
    { id: "q2", text: "৩০% এর ৫০% = কত?", options: ["১৫%", "২০%", "২৫%", "৩৫%"], answerIndex: 0, explanation: "0.30 × 0.50 = 0.15 = ১৫%।" },
    { id: "q3", text: "একটি সংখ্যার ২৫% = ৫০ হলে সংখ্যাটি কত?", options: ["১২৫", "১৫০", "২০০", "২৫০"], answerIndex: 2, explanation: "x × 0.25 = 50 → x = 200।" },
    { id: "q4", text: "বর্গাকার জমির ক্ষেত্রফল ১৪৪ বর্গমিটার; বাহু কত?", options: ["১০ মি", "১২ মি", "১৪ মি", "১৬ মি"], answerIndex: 1, explanation: "√144 = 12 মিটার।" },
    { id: "q5", text: "x + 5 = 12 হলে x = ?", options: ["৫", "৬", "৭", "৮"], answerIndex: 2, explanation: "x = 12 − 5 = 7।" },
    { id: "q6", text: "গড়: ৮, ১২, ১৬, ২০ = ?", options: ["১৩", "১৪", "১৫", "১৬"], answerIndex: 1, explanation: "(৮+১২+১৬+২০)/৪ = ৫৬/৪ = ১৪।" },
  ],
  gk: [
    { id: "q1", text: "বাংলাদেশের স্বাধীনতা ঘোষণা কবে?", options: ["২৫ মার্চ ১৯৭১", "২৬ মার্চ ১৯৭১", "১৬ ডিসেম্বর ১৯৭১", "১৭ এপ্রিল ১৯৭১"], answerIndex: 1, explanation: "২৬ মার্চ ১৯৭১ স্বাধীনতা দিবস।" },
    { id: "q2", text: "জাতিসংঘের সদর দপ্তর কোথায়?", options: ["জেনেভা", "নিউইয়র্ক", "ভিয়েনা", "প্যারিস"], answerIndex: 1, explanation: "New York, USA." },
    { id: "q3", text: "সর্বশেষ আদমশুমারি (২০২২) অনুযায়ী বাংলাদেশের জনসংখ্যা প্রায় কত?", options: ["১৪.৫ কোটি", "১৫.৮ কোটি", "১৬.৯ কোটি", "১৮ কোটি"], answerIndex: 2, explanation: "১৬.৯৮ কোটি (2022 census)।" },
    { id: "q4", text: "SAARC কত সালে প্রতিষ্ঠিত হয়?", options: ["১৯৮৩", "১৯৮৫", "১৯৮৭", "১৯৯১"], answerIndex: 1, explanation: "১৯৮৫ সালে ঢাকায়।" },
    { id: "q5", text: "বাংলাদেশের সংবিধানে কতটি অনুচ্ছেদ আছে?", options: ["১৫৩", "১৬৩", "১৭৩", "১৮০"], answerIndex: 0, explanation: "১৫৩টি অনুচ্ছেদ ও ৪টি তফসিল।" },
    { id: "q6", text: "এশিয়া-প্রশান্ত মহাসাগরীয় অঞ্চলের প্রধান মুসলিম রাষ্ট্র?", options: ["মালয়েশিয়া", "ইন্দোনেশিয়া", "পাকিস্তান", "বাংলাদেশ"], answerIndex: 1, explanation: "ইন্দোনেশিয়া বিশ্বের বৃহত্তম মুসলিম সংখ্যাগরিষ্ঠ দেশ।" },
  ],
  science: [
    { id: "q1", text: "জলের সংকেত কী?", options: ["H2O", "CO2", "O2", "NaCl"], answerIndex: 0, explanation: "জল = H2O।" },
    { id: "q2", text: "মহাকর্ষ বল আবিষ্কার করেন?", options: ["আলবার্ট আইনস্টাইন", "আইজ্যাক নিউটন", "গ্যালিলিও", "আর্কিমিডিস"], answerIndex: 1, explanation: "নিউটন মহাকর্ষ সূত্র দেন।" },
    { id: "q3", text: "লেজারের পূর্ণ রূপ কী?", options: ["Light Arithmetic by Emission", "Light Amplification by Stimulated Emission of Radiation", "Light Acceleration by Energy", "Long Amplified Reliable Emission"], answerIndex: 1, explanation: "Laser = Light Amplification by Stimulated Emission of Radiation." },
    { id: "q4", text: "গাড়ির এয়ারব্যাগে সাধারণত কোন গ্যাস থাকে?", options: ["Oxygen", "Nitrogen", "Helium", "CO2"], answerIndex: 1, explanation: "Nitrogen দ্রুত inflate করে।" },
  ],
  computer: [
    { id: "q1", text: "CPU কী বোঝায়?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processor Unit"], answerIndex: 0, explanation: "CPU = Central Processing Unit।" },
    { id: "q2", text: "১ কিলোবাইট = কত বাইট?", options: ["৮", "১০২৪", "১০০০", "২০৪৮"], answerIndex: 1, explanation: "1 KB = 1024 bytes (binary)।" },
    { id: "q3", text: "HTML-এর পূর্ণ রূপ?", options: ["HyperText Markup Language", "HighText Machine Language", "HyperTransfer Markup Language", "HomeTool Markup Language"], answerIndex: 0, explanation: "HyperText Markup Language।" },
    { id: "q4", text: "আইপি অ্যাড্রেসে সাধারণত কতটি সংখ্যা থাকে (IPv4)?", options: ["৩টি", "৪টি", "৬টি", "৮টি"], answerIndex: 1, explanation: "IPv4: চারটি octet (192.168.0.1)।" },
  ],
};

function buildQuestionSet(subject: string, topicLabel: string, count: number): Question[] {
  const bank = banks[subject] ?? banks.gk;
  const base = topicLabel.charCodeAt(0) * 7 + topicLabel.length;
  return Array.from({ length: count }).map((_, i) => {
    const item = bank[i % bank.length];
    return { ...item, id: `${subject}-${base}-${i}`, explanation: `${item.explanation} (${topicLabel})` };
  });
}

function buildSubject(id: string, title: string, topics: { title: string; questionsCount: number; durationMinutes: number; negative: number }[]): ExamSubject {
  return {
    id,
    title,
    topics: topics.map((t, i) => ({
      id: `${id}-t${i}`,
      title: t.title,
      slug: `${id}-topic-${i}`,
      questionsCount: t.questionsCount,
      durationMinutes: t.durationMinutes,
      marksPerQuestion: 1,
      negativeMarks: t.negative,
      questions: buildQuestionSet(id.split("-")[0], t.title, t.questionsCount),
    })),
  };
}

export const examPackages: Exam[] = [
  {
    id: "exam-pkg-ntrca",
    slug: "ntrca-exam-package",
    title: "NTRCA Exam Package",
    titleBn: "এনটিআরসিএ এক্সাম প্যাকেজ",
    tagline: "৪টি বিষয়, ৮টি টপিক-ভিত্তিক পরীক্ষা — স্কুল ও মাদ্রাসা পর্যায়ের জন্য",
    description:
      "The complete NTRCA MCQ package. Every subject (Bangla, English, Math, GK) is split into topic-wise exams so you can practise weak areas individually, then re-attempt as a full mock. Negative marking follows the official rules.",
    difficulty: "Medium",
    examType: "package",
    price: { amount: 1499, originalAmount: 1999 },
    isFree: false,
    durationMinutes: 0,
    questionsCount: 240,
    totalMarks: 240,
    negativeMarking: true,
    defaultNegativeMarks: 0.25,
    marksPerQuestion: 1,
    attemptCount: 4820,
    passRate: 61,
    avgScore: 128,
    rating: 4.8,
    accessDuration: "LIFETIME",
    subjects: [
      buildSubject("bangla", "Bangla (বাংলা)", [
        { title: "ব্যাকরণ ও প্রয়োগ", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
        { title: "সাহিত্য ও রচনা", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
      ]),
      buildSubject("english", "English (ইংরেজি)", [
        { title: "Grammar Essentials", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
        { title: "Comprehension & Vocabulary", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
      ]),
      buildSubject("math", "Math (গণিত)", [
        { title: "সহজ গণিত ও মানসিক দক্ষতা", questionsCount: 15, durationMinutes: 20, negative: 0.5 },
        { title: "জ্যামিতি ও পরিমিতি", questionsCount: 15, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("gk", "General Knowledge (সাধারণ জ্ঞান)", [
        { title: "বাংলাদেশ বিষয়াবলি", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
        { title: "আন্তর্জাতিক ও কারেন্ট অ্যাফেয়ার্স", questionsCount: 15, durationMinutes: 15, negative: 0.25 },
      ]),
    ],
    featured: true,
    published: true,
    createdAt: "2025-09-10",
    seo: { title: "NTRCA Exam Package — Shohoz Skill", description: "NTRCA MCQ package with Bangla, English, Math & GK topic-wise exams and negative marking simulators." },
  },
  {
    id: "exam-pkg-bcs",
    slug: "bcs-preliminary-exam-package",
    title: "BCS Preliminary Exam Package",
    titleBn: "বিসিএস প্রিলি এক্সাম প্যাকেজ",
    tagline: "৬টি বিষয়ের টপিক-ভিত্তিক ১২টি পরীক্ষা + ফুল মডেল সিমুলেটর",
    description:
      "A full BCS Preliminary MC question lab. Practise by topic, analyse weak spots, then sit the 200-question full simulator under real negative-marking rules and timing pressure.",
    difficulty: "Hard",
    examType: "package",
    price: { amount: 2499, originalAmount: 3499 },
    isFree: false,
    durationMinutes: 0,
    questionsCount: 300,
    totalMarks: 300,
    negativeMarking: true,
    defaultNegativeMarks: 0.5,
    marksPerQuestion: 1,
    attemptCount: 9100,
    passRate: 48,
    avgScore: 141,
    rating: 4.7,
    accessDuration: "LIFETIME",
    subjects: [
      buildSubject("bangla", "Bangla", [
        { title: "ভাষা ও ব্যাকরণ", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
        { title: "সাহিত্য", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("english", "English", [
        { title: "Grammar", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
        { title: "Literary & Vocabulary", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("math", "Math", [
        { title: "Arithmetic", questionsCount: 20, durationMinutes: 25, negative: 0.5 },
        { title: "Algebra & Geometry", questionsCount: 20, durationMinutes: 25, negative: 0.5 },
      ]),
      buildSubject("gk", "General Knowledge", [
        { title: "Bangladesh Affairs", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
        { title: "International Affairs", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("science", "Science", [
        { title: "Physics & Chemistry", questionsCount: 15, durationMinutes: 20, negative: 0.5 },
        { title: "Biology", questionsCount: 15, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("computer", "Computer & IT", [
        { title: "ICT Basics", questionsCount: 15, durationMinutes: 15, negative: 0.5 },
        { title: "AI & Digital Bangladesh", questionsCount: 15, durationMinutes: 15, negative: 0.5 },
      ]),
    ],
    featured: true,
    published: true,
    createdAt: "2025-08-01",
    seo: { title: "BCS Preliminary Exam Package — Shohoz Skill", description: "Topic-wise BCS MCQ tests and a 200-question negative-marking simulator across all 6 subjects." },
  },
  {
    id: "exam-pkg-bank",
    slug: "bank-job-exam-package",
    title: "Bank Job (AD & Assistant) Exam Package",
    titleBn: "ব্যাংক জব এক্সাম প্যাকেজ",
    tagline: "English, Math aptitude ও GK — ব্যাংক প্রশ্নের ধাঁচে",
    description:
      "Bank-level MCQ practice built from past papers of BB, Sonali, Janata, Agrani, Pubali and more. Includes speed-practice mode to boost attempts-per-minute.",
    difficulty: "Medium",
    examType: "package",
    price: { amount: 1999, originalAmount: 2799 },
    isFree: false,
    durationMinutes: 0,
    questionsCount: 180,
    totalMarks: 180,
    negativeMarking: true,
    defaultNegativeMarks: 0.5,
    marksPerQuestion: 1,
    attemptCount: 6100,
    passRate: 57,
    avgScore: 101,
    rating: 4.6,
    accessDuration: "6_MONTHS",
    subjects: [
      buildSubject("english", "English", [
        { title: "Grammar & Correction", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
        { title: "Vocabulary & Idioms", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
      ]),
      buildSubject("math", "Math Aptitude", [
        { title: "Mental Arithmetic", questionsCount: 20, durationMinutes: 25, negative: 1 },
        { title: "Data & Series", questionsCount: 20, durationMinutes: 25, negative: 1 },
      ]),
      buildSubject("gk", "General Knowledge", [
        { title: "Bangladesh Economy", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
        { title: "Banking & Finance", questionsCount: 20, durationMinutes: 20, negative: 0.5 },
      ]),
    ],
    published: true,
    createdAt: "2025-07-25",
    seo: { title: "Bank Job Exam Package — Shohoz Skill", description: "Bank AD & assistant MCQ package with English, aptitude math and banking GK." },
  },
];

const subjectTitles: Record<string, string> = {
  bangla: "Bangla",
  english: "English",
  math: "Math",
  gk: "General Knowledge",
  science: "Science",
  computer: "Computer & IT",
};

const standaloneBases: Record<string, { title: string; titleBn?: string; category: string; subject: string }> = {
  "bcs-bangla-free": { title: "BCS Bangla Free Mini Test", category: "BCS", subject: "bangla" },
  "english-free": { title: "English Grammar Free Test", category: "English", subject: "english" },
  "gk-free": { title: "Current Affairs Free Test", category: "GK", subject: "gk" },
  "math-mental-free": { title: "Mental Ability Free Test", category: "Mental Ability", subject: "math" },
  "ntrca-full-model": { title: "NTRCA School Full Model", titleBn: "এনটিআরসিএ স্কুল ফুল মডেল", category: "NTRCA", subject: "gk" },
  "bank-full-model": { title: "Bank Full Model Test", titleBn: "ব্যাংক ফুল মডেল", category: "Bank", subject: "english" },
};

export const standaloneExams: Exam[] = Object.entries(standaloneBases).map(([slug, b], i) => {
  const free = slug.includes("free");
  const qc = slug.includes("full-model") ? 60 : 10 + (i % 3) * 5;
  const tagline = free
    ? "Free unlimited attempts — no signup needed to preview"
    : `${qc} questions, realistic marking scheme`;
  return {
    id: `exam-${slug}`,
    slug,
    title: b.title,
    titleBn: b.titleBn,
    tagline,
    description:
      free
        ? "A quick, free taste of our exam engine. Attempts are unlimited; sign in to save your result and unlock full analysis."
        : "A full-length model based on the official paper pattern with per-question negative marking and instant answer explanations.",
    difficulty: qc > 50 ? "Hard" : "Medium",
    examType: slug.includes("full-model") ? "subject" : "topic",
    isFree: free,
    price: { amount: free ? 0 : 199, originalAmount: free ? 0 : 349 },
    durationMinutes: qc,
    questionsCount: qc,
    totalMarks: qc,
    negativeMarking: true,
    defaultNegativeMarks: 0.25,
    marksPerQuestion: 1,
    attemptCount: 1500 - i * 120,
    passRate: 55,
    avgScore: Math.round(qc * 0.6),
    rating: Math.min(5, 4.4 + (i % 4) / 10),
    accessDuration: "LIFETIME",
    subjects: [
      buildSubject(b.subject.split(" ")[0], subjectTitles[b.subject.split(" ")[0]] ?? b.subject, [
        { title: b.title.replace(/ (Mini|Full|Free) Test/gi, ""), questionsCount: qc, durationMinutes: qc, negative: 0.25 },
      ]),
    ],
    published: true,
    createdAt: "2025-06-" + String(12 + i).padStart(2, "0"),
    seo: { title: `${b.title} — Shohoz Skill`, description: tagline },
  };
});

export const allExams: Exam[] = [...examPackages, ...standaloneExams];

export function getExamBySlug(slug: string) {
  return allExams.find((e) => e.slug === slug);
}

export function getFreeExams() {
  return standaloneExams.filter((e) => e.isFree);
}

export function getFeaturedExams() {
  return allExams.filter((e) => e.featured);
}

export function getRelatedExams(current: Exam, limit = 3) {
  const pool = allExams.filter((e) => e.id !== current.id);
  const byCat = pool.filter((e) => e.category === current.category);
  const rest = pool.filter((e) => e.category !== current.category);
  return [...byCat, ...rest].slice(0, limit);
}

export function totalQuestionBank() {
  let count = 0;
  const walk = (subjects: ExamSubject[]) => {
    for (const s of subjects) for (const t of s.topics) count += t.questionsCount;
  };
  for (const e of [examPackages, standaloneExams].flat()) walk(e.subjects);
  return count;
}