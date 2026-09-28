"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminTitle } from "@/lib/use-admin-title";
import { useRouter } from "next/navigation";
import { formatBdt } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AdminList, PubBadge, type AdminColumn, type PageResult } from "./admin-list";
import { AdminForm, toForm } from "./admin-form";
import type { FieldDef } from "./admin-ui";
import { Badge, ConfirmDialog, Pagination, SearchInput, AdminModal, FieldInput } from "./admin-ui";
import {
  BlogContentEditor,
  CurriculumEditor,
  ExamSubjectsEditor,
  FaqEditor,
  ListEditor,
  PriceListEditor,
  SeoEditor,
  type BlogBlockRow,
  type PriceRow,
  type SectionRow,
  type SubjectRow,
} from "./admin-fields";
import { useToast } from "./admin-toast";
import * as api from "@/lib/admin-api";
import { courses as seedCourses } from "@/lib/data/courses";
import { books as seedBooks } from "@/lib/data/books";
import { allExams as seedExams } from "@/lib/data/exams";
import { blogs as seedBlogs } from "@/lib/data/blogs";
import { adminUsers as seedUsers, adminOrders, adminStats, revenueSeries } from "@/lib/data/admin";
import { getAdminStats, getAdminRevenue } from "@/lib/admin-api";
import type { AppUser, Order } from "@/lib/types";

type Row = { id: string } & Record<string, unknown>;

// ─── Field definitions ─────────────────────────────────────────────────────
const courseFields: FieldDef[] = [
  { name: "slug", label: "Slug", required: true, span2: true },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "category", label: "Category", required: true },
  { name: "categoryBn", label: "Category (Bangla)" },
  { name: "tagline", label: "Tagline", required: true, span2: true },
  { name: "description", label: "Description", type: "textarea", required: true, span2: true },
  { name: "level", label: "Level", type: "select", options: ["Beginner", "Intermediate", "Advanced", "All Levels"] },
  { name: "durationLabel", label: "Duration label" },
  { name: "totalHours", label: "Total hours", type: "number" },
  { name: "lectures", label: "Lectures", type: "number" },
  { name: "quizzes", label: "Quizzes", type: "number" },
  { name: "articles", label: "Articles", type: "number" },
  { name: "resources", label: "Resources", type: "number" },
  { name: "students", label: "Students", type: "number" },
  { name: "rating", label: "Rating", type: "number" },
  { name: "reviewCount", label: "Review count", type: "number" },
  { name: "instructorId", label: "Instructor ID" },
  { name: "certificate", label: "Certificate", type: "checkbox" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" },
];

const bookFields: FieldDef[] = [
  { name: "slug", label: "Slug", required: true, span2: true },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "subtitle", label: "Subtitle", span2: true },
  { name: "description", label: "Description", type: "textarea", required: true, span2: true },
  { name: "category", label: "Category", required: true },
  { name: "author", label: "Author", required: true },
  { name: "publisher", label: "Publisher" },
  { name: "edition", label: "Edition" },
  { name: "language", label: "Language", type: "select", options: ["En", "Bn", "Mixture"] },
  { name: "pages", label: "Pages", type: "number", required: true },
  { name: "pdfPrice", label: "PDF price (৳)", type: "number", required: true },
  { name: "hardcopyPrice", label: "Hardcopy price (৳)", type: "number" },
  { name: "samplePages", label: "Sample pages", type: "number" },
  { name: "students", label: "Students", type: "number" },
  { name: "rating", label: "Rating", type: "number" },
  { name: "reviewCount", label: "Review count", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" },
];

const examFields: FieldDef[] = [
  { name: "slug", label: "Slug", required: true, span2: true },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "tagline", label: "Tagline", required: true, span2: true },
  { name: "description", label: "Description", type: "textarea", required: true, span2: true },
  { name: "examType", label: "Type", type: "select", options: ["package", "subject", "topic"] },
  { name: "difficulty", label: "Difficulty", type: "select", options: ["Easy", "Medium", "Hard"] },
  { name: "isFree", label: "Free", type: "checkbox" },
  { name: "negativeMarking", label: "Negative marking", type: "checkbox" },
  { name: "priceAmount", label: "Price (৳)", type: "number" },
  { name: "priceOriginalAmount", label: "Original price (৳)", type: "number" },
  { name: "defaultNegativeMarks", label: "Negative marks / wrong", type: "number" },
  { name: "durationMinutes", label: "Duration (min)", type: "number" },
  { name: "questionsCount", label: "Questions", type: "number" },
  { name: "totalMarks", label: "Total marks", type: "number" },
  { name: "attemptCount", label: "Attempts", type: "number" },
  { name: "passRate", label: "Pass rate %", type: "number" },
  { name: "avgScore", label: "Avg score", type: "number" },
  { name: "rating", label: "Rating", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" },
];

const blogFields: FieldDef[] = [
  { name: "slug", label: "Slug", required: true, span2: true },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "excerpt", label: "Excerpt", type: "textarea", required: true, span2: true },
  { name: "category", label: "Category", required: true },
  { name: "categoryBn", label: "Category (Bangla)" },
  { name: "author", label: "Author", required: true },
  { name: "readMinutes", label: "Read (min)", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" },
  { name: "tags", label: "Tags", type: "textarea", json: true, help: '["BCS","strategy"]' },
];

// ─── Normalizers (API + demo shapes → editor form state) ──────────────────
function num(v: unknown): number | "" {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && typeof (v as { amount?: unknown }).amount === "number") return (v as { amount: number }).amount;
  return "";
}

function normPrices(row: Record<string, unknown>): PriceRow[] {
  const prices = row.prices as PriceRow[] | undefined;
  if (Array.isArray(prices)) return prices.map((p) => ({ duration: p.duration, amount: p.amount, originalAmount: p.originalAmount ?? "" }));
  const pm = row.priceMap as Record<string, { amount: number; originalAmount?: number }> | undefined;
  if (pm) {
    return Object.entries(pm).map(([duration, price]) => ({ duration, amount: price.amount, originalAmount: price.originalAmount ?? "" }));
  }
  return [];
}

function normCurriculum(row: Record<string, unknown>): SectionRow[] {
  const c = row.curriculum as { id?: string; title: string; lessons: unknown[] }[] | undefined;
  if (!Array.isArray(c)) return [];
  return c.map((sec) => ({
    title: sec.title ?? "",
    lessons: (sec.lessons as { title?: string; durationMinutes?: number; preview?: boolean; source?: { type: string; youtubeId?: string; hlsUrl?: string }; sourceKind?: string; sourceId?: string }[]).map((l) => ({
      title: l.title ?? "",
      durationMinutes: typeof l.durationMinutes === "number" ? l.durationMinutes : "",
      sourceKind: l.sourceKind ?? (l.source?.type === "direct" ? "direct" : "youtube"),
      sourceId: l.sourceId ?? l.source?.youtubeId ?? l.source?.hlsUrl ?? "",
      preview: Boolean(l.preview),
    })),
  }));
}

function listOf(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function normSubjects(row: Record<string, unknown>): SubjectRow[] {
  const s = row.subjects as SubjectRow[] | undefined;
  if (!Array.isArray(s)) return [];
  return s.map((sub) => ({
    title: sub.title ?? "",
    topics: (sub.topics ?? []).map((t) => ({
      title: t.title ?? "",
      slug: t.slug ?? "",
      questionsCount: typeof t.questionsCount === "number" ? t.questionsCount : "",
      durationMinutes: typeof t.durationMinutes === "number" ? t.durationMinutes : "",
      marksPerQuestion: typeof t.marksPerQuestion === "number" ? t.marksPerQuestion : "",
      negativeMarks: typeof t.negativeMarks === "number" ? t.negativeMarks : "",
      questions: (t.questions ?? []).map((q) => ({
        text: q.text ?? "",
        options: Array.isArray(q.options) ? q.options.map(String) : ["", "", "", ""],
        answerIndex: Number(q.answerIndex ?? 0),
        explanation: q.explanation ?? "",
      })),
    })),
  }));
}

function normBlocks(v: unknown): BlogBlockRow[] {
  if (!Array.isArray(v)) return [];
  return v as BlogBlockRow[];
}

// ─── Courses ───────────────────────────────────────────────────────────────
const courseColumns: AdminColumn<Row>[] = [
  { key: "title", label: "Course", sortable: true, render: (r) => <p className="max-w-[26ch] truncate font-bold text-foreground">{String(r.title ?? "")}</p> },
  { key: "category", label: "Category", render: (r) => <span className="text-muted-foreground">{String(r.category ?? "—")}</span> },
  { key: "price", label: "Price", render: (r) => <span className="font-bold text-foreground">{coursePrice(r)}</span> },
  { key: "students", label: "Students", sortable: true, render: (r) => <span className="text-muted-foreground">{num(r.students) === "" ? "—" : String(r.students)}</span> },
  { key: "rating", label: "Rating", sortable: true, render: (r) => <span className="text-muted-foreground">{typeof r.rating === "number" ? r.rating.toFixed(1) : "—"}</span> },
  { key: "published", label: "Status", render: (r) => <PubBadge published={r.published} /> },
];

function coursePrice(r: Row): string {
  const prices = r.prices as { duration: string; amount: number }[] | undefined;
  if (Array.isArray(prices) && prices.length) {
    const lt = prices.find((p) => p.duration === "LIFETIME") ?? prices[0];
    return formatBdt(lt.amount);
  }
  return "—";
}

export function CoursesListPage() {
  useAdminTitle("Courses");
  return (
    <AdminList<Row>
      title="Courses"
      description="Manage the course catalogue"
      columns={courseColumns}
      newHref="/admin/courses/new"
      newLabel="Add course"
      editHref={(id) => `/admin/courses/${id}/edit`}
      fetchList={(q, page, perPage) => api.listCourses(q, page, perPage) as Promise<PageResult<Row>>}
      seed={() => seedCourses as unknown as Row[]}
      onDelete={async (id) => { await api.deleteCourse(id); }}
      searchPlaceholder="Search courses…"
    />
  );
}

export function CourseFormPage({ id }: { id?: string }) {
  useAdminTitle(id ? "Edit Course" : "New Course");
  const router = useRouter();
  const { initial, loading, notFound } = useAdminRecord(id, api.getCourse, () => seedCourses as unknown as Row[]);
  return (
    <PageSkeleton title="Course" loading={loading} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Course" : "New Course"}
        subtitle="Courses power the entire learning experience."
        fields={courseFields}
        initial={initial}
        backHref="/admin/courses"
        submitLabel={id ? "Save changes" : "Create course"}
        onSubmit={async (dto) => {
          if (id) await api.updateCourse(id, dto);
          else await api.createCourse(dto);
          router.push("/admin/courses");
        }}
      >
        {(form, set) => (
          <>
            <PriceListEditor value={form.prices as PriceRow[] | undefined} onChange={(v) => set("prices", v)} />
            <CurriculumEditor value={form.curriculum as SectionRow[] | undefined} onChange={(v) => set("curriculum", v)} />
            <EditorSection title="Learning outcomes">
              <ListEditor value={listOf(form.learningOutcomes)} onChange={(v) => set("learningOutcomes", v)} placeholder="What will students learn?" />
            </EditorSection>
            <EditorSection title="Requirements">
              <ListEditor value={listOf(form.requirements)} onChange={(v) => set("requirements", v)} placeholder="Prerequisites" />
            </EditorSection>
            <EditorSection title="Who is this for?">
              <ListEditor value={listOf(form.whoIsFor)} onChange={(v) => set("whoIsFor", v)} placeholder="Target audience" />
            </EditorSection>
            <EditorSection title="FAQ">
              <FaqEditor value={form.faq as { question: string; answer: string }[] | undefined} onChange={(v) => set("faq", v)} />
            </EditorSection>
            <SeoEditor value={form.seo as Record<string, unknown> | undefined} onChange={(v) => set("seo", v)} />
          </>
        )}
      </AdminForm>
    </PageSkeleton>
  );
}

// ─── Books ─────────────────────────────────────────────────────────────────
const bookColumns: AdminColumn<Row>[] = [
  { key: "title", label: "Title", sortable: true, render: (r) => <p className="max-w-[26ch] truncate font-bold text-foreground">{String(r.title ?? "")}</p> },
  { key: "author", label: "Author", render: (r) => <span className="text-muted-foreground">{String(r.author ?? "—")}</span> },
  { key: "category", label: "Category", render: (r) => <span className="text-muted-foreground">{String(r.category ?? "—")}</span> },
  { key: "pdfPrice", label: "PDF price", render: (r) => <span className="font-bold text-foreground">{num(r.pdfPrice) === "" ? "—" : formatBdt(num(r.pdfPrice) as number)}</span> },
  { key: "rating", label: "Rating", sortable: true, render: (r) => <span className="text-muted-foreground">{typeof r.rating === "number" ? r.rating.toFixed(1) : "—"}</span> },
  { key: "published", label: "Status", render: (r) => <PubBadge published={r.published} /> },
];

export function BooksListPage() {
  useAdminTitle("Books");
  return (
    <AdminList<Row>
      title="Books"
      description="Manage the book catalogue"
      columns={bookColumns}
      newHref="/admin/books/new"
      newLabel="Add book"
      editHref={(id) => `/admin/books/${id}/edit`}
      fetchList={(q, page, perPage) => api.listBooks(q, page, perPage) as Promise<PageResult<Row>>}
      seed={() => seedBooks as unknown as Row[]}
      onDelete={async (id) => { await api.deleteBook(id); }}
      searchPlaceholder="Search books…"
    />
  );
}

export function BookFormPage({ id }: { id?: string }) {
  useAdminTitle(id ? "Edit Book" : "New Book");
  const router = useRouter();
  const { initial, loading, notFound } = useAdminRecord(id, api.getBook, () => seedBooks as unknown as Row[]);
  return (
    <PageSkeleton title="Book" loading={loading} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Book" : "New Book"}
        fields={bookFields}
        initial={initial}
        backHref="/admin/books"
        submitLabel={id ? "Save changes" : "Create book"}
        onSubmit={async (dto) => {
          if (id) await api.updateBook(id, dto);
          else await api.createBook(dto);
          router.push("/admin/books");
        }}
      >
        {(form, set) => <SeoEditor value={form.seo as Record<string, unknown> | undefined} onChange={(v) => set("seo", v)} />}
      </AdminForm>
    </PageSkeleton>
  );
}

// ─── Exams ─────────────────────────────────────────────────────────────────
const examColumns: AdminColumn<Row>[] = [
  { key: "title", label: "Title", sortable: true, render: (r) => <p className="max-w-[26ch] truncate font-bold text-foreground">{String(r.title ?? "")}</p> },
  { key: "examType", label: "Type", render: (r) => <span className="text-muted-foreground">{String(r.examType ?? "—")}</span> },
  { key: "price", label: "Price", render: (r) => (r.isFree ? <Badge tone="success">Free</Badge> : <span className="font-bold text-foreground">{num(r.priceAmount) === "" ? "—" : formatBdt(num(r.priceAmount) as number)}</span>) },
  { key: "questionsCount", label: "Questions", render: (r) => <span className="text-muted-foreground">{num(r.questionsCount) === "" ? "—" : String(r.questionsCount)}</span> },
  { key: "rating", label: "Rating", sortable: true, render: (r) => <span className="text-muted-foreground">{typeof r.rating === "number" ? r.rating.toFixed(1) : "—"}</span> },
  { key: "published", label: "Status", render: (r) => <PubBadge published={r.published} /> },
];

export function ExamsListPage() {
  useAdminTitle("Exams");
  return (
    <AdminList<Row>
      title="Exams"
      description="Exam packages and standalone MCQ tests"
      columns={examColumns}
      newHref="/admin/exams/new"
      newLabel="Add exam"
      editHref={(id) => `/admin/exams/${id}/edit`}
      fetchList={(q, page, perPage) => api.listExams(q, page, perPage) as Promise<PageResult<Row>>}
      seed={() => seedExams as unknown as Row[]}
      onDelete={async (id) => { await api.deleteExam(id); }}
      searchPlaceholder="Search exams…"
    />
  );
}

export function ExamFormPage({ id }: { id?: string }) {
  useAdminTitle(id ? "Edit Exam" : "New Exam");
  const router = useRouter();
  const { initial, loading, notFound } = useAdminRecord(id, api.getExam, () => seedExams as unknown as Row[]);
  return (
    <PageSkeleton title="Exam" loading={loading} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Exam" : "New Exam"}
        fields={examFields}
        initial={initial}
        backHref="/admin/exams"
        submitLabel={id ? "Save changes" : "Create exam"}
        onSubmit={async (dto) => {
          if (id) await api.updateExam(id, dto);
          else await api.createExam(dto);
          router.push("/admin/exams");
        }}
      >
        {(form, set) => (
          <>
            <ExamSubjectsEditor value={form.subjects as SubjectRow[] | undefined} onChange={(v) => set("subjects", v)} />
            <SeoEditor value={form.seo as Record<string, unknown> | undefined} onChange={(v) => set("seo", v)} />
          </>
        )}
      </AdminForm>
    </PageSkeleton>
  );
}

// ─── Blogs ─────────────────────────────────────────────────────────────────
const blogColumns: AdminColumn<Row>[] = [
  { key: "title", label: "Title", sortable: true, render: (r) => <p className="max-w-[28ch] truncate font-bold text-foreground">{String(r.title ?? "")}</p> },
  { key: "category", label: "Category", render: (r) => <span className="text-muted-foreground">{String(r.category ?? "—")}</span> },
  { key: "author", label: "Author", render: (r) => <span className="text-muted-foreground">{String(r.author ?? "—")}</span> },
  { key: "readMinutes", label: "Read", render: (r) => <span className="text-muted-foreground">{num(r.readMinutes) === "" ? "—" : `${String(r.readMinutes)}m`}</span> },
  { key: "published", label: "Status", render: (r) => <PubBadge published={r.published} /> },
];

export function BlogsListPage() {
  useAdminTitle("Blog Posts");
  return (
    <AdminList<Row>
      title="Blog Posts"
      description="Articles, study plans and strategy notes"
      columns={blogColumns}
      newHref="/admin/blogs/new"
      newLabel="Add post"
      editHref={(id) => `/admin/blogs/${id}/edit`}
      fetchList={(q, page, perPage) => api.listBlogs(q, page, perPage) as Promise<PageResult<Row>>}
      seed={() => seedBlogs as unknown as Row[]}
      onDelete={async (id) => { await api.deleteBlog(id); }}
      searchPlaceholder="Search posts…"
    />
  );
}

export function BlogFormPage({ id }: { id?: string }) {
  useAdminTitle(id ? "Edit Blog Post" : "New Blog Post");
  const router = useRouter();
  const { initial, loading, notFound } = useAdminRecord(id, api.getBlog, () => seedBlogs as unknown as Row[]);
  return (
    <PageSkeleton title="Blog post" loading={loading} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Blog Post" : "New Blog Post"}
        fields={blogFields}
        initial={initial}
        backHref="/admin/blogs"
        submitLabel={id ? "Save changes" : "Create post"}
        onSubmit={async (dto) => {
          if (id) await api.updateBlog(id, dto);
          else await api.createBlog(dto);
          router.push("/admin/blogs");
        }}
      >
        {(form, set) => <BlogContentEditor value={normBlocks(form.content)} onChange={(v) => set("content", v)} />}
      </AdminForm>
    </PageSkeleton>
  );
}

// ─── Shared form-page helpers ──────────────────────────────────────────────
function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
      <p className="mb-3 font-display text-sm font-extrabold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function PageSkeleton({ title, loading, notFound, children }: { title: string; loading: boolean; notFound: boolean; children: React.ReactNode }) {
  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
        <p className="mt-3 text-sm text-muted-foreground">Loading {title.toLowerCase()}…</p>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="rounded-3xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">This item could not be found.</p>
        <a href={`/admin/${title.toLowerCase()}s`} className="mt-3 inline-block text-sm font-bold text-accent hover:underline">Back to list</a>
      </div>
    );
  }
  return children;
}

function useAdminRecord(id: string | undefined, fetchOne: (id: string) => Promise<Record<string, unknown>>, seedOne: () => Record<string, unknown>[]) {
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitial({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchOne(id);
        if (!cancelled) setInitial(normalizeInitial(row));
      } catch {
        // demo fallback: find in seed data
        const found = seedOne().find((r) => (r as { id?: unknown }).id === id);
        if (!cancelled) {
          if (found) setInitial(normalizeInitial(found));
          else setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, fetchOne, seedOne]);

  return { initial, loading, notFound };
}

function normalizeInitial(row: Record<string, unknown>): Record<string, unknown> {
  // Route to the right normalizer based on which key set the record has.
  if ("priceMap" in row || "prices" in row) {
    return {
      ...toForm(courseFields, row),
      prices: normPrices(row),
      curriculum: normCurriculum(row),
      learningOutcomes: listOf(row.learningOutcomes),
      requirements: listOf(row.requirements),
      whoIsFor: listOf(row.whoIsFor),
      faq: Array.isArray(row.faq) ? row.faq : [],
      seo: (row.seo as Record<string, unknown>) ?? {},
    };
  }
  if ("subjects" in row) {
    return { ...toForm(examFields, row), priceAmount: num(row.priceAmount), subjects: normSubjects(row), seo: (row.seo as Record<string, unknown>) ?? {} };
  }
  if ("pdfPrice" in row) {
    return { ...toForm(bookFields, row), pdfPrice: num(row.pdfPrice), hardcopyPrice: num(row.hardcopyPrice), seo: (row.seo as Record<string, unknown>) ?? {} };
  }
  return { ...toForm(blogFields, row), content: normBlocks(row.content), seo: (row.seo as Record<string, unknown>) ?? {} };
}

// ─── Users ─────────────────────────────────────────────────────────────────
export function UsersPage() {
  useAdminTitle("Users");
  const toast = useToast();
  const perPage = 10;
  const [rows, setRows] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [confirm, setConfirm] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoUsers, setDemoUsers] = useState<AppUser[]>(seedUsers);

  const load = useCallback(async () => {
    try {
      const res = await api.listUsers(q, page, perPage);
      setRows(res.items);
      setTotal(res.total);
      setMode("live");
    } catch {
      const all = demoUsers.filter((u) => {
        const okQ = !q || JSON.stringify(u).toLowerCase().includes(q.toLowerCase());
        const okR = !role || u.role === role;
        const okS = !status || u.status === status;
        return okQ && okR && okS;
      });
      setTotal(all.length);
      setRows(all.slice((page - 1) * perPage, page * perPage));
      setMode("demo");
    }
  }, [q, role, status, page, demoUsers]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function saveUser(dto: Record<string, unknown>) {
    if (!editing) return;
    setBusy(true);
    if (mode === "demo") {
      setDemoUsers((u) => u.map((x) => (x.id === editing.id ? { ...x, ...(dto as Partial<AppUser>) } : x)));
      setEditing(null);
      toast.success("User updated (demo)");
      load();
      setBusy(false);
      return;
    }
    try {
      await api.updateUser(editing.id, dto as Partial<AppUser>);
      toast.success("User updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction() {
    if (!confirm) return;
    setBusy(true);
    const nextStatus = confirm.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (mode === "demo") {
      setDemoUsers((u) => u.map((x) => (x.id === confirm.id ? { ...x, status: nextStatus as AppUser["status"] } : x)));
      setConfirm(null);
      toast.success(nextStatus === "ACTIVE" ? "User activated" : "User suspended");
      load();
      setBusy(false);
      return;
    }
    try {
      await api.updateUser(confirm.id, { status: nextStatus });
      toast.success(nextStatus === "ACTIVE" ? "User activated" : "User suspended");
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const roleTone = (r: string): "danger" | "sky" | "muted" => (r === "ADMIN" || r === "SUPER_ADMIN" ? "danger" : r === "TEACHER" ? "sky" : "muted");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage learners, teachers and admins</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search users…" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
            <option value="">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>
      {mode === "demo" && <p className="mt-2 text-xs text-muted-foreground">API unreachable — showing demo users.</p>}

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-bold">User</th>
                <th className="px-5 py-3 font-bold">Role</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Verified</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3">
                    <p className="font-bold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.phone}</p>
                  </td>
                  <td className="px-5 py-3"><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                  <td className="px-5 py-3">{u.status === "ACTIVE" ? <Badge tone="success">ACTIVE</Badge> : <Badge tone="danger">{u.status}</Badge>}</td>
                  <td className="px-5 py-3">{u.verified ? <Badge tone="success">Yes</Badge> : <Badge tone="muted">No</Badge>}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => setEditing(u)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-accent hover:text-accent">Edit</button>
                      <button type="button" onClick={() => setConfirm(u)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:border-danger">
                        {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                      <button type="button" onClick={() => setDeleting(u)} className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/20">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />
      </div>

      {editing && (
        <AdminModal open onClose={() => setEditing(null)} title="Edit user">
          <UserFields user={editing} onSave={saveUser} busy={busy} onClose={() => setEditing(null)} />
        </AdminModal>
      )}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.status === "ACTIVE" ? "Suspend user" : "Activate user"}
        message={confirm ? `Are you sure you want to ${confirm.status === "ACTIVE" ? "suspend" : "activate"} ${confirm.name}?` : ""}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmAction}
        busy={busy}
        confirmLabel={confirm?.status === "ACTIVE" ? "Suspend" : "Activate"}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user permanently"
        message={deleting ? `Are you sure you want to PERMANENTLY DELETE "${deleting.name}" (${deleting.phone})? This will remove ALL their data including orders, enrollments, progress, and reviews. This action CANNOT be undone!` : ""}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await api.deleteUser(deleting.id);
            toast.success(`${deleting.name} permanently deleted`);
            setDeleting(null);
            load();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
        confirmLabel="Delete permanently"
      />
    </div>
  );
}

function UserFields({ user, onSave, onClose, busy }: { user: AppUser; onSave: (dto: Record<string, unknown>) => void; onClose: () => void; busy: boolean }) {
  const [form, setForm] = useState<Record<string, unknown>>({
    name: user.name,
    nameBn: user.nameBn ?? "",
    email: user.email ?? "",
    phone: user.phone,
    role: user.role,
    status: user.status,
    verified: user.verified,
  });
  const fields: FieldDef[] = [
    { name: "name", label: "Name", span2: true },
    { name: "nameBn", label: "Name (Bangla)" },
    { name: "email", label: "Email" },
    { name: "phone", label: "Phone" },
    { name: "role", label: "Role", type: "select", options: ["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"] },
    { name: "status", label: "Status", type: "select", options: ["ACTIVE", "SUSPENDED", "BANNED"] },
    { name: "verified", label: "Verified", type: "checkbox" },
  ];
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted">Cancel</button>
        <button type="button" onClick={() => onSave(form)} disabled={busy} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Orders ────────────────────────────────────────────────────────────────
export function OrdersPage() {
  useAdminTitle("Orders");
  const toast = useToast();
  const perPage = 10;
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [details, setDetails] = useState<Order | null>(null);
  const [demoOrdersState, setDemoOrdersState] = useState<Order[]>(adminOrders);

  const load = useCallback(async () => {
    try {
      const res = await api.listOrders(status || undefined, page, perPage);
      setRows(res.items);
      setTotal(res.total);
      setMode("live");
    } catch {
      const all = demoOrdersState.filter((o) => {
        const okS = !status || o.status === status;
        const d = new Date(o.createdAt);
        const okFrom = !from || d >= new Date(from);
        const okTo = !to || d <= new Date(to + "T23:59:59");
        return okS && okFrom && okTo;
      });
      setTotal(all.length);
      setRows(all.slice((page - 1) * perPage, page * perPage));
      setMode("demo");
    }
  }, [status, from, to, page, demoOrdersState]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function changeStatus(order: Order, next: Order["status"]) {
    setBusyId(order.id);
    if (mode === "demo") {
      setDemoOrdersState((o) => o.map((x) => (x.id === order.id ? { ...x, status: next } : x)));
      setDetails((d) => (d && d.id === order.id ? { ...d, status: next } : d));
      toast.success(`Order ${next}`);
      load();
      setBusyId(null);
      return;
    }
    try {
      await api.setOrderStatus(order.id, next);
      setDetails((d) => (d && d.id === order.id ? { ...d, status: next } : d));
      toast.success(`Order marked ${next}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  const statusTone = (s: string): "success" | "accent" | "danger" | "muted" => (s === "PAID" ? "success" : s === "REFUNDED" ? "accent" : s === "FAILED" ? "danger" : "muted");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and update order payments</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            From
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground outline-none focus:border-accent" />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            To
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground outline-none focus:border-accent" />
          </label>
        </div>
      </div>
      {mode === "demo" && <p className="mt-2 text-xs text-muted-foreground">API unreachable — showing demo orders.</p>}

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-bold">Order</th>
                <th className="px-5 py-3 font-bold">Item</th>
                <th className="px-5 py-3 font-bold">Method</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Date</th>
                <th className="px-5 py-3 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setDetails(o)}>
                  <td className="px-5 py-3 font-mono text-xs font-bold text-foreground">{o.id}</td>
                  <td className="max-w-[28ch] truncate px-5 py-3 text-muted-foreground">{o.productTitle}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{o.method}</td>
                  <td className="px-5 py-3"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-BD")}</td>
                  <td className="px-5 py-3 text-right font-bold text-foreground">{formatBdt(o.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />
      </div>

      {details && (
        <AdminModal open onClose={() => setDetails(null)} title={`Order ${details.id}`}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Item", details.productTitle],
              ["Type", details.productType],
              ["Product ID", details.productId],
              ["Amount", formatBdt(details.amount)],
              ["Method", details.method],
              ["Transaction", details.txId || "—"],
              ["Date", new Date(details.createdAt).toLocaleString("en-BD")],
              ["Status", details.status],
            ].map(([k, v]) => (
              <div key={k} className={cn(k === "Item" && "col-span-2")}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update status</p>
            <div className="flex flex-wrap gap-2">
              {(["PENDING", "PAID", "FAILED", "REFUNDED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busyId === details.id || details.status === s}
                  onClick={() => changeStatus(details, s)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40",
                    details.status === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent hover:text-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

// ─── Reviews ───────────────────────────────────────────────────────────────
const demoReviews = [
  { id: "rv1", user: { name: "Rafiqul Islam" }, productType: "course", productId: "crs-bcs-prelim", rating: 5, text: "Exactly the same pattern as the board paper.", status: "PENDING", createdAt: "2026-01-29" },
  { id: "rv2", user: { name: "Nusrat Jahan" }, productType: "book", productId: "bk-bcs-bangla", rating: 4, text: "Explanations are in easy Bangla — very readable.", status: "PENDING", createdAt: "2026-01-28" },
  { id: "rv3", user: { name: "Sabbir Hossain" }, productType: "exam", productId: "exam-pkg-ntrca", rating: 5, text: "Negative-marking simulator is the best feature.", status: "APPROVED", createdAt: "2026-01-25" },
];

export function ReviewsPage() {
  useAdminTitle("Reviews");
  const toast = useToast();
  const [filter, setFilter] = useState("PENDING");
  const [rows, setRows] = useState<typeof demoReviews>([]);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [demoState, setDemoState] = useState(demoReviews);

  const load = useCallback(async () => {
    try {
      const res = await api.listReviews(filter, 1, 50);
      setRows(res.items as typeof demoReviews);
      setMode("live");
    } catch {
      setRows(demoState.filter((r) => filter === "ALL" || r.status === filter));
      setMode("demo");
    }
  }, [filter, demoState]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function moderate(id: string, approve: boolean) {
    if (mode === "demo") {
      setDemoState((r) => r.map((x) => (x.id === id ? { ...x, status: approve ? "APPROVED" : "REJECTED" } : x)));
      toast.success(approve ? "Review approved" : "Review rejected");
      load();
      return;
    }
    try {
      if (approve) await api.approveReview(id);
      else await api.rejectReview(id);
      toast.success(approve ? "Review approved" : "Review rejected");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Moderate learner reviews</p>
        </div>
        <div className="flex gap-1.5">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors", filter === s ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No reviews here.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{r.user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{r.productType} · {r.productId} · {r.rating}★ · {new Date(r.createdAt ?? "").toLocaleDateString("en-BD")}</p>
                </div>
                <Badge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "accent"}>{r.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">“{r.text}”</p>
              {r.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => moderate(r.id, true)} className="rounded-lg bg-success px-4 py-2 text-xs font-bold text-success-foreground transition-colors hover:opacity-90">Approve</button>
                  <button type="button" onClick={() => moderate(r.id, false)} className="rounded-lg bg-danger px-4 py-2 text-xs font-bold text-danger-foreground transition-colors hover:opacity-90">Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {mode === "demo" && <p className="mt-3 text-xs text-muted-foreground">API unreachable — moderation is demo-only.</p>}
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────
export function SettingsPage() {
  useAdminTitle("Settings");
  const toast = useToast();
  const [form, setForm] = useState({
    siteName: "Shohoz Skill",
    tagline: "Learn to Earn",
    supportEmail: "support@shohozskill.com",
    phone: "+880 1700-000000",
    address: "Level 4, Dhanmondi, Dhaka 1209, Bangladesh",
    maxDevices: "2",
  });
  const inputCls = "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent";
  const fields: { key: keyof typeof form; label: string; span2?: boolean }[] = [
    { key: "siteName", label: "Site name", span2: true },
    { key: "tagline", label: "Tagline", span2: true },
    { key: "supportEmail", label: "Support email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address", span2: true },
    { key: "maxDevices", label: "Max devices" },
  ];
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Platform-wide configuration.</p>
      <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.key} className={cn("block", f.span2 && "sm:col-span-2")}>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</span>
              <input value={form[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} className={inputCls} />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => toast.success("Settings saved (demo — server persistence with API)")}
          className="mt-6 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  useAdminTitle("Dashboard");
  const [stats, setStats] = useState<Record<string, number | string> | null>(null);
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r] = await Promise.all([getAdminStats(), getAdminRevenue()]);
        if (cancelled) return;
        setStats(s as Record<string, number | string>);
        setRevenue(r);
      } catch {
        if (cancelled) return;
        setStats(adminStats as unknown as Record<string, number | string>);
        setRevenue(revenueSeries.map((x) => ({ month: x.label, revenue: x.revenue * 1000 })));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const max = Math.max(1, ...(revenue?.map((r) => r.revenue) ?? [1]));
  const kpis = [
    { label: "Total users", value: stats ? String(stats.totalUsers ?? "—") : "—" },
    { label: "Active subscriptions", value: stats ? String(stats.activeSubscriptions ?? "—") : "—" },
    { label: "Revenue (30d)", value: stats ? formatBdt(Number(stats.revenue30d ?? 0)) : "—" },
    { label: "Pending orders", value: stats ? String(stats.pendingOrders ?? "—") : "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                <p className="font-display text-2xl font-extrabold text-foreground">{k.value}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-extrabold text-foreground">Revenue — last 12 months</h2>
            <div className="mt-6 flex h-44 items-end gap-1.5 sm:gap-2">
              {revenue?.map((r) => (
                <div key={r.month} className="group relative flex flex-1 flex-col items-center justify-end">
                  <span className="mb-1 hidden text-[10px] font-bold text-muted-foreground group-hover:block">{formatBdt(r.revenue)}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-accent/70 to-accent transition-all group-hover:from-accent" style={{ height: `${Math.round((r.revenue / max) * 100)}%` }} title={`${r.month}: ${formatBdt(r.revenue)}`} />
                  <span className="mt-1.5 text-[10px] font-semibold text-muted-foreground">{r.month}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
