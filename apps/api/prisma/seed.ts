/**
 * Shohoz Skill — database seed.
 * Creates a demo admin + teacher + student, a course with curriculum,
 * an exam package with topics/questions, a book and a blog post.
 * Run: `npm run db:seed` (uses prisma/seed.ts via tsx).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Users ───────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+8801700000001' },
    update: {},
    create: {
      name: 'Platform Admin',
      phone: '+8801700000001',
      email: 'admin@shohozskill.com',
      role: 'SUPER_ADMIN',
      verified: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { phone: '+8801700000002' },
    update: {},
    create: {
      name: 'Mahmudul Hasan',
      nameBn: 'মাহমুদুল হাসান',
      phone: '+8801700000002',
      email: 'mahmud@shohozskill.com',
      role: 'TEACHER',
      verified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { phone: '+8801712345678' },
    update: {},
    create: {
      name: 'Rahim Uddin',
      nameBn: 'রহিম উদ্দিন',
      phone: '+8801712345678',
      email: 'rahim@example.com',
      role: 'STUDENT',
      verified: true,
    },
  });

  // ── Instructor + course ─────────────────────────────────────────────────
  const instructor = await prisma.instructor.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      name: teacher.name,
      nameBn: teacher.nameBn,
      title: 'Senior Faculty, BCS & Bank',
      bio: 'Cleared BCS twice; authored 6 bestselling job-prep books.',
      verified: true,
      rating: 4.9,
      students: 36500,
      courses: 6,
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: 'bcs-preliminary-complete-course' },
    update: {},
    create: {
      slug: 'bcs-preliminary-complete-course',
      title: 'BCS Preliminary Complete Course',
      titleBn: 'বিসিএস প্রিলিমিনারি সম্পূর্ণ কোর্স',
      tagline: 'All 12 subjects, 400+ lessons, 15,000+ MCQs.',
      description: 'The complete BCS Preliminary course — syllabus, mock tests and revision plans.',
      category: 'BCS',
      categoryBn: 'বিসিএস',
      level: 'All Levels',
      durationLabel: '6 months · self-paced',
      totalHours: 86,
      lectures: 420,
      quizzes: 240,
      articles: 0,
      resources: 60,
      students: 18400,
      rating: 4.8,
      reviewCount: 2140,
      certificate: true,
      featured: true,
      published: true,
      instructorId: instructor.id,
      curriculum: {
        create: [
          {
            title: 'Bangla',
            sortOrder: 0,
            lessons: {
              create: [
                { title: 'ব্যাকরণ ও প্রয়োগ', durationMinutes: 18, sourceKind: 'youtube', sourceId: 'M7lc1UVf-VE', preview: true, sortOrder: 0 },
                { title: 'সাহিত্য ও রচনা', durationMinutes: 22, sourceKind: 'youtube', sourceId: 'u31qwQUeiaM', sortOrder: 1 },
              ],
            },
          },
          {
            title: 'English',
            sortOrder: 1,
            lessons: {
              create: [
                { title: 'Grammar Essentials', durationMinutes: 20, sourceKind: 'youtube', sourceId: '9bZkp7q19f0', preview: true, sortOrder: 0 },
                { title: 'Comprehension & Vocabulary', durationMinutes: 24, sourceKind: 'direct', sourceId: 'https://vz-video.example/v1/ntrca-bn-2/index.m3u8', sortOrder: 1 },
              ],
            },
          },
        ],
      },
      prices: {
        create: [
          { duration: '1_MONTH', amount: 1990 },
          { duration: '3_MONTHS', amount: 3990 },
          { duration: '6_MONTHS', amount: 4590 },
          { duration: 'LIFETIME', amount: 4990, originalAmount: 6990 },
        ],
      },
    },
  });

  // ── Exam package with questions ─────────────────────────────────────────
  const exam = await prisma.exam.upsert({
    where: { slug: 'ntrca-exam-package' },
    update: {},
    create: {
      slug: 'ntrca-exam-package',
      title: 'NTRCA Exam Package',
      titleBn: 'এনটিআরসিএ এক্সাম প্যাকেজ',
      tagline: '৪টি বিষয়, ৮টি টপিক-ভিত্তিক পরীক্ষা',
      description: 'Complete NTRCA MCQ package with topic-wise exams and realistic negative marking.',
      examType: 'package',
      difficulty: 'Medium',
      isFree: false,
      priceAmount: 1499,
      priceOriginalAmount: 1999,
      questionsCount: 240,
      totalMarks: 240,
      negativeMarking: true,
      defaultNegativeMarks: 0.25,
      marksPerQuestion: 1,
      passRate: 61,
      avgScore: 128,
      rating: 4.8,
      featured: true,
      published: true,
      subjects: {
        create: [
          {
            title: 'Bangla (বাংলা)',
            sortOrder: 0,
            topics: {
              create: [
                {
                  title: 'ব্যাকরণ ও প্রয়োগ',
                  slug: 'bangla-topic-0',
                  questionsCount: 2,
                  durationMinutes: 15,
                  negativeMarks: 0.25,
                  sortOrder: 0,
                  questions: {
                    create: [
                      { text: 'বাংলা বর্ণমালায় স্বরবর্ণ কয়টি?', options: ['১১টি', '১০টি', '১২টি', '৯টি'], answerIndex: 0, explanation: 'বাংলা স্বরবর্ণ ১১টি।' },
                      { text: 'কোনটি সন্ধি?', options: ['হাত-কলম', 'গৃহস্থ', 'বিদ্যালয়', 'নদীরধারা'], answerIndex: 1, explanation: 'গৃহ + স্থ = গৃহস্থ — সন্ধির উদাহরণ।' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'English',
            sortOrder: 1,
            topics: {
              create: [
                {
                  title: 'Grammar Essentials',
                  slug: 'english-topic-0',
                  questionsCount: 2,
                  durationMinutes: 15,
                  negativeMarks: 0.25,
                  sortOrder: 0,
                  questions: {
                    create: [
                      { text: 'Choose the correct form: "He ___ to Dhaka yesterday."', options: ['go', 'goes', 'went', 'gone'], answerIndex: 2, explanation: 'Past time marker "yesterday" → past tense "went".' },
                      { text: 'Select the synonym of "abundant".', options: ['scarce', 'plentiful', 'rare', 'limited'], answerIndex: 1, explanation: 'Abundant = plentiful.' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // ── Book ────────────────────────────────────────────────────────────────
  await prisma.book.upsert({
    where: { slug: 'bcs-preliminary-bangla-guide' },
    update: {},
    create: {
      slug: 'bcs-preliminary-bangla-guide',
      title: 'BCS Preliminary Bangla Guide',
      titleBn: 'বিসিএস প্রিলিমিনারি বাংলা গাইড',
      subtitle: 'ভাষা ও সাহিত্য in one readable volume',
      description: 'Student-friendly Bangla guide with 1500 MCQs and a 30-day revision plan.',
      category: 'BCS',
      author: 'Mahmudul Hasan',
      pages: 560,
      edition: '4th Edition, 2025',
      language: 'Bn',
      publisher: 'Shohoz Skill Publications',
      pdfPrice: 399,
      hardcopyPrice: 550,
      samplePages: 12,
      students: 25300,
      rating: 4.8,
      reviewCount: 2301,
      featured: true,
      published: true,
    },
  });

  // ── Blog ────────────────────────────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: 'bcs-preliminary-study-plan' },
    update: {},
    create: {
      slug: 'bcs-preliminary-study-plan',
      title: 'A 6-Month BCS Preliminary Study Plan That Actually Works',
      excerpt: 'Most aspirants drift for 2 years. This is the 6-month plan our toppers followed.',
      category: 'Study Plan',
      categoryBn: 'স্টাডি প্ল্যান',
      tags: ['BCS', 'preliminary', 'study plan'],
      author: 'Mahmudul Hasan',
      readMinutes: 8,
      content: [
        { type: 'heading', text: 'Why 6 months is the sweet spot' },
        { type: 'paragraph', text: 'Three to six months of focused study beats two years of half-hearted effort.' },
        { type: 'list', ordered: true, items: ['Month 1–2: Bangla + English', 'Month 3: Math shortcuts', 'Month 4: GK Bangladesh Affairs'] },
      ],
      featured: true,
      published: true,
    },
  });

  // ── Sample enrollment + order for the demo student ──────────────────────
  await prisma.enrollment.upsert({
    where: { userId_productType_productId: { userId: student.id, productType: 'course', productId: course.id } },
    update: {},
    create: { userId: student.id, productType: 'course', productId: course.id, accessFrom: new Date() },
  });

  const existingOrder = await prisma.order.findFirst({ where: { userId: student.id } });
  if (!existingOrder) {
    await prisma.order.create({
      data: {
        userId: student.id,
        productType: 'exam',
        productId: exam.id,
        productTitle: 'NTRCA Exam Package',
        amount: 1499,
        method: 'NAGAD',
        status: 'PAID',
        txId: 'NGD-SEED01',
      },
    });
  }

  console.log('Seed complete ✔');
  console.log('  Admin:  +8801700000001');
  console.log('  Teacher:+8801700000002');
  console.log('  Student:+8801712345678');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
