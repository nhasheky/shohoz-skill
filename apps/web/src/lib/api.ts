/**
 * Shohoz Skill — frontend API client.
 *
 * Server-side fetches to the NestJS API (`NEXT_PUBLIC_API_URL`).
 * Every call maps the API (Prisma) shape back to the frontend domain types
 * (`@/lib/types`) and, if the API is unreachable or returns an error,
 * gracefully falls back to the mock data layer (`@/lib/data/*`) so the site
 * keeps working during development / without the backend.
 */
import type {
  AppUser,
  BlogPost,
  Book,
  Course,
  Exam,
  Order,
  VideoSource,
} from "@/lib/types";
import { cookies } from "next/headers";
import type { DemoEnrollment } from "@/lib/data/users";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://shohoz-api.onrender.com";

// ─── Low-level request with fallback ──────────────────────────────────────
async function withFallback<T>(
  path: string,
  map: (raw: unknown) => T,
  mock: () => Promise<T>,
): Promise<T> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("shohoz_token")?.value;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/api${path}`, {
      headers,
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return map(await res.json());
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[api] ${path} unavailable → mock fallback (${(err as Error)?.message ?? err})`);
    }
    return mock();
  }
}

// ─── API (Prisma) raw shapes ──────────────────────────────────────────────
type ApiPrice = { id: string; duration: string; amount: number; originalAmount?: number | null };
type ApiLesson = { id: string; title: string; durationMinutes: number; sourceKind: string; sourceId: string; preview: boolean | null };
type ApiSection = { id: string; title: string; sortOrder: number; lessons: ApiLesson[] };
type ApiInstructor = { id: string; name: string; nameBn?: string | null; title: string; bio: string; rating: number; students: number; courses: number; verified: boolean | null };
type ApiCourse = {
  id: string; slug: string; title: string; titleBn?: string | null; tagline: string; description: string;
  category: string; categoryBn?: string | null; level: string; durationLabel: string;
  totalHours: number; lectures: number; quizzes: number; articles: number; resources: number;
  students: number; rating: number; reviewCount: number; certificate: boolean; featured: boolean | null;
  published: boolean; createdAt: string; instructor?: ApiInstructor | null;
  prices: ApiPrice[]; curriculum: ApiSection[];
};
type ApiBook = {
  id: string; slug: string; title: string; titleBn?: string | null; subtitle?: string | null; description: string;
  category: string; author: string; pages: number; edition: string; language: string; publisher: string;
  pdfPrice: number; hardcopyPrice?: number | null; samplePages: number; students: number; rating: number;
  reviewCount: number; featured: boolean | null; published: boolean; createdAt: string;
};
type ApiQuestion = { id: string; text: string; options: string[] | string; answerIndex: number; explanation?: string | null; sortOrder?: number | null };
type ApiTopic = { id: string; title: string; slug: string; questionsCount: number; durationMinutes: number; marksPerQuestion: number; negativeMarks: number; sortOrder: number; questions: ApiQuestion[] };
type ApiSubject = { id: string; title: string; sortOrder: number; topics: ApiTopic[] };
type ApiExam = {
  id: string; slug: string; title: string; titleBn?: string | null; tagline: string; description: string;
  examType: string; difficulty: string; isFree: boolean; priceAmount: number; priceOriginalAmount?: number | null;
  durationMinutes: number; questionsCount: number; totalMarks: number; negativeMarking: boolean;
  defaultNegativeMarks: number; marksPerQuestion: number; attemptCount: number; passRate: number; avgScore: number;
  rating: number; featured: boolean | null; published: boolean; createdAt: string; subjects: ApiSubject[];
};
type ApiBlog = {
  id: string; slug: string; title: string; excerpt: string; category: string; categoryBn?: string | null;
  tags: string[]; author: string; readMinutes: number; content: unknown; featured: boolean | null;
  scheduledFor?: string | null; published: boolean; createdAt: string; updatedAt?: string | null;
};
type ApiDevice = { id: string; deviceName: string; browser?: string | null; os?: string | null; ip?: string | null; lastActive: string; current: boolean | null };
type ApiUser = {
  id: string; name: string; nameBn?: string | null; email?: string | null; phone: string;
  role: string; status: string; joinedAt: string; verified: boolean; devices: ApiDevice[];
};
type ApiOrder = {
  id: string; userId: string; productType: string; productId: string; productTitle: string; amount: number;
  method: string; status: string; txId?: string | null; createdAt: string;
};
type ApiEnrollment = {
  id: string; userId: string; productType: string; productId: string; accessFrom: string;
  accessExpires?: string | null; viaAdmin: boolean | null; createdAt: string;
};
type ApiAttempt = {
  id: string; examId: string; topicId?: string | null; score: number; maxMarks: number; correct: number;
  wrong: number; unanswered: number; passed: boolean; submittedAt: string;
  exam?: { title: string } | null;
};

// ─── Mappers: API → domain ────────────────────────────────────────────────
function seo(title: string, description: string) {
  return { title: `${title} — Shohoz Skill`, description };
}

function mapLessonSource(l: ApiLesson): VideoSource {
  return l.sourceKind === "youtube" ? { type: "youtube", youtubeId: l.sourceId } : { type: "direct", hlsUrl: l.sourceId };
}

function mapCourse(raw: ApiCourse): Course {
  const lessons = raw.curriculum.flatMap((s) => s.lessons);
  const firstYt = lessons.find((l) => l.sourceKind === "youtube");
  const firstDir = lessons.find((l) => l.sourceKind === "direct");
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    tagline: raw.tagline,
    description: raw.description,
    category: raw.category,
    categoryBn: raw.categoryBn ?? undefined,
    level: (raw.level as Course["level"]) ?? "All Levels",
    priceMap: Object.fromEntries(
      raw.prices.map((p) => [p.duration, { amount: p.amount, originalAmount: p.originalAmount ?? undefined }]),
    ),
    durationLabel: raw.durationLabel,
    totalHours: raw.totalHours,
    lectures: raw.lectures,
    quizzes: raw.quizzes,
    articles: raw.articles,
    resources: raw.resources,
    students: raw.students,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    certificate: raw.certificate,
    instructor: raw.instructor
      ? {
          id: raw.instructor.id,
          name: raw.instructor.name,
          nameBn: raw.instructor.nameBn ?? undefined,
          title: raw.instructor.title,
          bio: raw.instructor.bio,
          rating: raw.instructor.rating,
          students: raw.instructor.students,
          courses: raw.instructor.courses,
          verified: raw.instructor.verified ?? false,
        }
      : { id: "unknown", name: "Shohoz Skill Faculty", title: "Faculty", bio: "", rating: 0, students: 0, courses: 0 },
    curriculum: raw.curriculum.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        durationMinutes: l.durationMinutes,
        source: mapLessonSource(l),
        preview: l.preview ?? false,
      })),
    })),
    learningOutcomes: [],
    requirements: [],
    whoIsFor: [],
    faq: [],
    videos: firstYt ? { youtube: firstYt.sourceId } : firstDir ? { direct: firstDir.sourceId } : {},
    published: raw.published,
    featured: raw.featured ?? false,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.tagline),
  };
}

function mapBook(raw: ApiBook): Book {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    subtitle: raw.subtitle ?? "",
    description: raw.description,
    category: raw.category,
    author: {
      id: `author-${raw.slug}`,
      name: raw.author,
      title: "Author",
      bio: "",
    },
    pages: raw.pages,
    edition: raw.edition,
    language: raw.language as Book["language"],
    publisher: raw.publisher,
    pdfPrice: { amount: raw.pdfPrice },
    hardcopyPrice: raw.hardcopyPrice ? { amount: raw.hardcopyPrice } : { amount: raw.pdfPrice },
    tableOfContents: [{ title: "Full contents", pages: `1–${raw.pages}` }],
    samplePages: raw.samplePages,
    students: raw.students,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    published: raw.published,
    featured: raw.featured ?? false,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.subtitle ?? raw.description.slice(0, 120)),
  };
}

function mapExam(raw: ApiExam): Exam {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    tagline: raw.tagline,
    description: raw.description,
    category: undefined,
    difficulty: raw.difficulty as Exam["difficulty"],
    examType: raw.examType as Exam["examType"],
    isFree: raw.isFree,
    price: { amount: raw.priceAmount, originalAmount: raw.priceOriginalAmount ?? undefined },
    durationMinutes: raw.durationMinutes,
    questionsCount: raw.questionsCount,
    totalMarks: raw.totalMarks,
    negativeMarking: raw.negativeMarking,
    defaultNegativeMarks: raw.defaultNegativeMarks,
    marksPerQuestion: raw.marksPerQuestion,
    attemptCount: raw.attemptCount,
    passRate: raw.passRate,
    avgScore: raw.avgScore,
    rating: raw.rating,
    accessDuration: "LIFETIME",
    subjects: raw.subjects.map((s) => ({
      id: s.id,
      title: s.title,
      topics: s.topics.map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        questionsCount: t.questionsCount,
        durationMinutes: t.durationMinutes,
        marksPerQuestion: t.marksPerQuestion,
        negativeMarks: t.negativeMarks,
        questions: t.questions.map((q) => ({
          id: q.id,
          text: q.text,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          answerIndex: q.answerIndex,
          explanation: q.explanation ?? undefined,
        })),
      })),
    })),
    featured: raw.featured ?? false,
    published: raw.published,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.tagline),
  };
}

function mapBlog(raw: ApiBlog): BlogPost {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    content: ((raw.content ?? []) as BlogPost["content"]),
    category: raw.category,
    categoryBn: raw.categoryBn ?? undefined,
    tags: raw.tags ?? [],
    author: { id: `author-${raw.slug}`, name: raw.author, title: "Author" },
    readMinutes: raw.readMinutes,
    featured: raw.featured ?? false,
    published: raw.published,
    scheduledFor: raw.scheduledFor ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? undefined,
    seo: seo(raw.title, raw.excerpt),
  };
}

function mapUser(raw: ApiUser): AppUser {
  return {
    id: raw.id,
    name: raw.name,
    nameBn: raw.nameBn ?? undefined,
    email: raw.email ?? "",
    phone: raw.phone,
    role: raw.role as AppUser["role"],
    status: raw.status as AppUser["status"],
    joinedAt: raw.joinedAt,
    devices: raw.devices.map((d) => ({
      id: d.id,
      deviceName: d.deviceName,
      browser: d.browser ?? "",
      os: d.os ?? "",
      ip: d.ip ?? "",
      lastActive: d.lastActive,
      current: d.current ?? false,
    })),
    verified: raw.verified,
  };
}

function mapOrder(raw: ApiOrder): Order {
  return {
    id: raw.id,
    userId: raw.userId,
    productType: raw.productType as Order["productType"],
    productId: raw.productId,
    productTitle: raw.productTitle,
    amount: raw.amount,
    method: raw.method as Order["method"],
    status: raw.status as Order["status"],
    createdAt: raw.createdAt,
    txId: raw.txId ?? "",
  };
}

function mapEnrollment(raw: ApiEnrollment): DemoEnrollment {
  return {
    id: raw.id,
    productId: raw.productId,
    slug: raw.productId,
    type: raw.productType as DemoEnrollment["type"],
    title: raw.productId,
    progress: 0,
    accessFrom: raw.accessFrom,
    accessExpires: raw.accessExpires ?? undefined,
    viaAdmin: raw.viaAdmin ?? false,
  };
}

function mapAttempt(raw: ApiAttempt): { id: string; examTitle: string; score: number; total: number; negative: number; date: string; durationUsed: number } {
  return {
    id: raw.id,
    examTitle: raw.exam?.title ?? raw.examId,
    score: raw.score,
    total: raw.maxMarks,
    negative: 0.25,
    date: raw.submittedAt,
    durationUsed: 0,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────
export async function getCourses(): Promise<Course[]> {
  return withFallback(
    "/courses",
    (raw) => (raw as ApiCourse[]).map(mapCourse),
    async () => (await import("@/lib/data/courses")).courses,
  );
}

export async function getCourse(slug: string): Promise<Course | undefined> {
  return withFallback(
    `/courses/${slug}`,
    (raw) => mapCourse(raw as ApiCourse),
    async () => (await import("@/lib/data/courses")).getCourseBySlug(slug),
  );
}

export async function getRelatedCourses(current: Course, limit = 3): Promise<Course[]> {
  const all = await getCourses();
  const rest = all.filter((c) => c.id !== current.id);
  const byCat = rest.filter((c) => c.category === current.category);
  return [...byCat, ...rest.filter((c) => c.category !== current.category)].slice(0, limit);
}

export async function getBooks(): Promise<Book[]> {
  return withFallback(
    "/books",
    (raw) => (raw as ApiBook[]).map(mapBook),
    async () => (await import("@/lib/data/books")).books,
  );
}

export async function getBook(slug: string): Promise<Book | undefined> {
  return withFallback(
    `/books/${slug}`,
    (raw) => mapBook(raw as ApiBook),
    async () => (await import("@/lib/data/books")).getBookBySlug(slug),
  );
}

export async function getRelatedBooks(current: Book, limit = 3): Promise<Book[]> {
  const all = await getBooks();
  const rest = all.filter((b) => b.id !== current.id);
  const byCat = rest.filter((b) => b.category === current.category);
  return [...byCat, ...rest.filter((b) => b.category !== current.category)].slice(0, limit);
}

export async function getExams(): Promise<Exam[]> {
  return withFallback(
    "/exams",
    (raw) => (raw as ApiExam[]).map(mapExam),
    async () => (await import("@/lib/data/exams")).allExams,
  );
}

export async function getExam(slug: string): Promise<Exam | undefined> {
  return withFallback(
    `/exams/${slug}`,
    (raw) => mapExam(raw as ApiExam),
    async () => (await import("@/lib/data/exams")).getExamBySlug(slug),
  );
}

export async function getFreeExams(): Promise<Exam[]> {
  const all = await getExams();
  return all.filter((e) => e.isFree);
}

export async function getRelatedExams(current: Exam, limit = 3): Promise<Exam[]> {
  const all = await getExams();
  const rest = all.filter((e) => e.id !== current.id);
  const byCat = rest.filter((e) => e.category === current.category);
  return [...byCat, ...rest.filter((e) => e.category !== current.category)].slice(0, limit);
}

export async function getBlogs(): Promise<BlogPost[]> {
  return withFallback(
    "/blogs",
    (raw) => (raw as ApiBlog[]).map(mapBlog),
    async () => (await import("@/lib/data/blogs")).blogs,
  );
}

export async function getBlog(slug: string): Promise<BlogPost | undefined> {
  return withFallback(
    `/blogs/${slug}`,
    (raw) => mapBlog(raw as ApiBlog),
    async () => (await import("@/lib/data/blogs")).getBlogBySlug(slug),
  );
}

export async function getRelatedBlogs(current: BlogPost, limit = 3): Promise<BlogPost[]> {
  const all = await getBlogs();
  const rest = all.filter((b) => b.id !== current.id);
  const byCat = rest.filter((b) => b.category === current.category);
  return [...byCat, ...rest.filter((b) => b.category !== current.category)].slice(0, limit);
}

// ─── Featured (homepage) ──────────────────────────────────────────────────
export async function getFeaturedCourses(limit = 4) {
  return (await getCourses()).filter((c) => c.featured).slice(0, limit);
}

export async function getFeaturedBooks(limit = 4) {
  return (await getBooks()).filter((b) => b.featured).slice(0, limit);
}

export async function getFeaturedExams(limit = 3) {
  return (await getExams()).filter((e) => e.featured).slice(0, limit);
}

export async function getFeaturedBlogs(limit = 3) {
  return (await getBlogs()).filter((b) => b.featured).slice(0, limit);
}

// ─── Dashboard (authenticated; falls back to demo data when unauthenticated) ──
export async function getMe(): Promise<AppUser> {
  return withFallback(
    "/users/me",
    (raw) => mapUser(raw as ApiUser),
    async () => (await import("@/lib/data/users")).demoUser,
  );
}

export async function getMyOrders(): Promise<Order[]> {
  return withFallback(
    "/users/me/orders",
    (raw) => (raw as ApiOrder[]).map(mapOrder),
    async () => (await import("@/lib/data/users")).demoOrders,
  );
}

export async function getMyEnrollments(): Promise<DemoEnrollment[]> {
  return withFallback(
    "/users/me/enrollments",
    (raw) => (raw as ApiEnrollment[]).map(mapEnrollment),
    async () => (await import("@/lib/data/users")).demoEnrollments,
  );
}

export async function getMyAttempts(): Promise<{ id: string; examTitle: string; score: number; total: number; negative: number; date: string; durationUsed: number }[]> {
  return withFallback(
    "/users/me/attempts",
    (raw) => (raw as ApiAttempt[]).map(mapAttempt),
    async () => (await import("@/lib/data/users")).demoResults,
  );
}
