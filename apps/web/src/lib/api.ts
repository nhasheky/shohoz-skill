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
  Category,
  Course,
  Exam,
  FaqItem,
  Order,
  ProductReview,
  SiteSetting,
  MarketingPixel,
  SuggestedRef,
  TestimonialReview,
  VideoSource,
} from "@/lib/types";
import { cookies } from "next/headers";
import type { DemoEnrollment } from "@/lib/data/users";
import { SITE } from "@/lib/site";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/api\/?$/, "").replace(/\/+$/, "");

// ─── Low-level request with fallback ──────────────────────────────────────
type FetchOpts = { auth?: boolean; revalidate?: number; tags?: string[] };

/**
 * Server-side fetch to the NestJS API with a mock fallback.
 *
 * Public reads go through Next's Data Cache (`next.revalidate`, 5 min default)
 * so pages can be served from Vercel's edge/ISR cache instead of hitting the
 * API on every request. Authenticated reads opt out and stay dynamic.
 */
async function withFallback<T>(
  path: string,
  map: (raw: unknown) => T,
  mock: () => Promise<T>,
  opts: FetchOpts = {},
): Promise<T> {
  const { auth = false, revalidate = 60, tags } = opts;
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      headers,
      signal: AbortSignal.timeout(8000),
    };
    if (auth) {
      const cookieStore = await cookies();
      const token = cookieStore.get("shohoz_token")?.value;
      if (token) headers.Authorization = `Bearer ${token}`;
      init.cache = "no-store";
    } else {
      init.next = tags ? { revalidate, tags } : { revalidate };
    }

    const res = await fetch(`${API_URL}/api${path}`, init);
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
type ApiLesson = { id: string; title: string; durationMinutes?: number; sourceKind?: string; sourceId?: string; preview?: boolean | null };
type ApiSection = { id: string; title: string; sortOrder?: number; lessons?: ApiLesson[] };
type ApiInstructor = { id: string; name: string; nameBn?: string | null; title: string; bio: string; rating: number; students: number; courses: number; verified?: boolean | null };
type ApiCourse = {
  id: string; slug: string; title: string; titleBn?: string | null; tagline?: string | null; description?: string | null;
  category?: string | null; categoryBn?: string | null; level?: string | null; durationLabel?: string | null;
  totalHours?: number | null; lectures?: number | null; quizzes?: number | null; articles?: number | null; resources?: number | null;
  students?: number | null; rating?: number | null; reviewCount?: number | null; certificate?: boolean | null; featured?: boolean | null;
  published: boolean; createdAt: string; instructor?: ApiInstructor | null;
  prices?: ApiPrice[]; curriculum?: ApiSection[];
  thumbnailUrl?: string | null;
  allowedPaymentMethods?: string[];
  suggested?: unknown;
  gift?: unknown;
  learningOutcomes?: string[];
  requirements?: string[];
  whoIsFor?: string[];
  faq?: FaqItem[];
};
type ApiBook = {
  id: string; slug: string; title: string; titleBn?: string | null; subtitle?: string | null; description?: string | null;
  category?: string | null; author?: string | null; pages?: number | null; edition?: string | null; language?: string | null; publisher?: string | null;
  pdfPrice?: number | null; hardcopyPrice?: number | null; samplePages?: number | null; students?: number | null; rating?: number | null;
  reviewCount?: number | null; featured?: boolean | null; published: boolean; createdAt: string;
  thumbnailUrl?: string | null; demoPdfUrl?: string | null; hasDemo?: boolean;
  allowedPaymentMethods?: string[];
  suggested?: unknown;
};
type ApiQuestion = { id: string; text: string; options: string[] | string; answerIndex: number; explanation?: string | null; sortOrder?: number | null };
type ApiTopic = { id: string; title: string; slug: string; questionsCount?: number | null; durationMinutes?: number | null; marksPerQuestion?: number | null; negativeMarks?: number | null; sortOrder?: number | null; questions?: ApiQuestion[] };
type ApiSubject = { id: string; title: string; sortOrder?: number | null; topics?: ApiTopic[] };
type ApiExam = {
  id: string; slug: string; title: string; titleBn?: string | null; tagline?: string | null; description?: string | null;
  examType?: string | null; difficulty?: string | null; isFree?: boolean | null; priceAmount?: number | null; priceOriginalAmount?: number | null;
  durationMinutes?: number | null; questionsCount?: number | null; totalMarks?: number | null; negativeMarking?: boolean | null;
  defaultNegativeMarks?: number | null; marksPerQuestion?: number | null; attemptCount?: number | null; passRate?: number | null; avgScore?: number | null;
  rating?: number | null; featured?: boolean | null; published: boolean; createdAt: string; subjects?: ApiSubject[];
  thumbnailUrl?: string | null;
  allowedPaymentMethods?: string[];
  suggested?: unknown;
};
type ApiBlog = {
  id: string; slug: string; title: string; excerpt?: string | null; category?: string | null; categoryBn?: string | null;
  tags?: string[]; author?: string | null; readMinutes?: number | null; content?: unknown; featured?: boolean | null;
  scheduledFor?: string | null; published: boolean; createdAt: string; updatedAt?: string | null;
};
type ApiDevice = { id: string; deviceName: string; browser?: string | null; os?: string | null; ip?: string | null; lastActive: string; current: boolean | null };
type ApiUser = {
  id: string; name: string; nameBn?: string | null; email?: string | null; phone: string;
  role: string; status: string; joinedAt: string; verified: boolean; devices: ApiDevice[];
};
type ApiOrder = {
  id: string; orderNumber?: number | null; userId: string; productType: string; productId: string; productTitle: string; amount: number;
  method: string; status: string; txId?: string | null; createdAt: string;
  deliveryCharge?: number | null; total?: number | null; isPhysical?: boolean | null;
};
type ApiEnrollment = {
  id: string; userId: string; productType: string; productId: string; accessFrom: string;
  accessExpires?: string | null; viaAdmin: boolean | null; giftFrom?: string | null; createdAt: string;
  title?: string | null; slug?: string | null; thumbnailUrl?: string | null; progress?: number | null;
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

function normalizeSuggested(raw: unknown): SuggestedRef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is { type: string; id: string } =>
        Boolean(
          s &&
            typeof s === "object" &&
            typeof (s as { type?: unknown }).type === "string" &&
            typeof (s as { id?: unknown }).id === "string",
        ),
    )
    .map((s) => ({ type: s.type as SuggestedRef["type"], id: s.id }));
}

/** Accept either a raw YouTube id or a full URL (watch/youtu.be/embed/shorts). */
export function youtubeIdFrom(src: string | null | undefined): string {
  const s = (src ?? "").trim();
  if (!s) return "";
  if (!s.includes("/") && !s.includes("?") && !s.includes("=")) return s;
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : s;
}

function mapLessonSource(l: ApiLesson): VideoSource {
  return l.sourceKind === "direct"
    ? { type: "direct", hlsUrl: l.sourceId ?? "" }
    : { type: "youtube", youtubeId: youtubeIdFrom(l.sourceId) };
}

function mapCourse(raw: ApiCourse): Course {
  const curriculum = raw.curriculum ?? [];
  const lessons = curriculum.flatMap((s) => s.lessons ?? []);
  const firstYt = lessons.find((l) => (l.sourceKind ?? "youtube") === "youtube");
  const firstDir = lessons.find((l) => l.sourceKind === "direct");
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    tagline: raw.tagline ?? "",
    description: raw.description ?? "",
    category: raw.category ?? "",
    categoryBn: raw.categoryBn ?? undefined,
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    level: (raw.level as Course["level"]) ?? "All Levels",
    priceMap: Object.fromEntries(
      (raw.prices ?? []).map((p) => [p.duration, { amount: p.amount, originalAmount: p.originalAmount ?? undefined }]),
    ),
    durationLabel: raw.durationLabel ?? "self-paced",
    totalHours: raw.totalHours ?? 0,
    lectures: raw.lectures ?? 0,
    quizzes: raw.quizzes ?? 0,
    articles: raw.articles ?? 0,
    resources: raw.resources ?? 0,
    students: raw.students ?? 0,
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    certificate: raw.certificate ?? false,
    instructor: raw.instructor
      ? {
          id: raw.instructor.id,
          name: raw.instructor.name,
          nameBn: raw.instructor.nameBn ?? undefined,
          title: raw.instructor.title ?? "Faculty",
          bio: raw.instructor.bio ?? "",
          rating: raw.instructor.rating ?? 0,
          students: raw.instructor.students ?? 0,
          courses: raw.instructor.courses ?? 0,
          verified: raw.instructor.verified ?? false,
        }
      : { id: "unknown", name: "Shohoz Skill Faculty", title: "Faculty", bio: "", rating: 0, students: 0, courses: 0 },
    curriculum: curriculum.map((s) => ({
      id: s.id,
      title: s.title,
      lessons: (s.lessons ?? []).map((l) => ({
        id: l.id,
        title: l.title,
        durationMinutes: l.durationMinutes ?? 0,
        source: mapLessonSource(l),
        preview: l.preview ?? false,
      })),
    })),
    learningOutcomes: (raw.learningOutcomes as string[]) ?? [],
    requirements: (raw.requirements as string[]) ?? [],
    whoIsFor: (raw.whoIsFor as string[]) ?? [],
    faq: (raw.faq as FaqItem[]) ?? [],
    videos: firstYt ? { youtube: firstYt.sourceId ?? "" } : firstDir ? { direct: firstDir.sourceId ?? "" } : {},
    allowedPaymentMethods: raw.allowedPaymentMethods ?? [],
    suggested: normalizeSuggested(raw.suggested),
    gift: normalizeSuggested(raw.gift),
    published: raw.published ?? false,
    featured: raw.featured ?? false,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.tagline ?? ""),
  };
}

function mapBook(raw: ApiBook): Book {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    subtitle: raw.subtitle ?? "",
    description: raw.description ?? "",
    category: raw.category ?? "",
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    demoPdfUrl: raw.demoPdfUrl ?? undefined,
    hasDemo: raw.hasDemo ?? Boolean(raw.demoPdfUrl),
    author: {
      id: `author-${raw.slug}`,
      name: raw.author ?? "Shohoz Skill",
      title: "Author",
      bio: "",
    },
    pages: raw.pages ?? 0,
    edition: raw.edition ?? "",
    language: (raw.language as Book["language"]) ?? "Bengali",
    publisher: raw.publisher ?? "Shohoz Skill",
    pdfPrice: raw.pdfPrice != null ? { amount: raw.pdfPrice } : null,
    hardcopyPrice: raw.hardcopyPrice != null ? { amount: raw.hardcopyPrice } : null,
    tableOfContents: [{ title: "Full contents", pages: `1–${raw.pages ?? 0}` }],
    samplePages: raw.samplePages ?? 0,
    students: raw.students ?? 0,
    rating: raw.rating ?? 0,
    reviewCount: raw.reviewCount ?? 0,
    allowedPaymentMethods: raw.allowedPaymentMethods ?? [],
    suggested: normalizeSuggested(raw.suggested),
    published: raw.published ?? false,
    featured: raw.featured ?? false,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.subtitle ?? (raw.description ?? "").slice(0, 120)),
  };
}

function mapExam(raw: ApiExam): Exam {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    titleBn: raw.titleBn ?? undefined,
    tagline: raw.tagline ?? "",
    description: raw.description ?? "",
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    category: undefined,
    difficulty: (raw.difficulty as Exam["difficulty"]) ?? "Medium",
    examType: (raw.examType as Exam["examType"]) ?? "model-test",
    isFree: raw.isFree ?? false,
    price: { amount: raw.priceAmount ?? 0, originalAmount: raw.priceOriginalAmount ?? undefined },
    durationMinutes: raw.durationMinutes ?? 0,
    questionsCount: raw.questionsCount ?? 0,
    totalMarks: raw.totalMarks ?? 0,
    negativeMarking: raw.negativeMarking ?? false,
    defaultNegativeMarks: raw.defaultNegativeMarks ?? 0.25,
    marksPerQuestion: raw.marksPerQuestion ?? 1,
    attemptCount: raw.attemptCount ?? 0,
    passRate: raw.passRate ?? 0,
    avgScore: raw.avgScore ?? 0,
    rating: raw.rating ?? 0,
    accessDuration: "LIFETIME",
    allowedPaymentMethods: raw.allowedPaymentMethods ?? [],
    suggested: normalizeSuggested(raw.suggested),
    subjects: (raw.subjects ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      topics: (s.topics ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        questionsCount: t.questionsCount ?? 0,
        durationMinutes: t.durationMinutes ?? 0,
        marksPerQuestion: t.marksPerQuestion ?? 1,
        negativeMarks: t.negativeMarks ?? 0.25,
        questions: (t.questions ?? []).map((q) => ({
          id: q.id,
          text: q.text,
          options: typeof q.options === "string" ? JSON.parse(q.options) : (q.options ?? []),
          answerIndex: q.answerIndex,
          explanation: q.explanation ?? undefined,
        })),
      })),
    })),
    featured: raw.featured ?? false,
    published: raw.published ?? false,
    createdAt: raw.createdAt,
    seo: seo(raw.title, raw.tagline ?? ""),
  };
}

function mapBlog(raw: ApiBlog): BlogPost {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt ?? "",
    content: ((raw.content ?? []) as BlogPost["content"]),
    category: raw.category ?? "",
    categoryBn: raw.categoryBn ?? undefined,
    tags: raw.tags ?? [],
    author: { id: `author-${raw.slug}`, name: raw.author ?? "Shohoz Skill", title: "Author" },
    readMinutes: raw.readMinutes ?? 5,
    featured: raw.featured ?? false,
    published: raw.published,
    scheduledFor: raw.scheduledFor ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? undefined,
    seo: seo(raw.title, raw.excerpt ?? ""),
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
    orderNumber: raw.orderNumber ?? null,
    userId: raw.userId,
    productType: raw.productType as Order["productType"],
    productId: raw.productId,
    productTitle: raw.productTitle,
    amount: raw.amount,
    deliveryCharge: raw.deliveryCharge ?? 0,
    total: raw.total ?? raw.amount,
    isPhysical: raw.isPhysical ?? false,
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
    slug: raw.slug || raw.productId,
    type: raw.productType as DemoEnrollment["type"],
    title: raw.title || raw.productId,
    progress: typeof raw.progress === "number" ? raw.progress : 0,
    accessFrom: raw.accessFrom,
    accessExpires: raw.accessExpires ?? undefined,
    viaAdmin: raw.viaAdmin ?? false,
    giftFrom: raw.giftFrom ?? null,
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
  const decoded = decodeURIComponent(slug);
  const course = await withFallback(
    `/courses/${encodeURIComponent(decoded)}`,
    (raw) => mapCourse(raw as ApiCourse),
    async () => {
      const data = await import("@/lib/data/courses");
      return data.getCourseBySlug(decoded) || data.getCourseBySlug(slug) || data.courses.find(c => c.id === slug || c.slug === decoded || c.slug === slug);
    },
  );
  if (course) return course;

  // Secondary fallback: lookup by ID or slug in full catalogue
  const all = await getCourses().catch(() => []);
  return all.find(c => c.id === slug || c.id === decoded || c.slug === slug || c.slug === decoded);
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
  const decoded = decodeURIComponent(slug);
  const book = await withFallback(
    `/books/${encodeURIComponent(decoded)}`,
    (raw) => mapBook(raw as ApiBook),
    async () => {
      const data = await import("@/lib/data/books");
      return data.getBookBySlug(decoded) || data.getBookBySlug(slug) || data.books.find(b => b.id === slug || b.slug === decoded || b.slug === slug);
    },
  );
  if (book) return book;

  const all = await getBooks().catch(() => []);
  return all.find(b => b.id === slug || b.id === decoded || b.slug === slug || b.slug === decoded);
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
  const decoded = decodeURIComponent(slug);
  const exam = await withFallback(
    `/exams/${encodeURIComponent(decoded)}`,
    (raw) => mapExam(raw as ApiExam),
    async () => {
      const data = await import("@/lib/data/exams");
      return data.getExamBySlug(decoded) || data.getExamBySlug(slug) || data.allExams.find((x: any) => x.id === slug || x.slug === decoded || x.slug === slug);
    },
  );
  if (exam) return exam;

  const all = await getExams().catch(() => []);
  return all.find(x => x.id === slug || x.id === decoded || x.slug === slug || x.slug === decoded);
}

export async function getFreeExams(): Promise<Exam[]> {
  const all = await getExams();
  return all.filter((e) => e.isFree);
}

export type MyExamAttempt = {
  examId: string;
  attempted: boolean;
  reExamPending: boolean;
  attempt: {
    id: string;
    score: number;
    maxMarks: number;
    correct: number;
    wrong: number;
    unanswered: number;
    passed: boolean;
    submittedAt: string;
    answers?: Record<string, number> | null;
  } | null;
};

export async function getMyExamAttempt(examIdOrSlug: string): Promise<MyExamAttempt> {
  return withFallback(
    `/exams/${encodeURIComponent(examIdOrSlug)}/my-attempt`,
    (raw) => raw as MyExamAttempt,
    async () => ({ examId: examIdOrSlug, attempted: false, reExamPending: false, attempt: null }),
    { auth: true },
  );
}

export async function getRelatedExams(current: Exam, limit = 3): Promise<Exam[]> {
  const all = await getExams();
  const rest = all.filter((e) => e.id !== current.id);
  const byCat = rest.filter((e) => e.category === current.category);
  return [...byCat, ...rest.filter((e) => e.category !== current.category)].slice(0, limit);
}

// ─── Reviews (real API) ────────────────────────────────────────────────────
type ApiReview = {
  id: string;
  productType: string;
  productId: string;
  rating: number;
  text: string;
  imageUrl?: string | null;
  createdAt: string;
  userId?: string | null;
  authorName?: string | null;
  user?: { name?: string | null; nameBn?: string | null } | null;
};

export async function getProductReviews(productType: string, productId: string): Promise<ProductReview[]> {
  return withFallback(
    `/reviews/${encodeURIComponent(productType)}/${encodeURIComponent(productId)}`,
    (raw) =>
      (raw as ApiReview[]).map((r) => ({
        id: r.id,
        productType: r.productType as ProductReview["productType"],
        productId: r.productId,
        rating: r.rating,
        text: r.text,
        imageUrl: r.imageUrl ?? null,
        name: r.user?.name || r.authorName || "Shohoz Skill Learner",
        userId: r.userId ?? null,
        createdAt: r.createdAt,
      })),
    async () => [],
  );
}

// ─── Suggested products (cross-type) ───────────────────────────────────────
export type SuggestionCard =
  | { type: "course"; course: Course }
  | { type: "book"; book: Book }
  | { type: "exam"; exam: Exam };

function suggestionId(card: SuggestionCard): string {
  if (card.type === "course") return `course:${card.course.id}`;
  if (card.type === "book") return `book:${card.book.id}`;
  return `exam:${card.exam.id}`;
}

function suggestionRating(card: SuggestionCard): number {
  if (card.type === "course") return card.course.rating;
  if (card.type === "book") return card.book.rating;
  return card.exam.rating;
}

/**
 * Resolve the "you may also like" list for a product. Uses the admin-picked
 * suggestions first, then fills the rest with cross-type relevant items.
 */
export async function getSuggestions(
  sourceType: "course" | "book" | "exam",
  suggested: SuggestedRef[] | undefined,
  limit = 3,
): Promise<SuggestionCard[]> {
  const [courses, books, exams] = await Promise.all([getCourses(), getBooks(), getExams()]);
  const all: SuggestionCard[] = [
    ...courses.map((c) => ({ type: "course" as const, course: c })),
    ...books.map((b) => ({ type: "book" as const, book: b })),
    ...exams.map((e) => ({ type: "exam" as const, exam: e })),
  ];
  const byId = new Map(all.map((c) => [suggestionId(c), c]));
  const out: SuggestionCard[] = [];
  const seen = new Set<string>();
  for (const ref of suggested ?? []) {
    const card = byId.get(`${ref.type}:${ref.id}`);
    if (card && !seen.has(suggestionId(card))) {
      out.push(card);
      seen.add(suggestionId(card));
    }
    if (out.length >= limit) break;
  }
  if (out.length < limit) {
    const pool = all
      .filter((c) => c.type !== sourceType && !seen.has(suggestionId(c)))
      .sort((a, b) => suggestionRating(b) - suggestionRating(a));
    for (const card of pool) {
      if (out.length >= limit) break;
      out.push(card);
      seen.add(suggestionId(card));
    }
  }
  return out.slice(0, limit);
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
    { auth: true },
  );
}

export async function getMyOrders(): Promise<Order[]> {
  return withFallback(
    "/users/me/orders",
    (raw) => (raw as ApiOrder[]).map(mapOrder),
    async () => (await import("@/lib/data/users")).demoOrders,
    { auth: true },
  );
}

export async function getMyEnrollments(): Promise<DemoEnrollment[]> {
  const enrollments = await withFallback(
    "/users/me/enrollments",
    (raw) => (raw as ApiEnrollment[]).map(mapEnrollment),
    async () => (await import("@/lib/data/users")).demoEnrollments,
    { auth: true },
  );

  const needsResolution = enrollments.some(e => !e.title || e.title === e.productId || !e.slug || e.slug === e.productId);
  if (needsResolution) {
    try {
      const [courses, books, exams] = await Promise.all([
        getCourses().catch(() => []),
        getBooks().catch(() => []),
        getExams().catch(() => []),
      ]);
      const map = new Map<string, { title: string; slug: string }>();
      courses.forEach(c => { map.set(c.id, c); map.set(c.slug, c); });
      books.forEach(b => { map.set(b.id, b); map.set(b.slug, b); });
      exams.forEach(x => { map.set(x.id, x); map.set(x.slug, x); });

      return enrollments.map(e => {
        const found = map.get(e.productId) || map.get(e.slug);
        if (found) {
          return {
            ...e,
            title: found.title,
            slug: found.slug,
          };
        }
        return e;
      });
    } catch {
      return enrollments;
    }
  }

  return enrollments;
}

export async function getMyAttempts(): Promise<{ id: string; examTitle: string; score: number; total: number; negative: number; date: string; durationUsed: number }[]> {
  return withFallback(
    "/users/me/attempts",
    (raw) => (raw as ApiAttempt[]).map(mapAttempt),
    async () => (await import("@/lib/data/users")).demoResults,
    { auth: true },
  );
}

// ─── Auth session (cookie set by the login/OTP flows) ─────────────────────
export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("shohoz_token")?.value);
}

// ─── CMS: site settings & editable pages ──────────────────────────────────
export const FALLBACK_SITE_SETTINGS: SiteSetting = {
  id: "default",
  logoUrl: null,
  siteTitle: SITE.name,
  siteTitleBn: SITE.nameBn,
  faviconUrl: null,
  metaDescription: SITE.description,
  ogImageUrl: null,
  keywords: [],
  supportEmail: SITE.supportEmail,
  supportPhone: SITE.phone,
  address: SITE.address,
  socials: null,
  deliveryChargeDhaka: 60,
  deliveryChargeOutside: 120,
  codEnabled: true,
  sslcommerzEnabled: true,
  reviewScrollSeconds: 6,
};

function mapSiteSetting(raw: Record<string, unknown>): SiteSetting {
  const str = (v: unknown, fallback: string) => (typeof v === "string" && v.length ? v : fallback);
  return {
    id: typeof raw.id === "string" ? raw.id : "default",
    logoUrl: (raw.logoUrl as string | null) ?? null,
    siteTitle: str(raw.siteTitle, SITE.name),
    siteTitleBn: (raw.siteTitleBn as string | null) ?? SITE.nameBn,
    faviconUrl: (raw.faviconUrl as string | null) ?? null,
    metaDescription: str(raw.metaDescription, SITE.description),
    ogImageUrl: (raw.ogImageUrl as string | null) ?? null,
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]) : [],
    supportEmail: str(raw.supportEmail, SITE.supportEmail),
    supportPhone: str(raw.supportPhone, SITE.phone),
    address: str(raw.address, SITE.address),
    socials: (raw.socials as Record<string, string> | null) ?? null,
    deliveryChargeDhaka: typeof raw.deliveryChargeDhaka === "number" ? raw.deliveryChargeDhaka : 60,
    deliveryChargeOutside: typeof raw.deliveryChargeOutside === "number" ? raw.deliveryChargeOutside : 120,
    codEnabled: typeof raw.codEnabled === "boolean" ? raw.codEnabled : true,
    sslcommerzEnabled: typeof raw.sslcommerzEnabled === "boolean" ? raw.sslcommerzEnabled : true,
    reviewScrollSeconds: typeof raw.reviewScrollSeconds === "number" ? raw.reviewScrollSeconds : 6,
  };
}

/** Public site settings (branding, SEO, delivery charges). */
export async function getSiteSettings(): Promise<SiteSetting> {
  return withFallback(
    "/site-settings",
    (raw) => mapSiteSetting(raw as Record<string, unknown>),
    async () => FALLBACK_SITE_SETTINGS,
    { revalidate: 60, tags: ["site-settings"] },
  );
}

/** Public: admin-managed marketing pixels (enabled only). */
export async function getMarketingPixels(): Promise<MarketingPixel[]> {
  return withFallback(
    "/marketing/pixels",
    (raw) => (Array.isArray(raw) ? (raw as MarketingPixel[]) : []),
    async () => [],
    { revalidate: 60, tags: ["marketing-pixels"] },
  );
}

export type HomePageData = {
  // Hero section
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroMetrics?: Array<{ value: string; label: string }>;
  heroPrimaryLabel?: string;
  heroPrimaryHref?: string;
  heroSecondaryLabel?: string;
  heroSecondaryHref?: string;
  heroSearchPlaceholder?: string;

  // Device strip
  deviceStrip?: string[];

  // Stats band
  stats?: Array<{ value: number; suffix: string; label: string }>;

  // Categories Section
  categoriesEyebrow?: string;
  categoriesTitle?: string;
  categoriesDescription?: string;
  categories?: Category[];

  // Courses Section
  coursesEyebrow?: string;
  coursesTitle?: string;
  coursesDescription?: string;

  // Exams Section
  examsEyebrow?: string;
  examsTitle?: string;
  examsDescription?: string;
  examsSteps?: Array<{ title: string; description: string }>;
  examEngineTitle?: string;

  // Books Section
  booksEyebrow?: string;
  booksTitle?: string;
  booksDescription?: string;

  // Reviews Section
  reviewsEyebrow?: string;
  reviewsTitle?: string;
  reviewsDescription?: string;
  testimonials?: TestimonialReview[];

  // Blogs Section
  blogsEyebrow?: string;
  blogsTitle?: string;

  // FAQ Section
  faqEyebrow?: string;
  faqTitle?: string;
  faqDescription?: string;
  faq?: FaqItem[];

  // CTA banner
  ctaBadge?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaPrimaryLabel?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  ctaFootnote?: string;
};

export type AboutPageData = {
  title?: string;
  description?: string;
  story?: string[];
  values?: { title: string; description: string }[];
  milestones?: { year: string; title: string; description: string }[];
};

export type ContactPageData = {
  title?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  supportHours?: string;
};

/** Dynamic content block for a CMS-managed page (returns {} when not set). */
export async function getPageContent<T = Record<string, unknown>>(page: string): Promise<Partial<T>> {
  return withFallback(
    `/pages/${page}`,
    (raw) => (((raw as { data?: unknown }).data ?? {}) as Partial<T>),
    async () => ({}),
    { revalidate: 60, tags: [`page:${page}`] },
  );
}

/** Public: admin-managed course categories (stored in the "categories" page content). */
export async function getCategories(): Promise<Category[]> {
  const page = await getPageContent<{ items: Category[] }>("categories");
  const items = page.items;
  if (Array.isArray(items) && items.length) return items;
  return (await import("@/lib/data/site-content")).categories;
}
