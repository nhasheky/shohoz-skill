"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  PaymentMethodsEditor,
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
import type { AppUser, Order, ContactMessage } from "@/lib/types";

type Row = { id: string } & Record<string, unknown>;

// ─── Field definitions ─────────────────────────────────────────────────────
const courseFields: FieldDef[] = [
  { name: "slug", label: "Slug", span2: true, help: "Leave blank to auto-generate from the title." },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "category", label: "Category", required: true, type: "select", options: [] },
  { name: "categoryBn", label: "Category (Bangla)" },
  { name: "tagline", label: "Tagline", required: true, span2: true },
  { name: "description", label: "Description", type: "richtext", required: true, span2: true },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "image", span2: true },
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
  { name: "suggested", label: "Suggested products", type: "suggested", span2: true, help: "Pick which books/exams show as suggestions under this course. Empty = auto." },
];

const bookFields: FieldDef[] = [
  { name: "slug", label: "Slug", span2: true, help: "Leave blank to auto-generate from the title." },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "subtitle", label: "Subtitle", span2: true },
  { name: "description", label: "Description", type: "richtext", required: true, span2: true },
  { name: "thumbnailUrl", label: "Cover image", type: "image", span2: true, help: "Shown on cards. Clicking the cover opens the demo PDF." },
  { name: "demoPdfUrl", label: "Demo PDF (free sample)", type: "file", span2: true, help: "A few sample pages buyers can read for free." },
  { name: "category", label: "Category", required: true },
  { name: "author", label: "Author", required: true },
  { name: "publisher", label: "Publisher" },
  { name: "edition", label: "Edition" },
  { name: "language", label: "Language", type: "select", options: ["En", "Bn", "Mixture"] },
  { name: "pages", label: "Pages", type: "number", required: true },
  { name: "bookFormat", label: "Format", type: "select", options: ["PDF", "Hardcopy"], required: true, help: "Choose ONE — a book is either an online PDF or a printed hardcopy." },
  { name: "pdfPrice", label: "Online PDF price (৳)", type: "number", help: "Set the price for the online PDF.", showWhen: (f) => f.bookFormat === "PDF" },
  { name: "pdfFileUrl", label: "Full PDF (owners only)", type: "file", span2: true, help: "The complete book, read in the secure viewer (no download). Required for the PDF format.", showWhen: (f) => f.bookFormat === "PDF" },
  { name: "hardcopyPrice", label: "Hardcopy price (৳)", type: "number", help: "Set the price for the printed hardcopy (demo PDF only — no full PDF).", showWhen: (f) => f.bookFormat === "Hardcopy" },
  { name: "samplePages", label: "Sample pages", type: "number" },
  { name: "students", label: "Students", type: "number" },
  { name: "rating", label: "Rating", type: "number" },
  { name: "reviewCount", label: "Review count", type: "number" },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "published", label: "Published", type: "checkbox" },
  { name: "suggested", label: "Suggested products", type: "suggested", span2: true, help: "Pick which courses/exams show as suggestions under this book. Empty = auto." },
];

const examFields: FieldDef[] = [
  { name: "slug", label: "Slug", span2: true, help: "Leave blank to auto-generate from the title." },
  { name: "title", label: "Title", required: true, span2: true },
  { name: "titleBn", label: "Title (Bangla)" },
  { name: "tagline", label: "Tagline", required: true, span2: true },
  { name: "description", label: "Description", type: "richtext", required: true, span2: true },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "image", span2: true },
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
  { name: "suggested", label: "Suggested products", type: "suggested", span2: true, help: "Pick which books/courses show as suggestions under this exam. Empty = auto." },
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
  const [cats, setCats] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPage("categories")
      .then((p) => {
        if (cancelled) return;
        const items = (p.data as { items?: { label?: string }[] })?.items ?? [];
        setCats(items.map((c) => c.label ?? "").filter(Boolean));
      })
      .catch(() => { if (!cancelled) setCats([]); });
    return () => { cancelled = true; };
  }, []);

  const fields = useMemo(() => {
    const current = typeof initial?.category === "string" ? (initial.category as string) : "";
    const opts = Array.from(new Set([...(cats ?? []), current].filter(Boolean)));
    return courseFields.map((f) => (f.name === "category" ? { ...f, type: "select" as const, options: opts } : f));
  }, [cats, initial]);

  const ready = !loading && cats !== null;
  return (
    <PageSkeleton title="Course" loading={!ready} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Course" : "New Course"}
        subtitle="Courses power the entire learning experience."
        fields={fields}
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
            <PaymentMethodsEditor value={listOf(form.allowedPaymentMethods)} onChange={(v) => set("allowedPaymentMethods", v)} />
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
  { key: "pdfPrice", label: "Formats", render: (r) => {
    const pdf = num(r.pdfPrice);
    const hard = num(r.hardcopyPrice);
    const parts: string[] = [];
    if (pdf !== "") parts.push(`PDF ${formatBdt(pdf as number)}`);
    if (hard !== "") parts.push(`HC ${formatBdt(hard as number)}`);
    return <span className="font-bold text-foreground">{parts.length ? parts.join(" · ") : "—"}</span>;
  } },
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
  const hasPdfFile = Boolean((initial as Record<string, unknown> | null)?.hasPdfFile);
  const rec = initial as Record<string, unknown> | null;
  const hasRealPdf = rec != null && rec.pdfPrice != null && Number(rec.pdfPrice) > 0;
  const formInitial = rec
    ? { ...rec, bookFormat: hasRealPdf ? "PDF" : rec.hardcopyPrice != null ? "Hardcopy" : rec.pdfPrice != null ? "PDF" : "" }
    : rec;
  return (
    <PageSkeleton title="Book" loading={loading} notFound={notFound}>
      <AdminForm
        title={id ? "Edit Book" : "New Book"}
        fields={bookFields}
        initial={formInitial}
        backHref="/admin/books"
        submitLabel={id ? "Save changes" : "Create book"}
        onSubmit={async (dto) => {
          delete dto.hasPdfFile;
          delete dto.bookFormat;
          // A blank price means "do not sell this format" → persist an explicit null
          // so an existing price can also be cleared.
          if (dto.pdfPrice === undefined) dto.pdfPrice = null;
          if (dto.hardcopyPrice === undefined) dto.hardcopyPrice = null;
          if (!dto.pdfPrice && !dto.hardcopyPrice) {
            throw new Error("Choose a format — set an online PDF price OR a hardcopy price.");
          }
          if (dto.pdfPrice && dto.hardcopyPrice) {
            throw new Error("Choose either online PDF or hardcopy — not both.");
          }
          if (dto.pdfPrice && !dto.pdfFileUrl && !hasPdfFile) {
            throw new Error("Upload the full PDF file when selling the online PDF.");
          }
          if (dto.hardcopyPrice) {
            // Hardcopy books only ship the free demo PDF (no full online PDF).
            dto.pdfFileUrl = undefined;
          }
          if (id) await api.updateBook(id, dto);
          else await api.createBook(dto);
          router.push("/admin/books");
        }}
      >
        {(form, set) => (
          <>
            {hasPdfFile && <p className="mt-4 rounded-xl bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">A full PDF is already uploaded. Leave the field blank to keep it, or upload a new file to replace it.</p>}
            <PaymentMethodsEditor
              value={listOf(form.allowedPaymentMethods)}
              onChange={(v) => set("allowedPaymentMethods", v)}
              hint="Optional. For the PDF only SSLCOMMERZ applies; hardcopy defaults to SSLCOMMERZ + Cash on Delivery."
            />
            <SeoEditor value={form.seo as Record<string, unknown> | undefined} onChange={(v) => set("seo", v)} />
          </>
        )}
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
            <PaymentMethodsEditor value={listOf(form.allowedPaymentMethods)} onChange={(v) => set("allowedPaymentMethods", v)} />
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
      allowedPaymentMethods: listOf(row.allowedPaymentMethods),
      seo: (row.seo as Record<string, unknown>) ?? {},
    };
  }
  if ("subjects" in row) {
    return { ...toForm(examFields, row), priceAmount: num(row.priceAmount), subjects: normSubjects(row), allowedPaymentMethods: listOf(row.allowedPaymentMethods), seo: (row.seo as Record<string, unknown>) ?? {} };
  }
  if ("pdfPrice" in row) {
    return {
      ...toForm(bookFields, row),
      pdfPrice: num(row.pdfPrice),
      hardcopyPrice: num(row.hardcopyPrice),
      allowedPaymentMethods: listOf(row.allowedPaymentMethods),
      seo: (row.seo as Record<string, unknown>) ?? {},
      hasPdfFile: Boolean(row.hasPdfFile),
    };
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

  const customerName = (o: Order) => o.user?.name ?? o.guestName ?? "Guest";
  const customerPhone = (o: Order) => o.user?.phone ?? o.guestPhone ?? "—";
  const customerEmail = (o: Order) => o.user?.email ?? o.guestEmail ?? "—";
  const isGuest = (o: Order) => !o.userId && !o.user;

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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-bold">Order ID</th>
                <th className="px-4 py-3 font-bold">Customer</th>
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Qty</th>
                <th className="px-4 py-3 font-bold">Payment</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
                <th className="px-4 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setDetails(o)}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{o.id.slice(-10)}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground">{customerName(o)}</p>
                    <p className="text-[11px] text-muted-foreground">{isGuest(o) ? "Guest" : "Registered"}</p>
                  </td>
                  <td className="max-w-[24ch] truncate px-4 py-3 text-muted-foreground">{o.productTitle}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{customerPhone(o)}</td>
                  <td className="max-w-[20ch] truncate px-4 py-3 text-xs text-muted-foreground">{customerEmail(o)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.productType === "book" ? o.quantity ?? 1 : "—"}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-muted-foreground">{o.paymentMethod ?? o.method}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{formatBdt(o.total ?? o.amount)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-BD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />
      </div>

      {details && (
        <AdminModal open onClose={() => setDetails(null)} title={`Order ${details.id}`} wide>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Customer", customerName(details)],
              ["Customer type", isGuest(details) ? "Guest checkout" : "Registered"],
              ["Phone", customerPhone(details)],
              ["Email", customerEmail(details)],
              ["Item", details.productTitle],
              ["Type", `${details.productType}${details.variant ? ` · ${details.variant}` : ""}`],
              ["Quantity", String(details.productType === "book" ? details.quantity ?? 1 : 1)],
              ["Amount", formatBdt(details.amount)],
              ["Delivery", details.isPhysical ? `${formatBdt(details.deliveryCharge ?? 0)} (${details.region ?? "—"})` : "—"],
              ["Total bill", formatBdt(details.total ?? details.amount)],
              ["Payment method", details.paymentMethod ?? details.method],
              ["Transaction", details.txId || "—"],
              ["Address", details.address || "—"],
              ["Date", new Date(details.createdAt).toLocaleString("en-BD")],
              ["Status", details.status],
            ].map(([k, v]) => (
              <div key={k} className={cn(k === "Item" || k === "Address" ? "col-span-2" : "")}>
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
type ReviewDraft = {
  id?: string;
  productType: "course" | "book" | "exam";
  productId: string;
  authorName: string;
  rating: number;
  text: string;
  imageUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

const EMPTY_REVIEW: ReviewDraft = { productType: "book", productId: "", authorName: "", rating: 5, text: "", imageUrl: "", status: "APPROVED" };

async function resizeReviewImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
  const scale = Math.min(1, 900 / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

export function ReviewsPage() {
  useAdminTitle("Reviews");
  const toast = useToast();
  const [filter, setFilter] = useState("ALL");
  const [rows, setRows] = useState<api.AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<{ type: string; id: string; title: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listReviews(filter, 1, 200);
      setRows(res.items);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([api.listCourses("", 1, 200), api.listBooks("", 1, 200), api.listExams("", 1, 200)])
      .then(([c, b, e]) => {
        setOptions([
          ...c.items.map((x) => ({ type: "course", id: String(x.id), title: String(x.title) })),
          ...b.items.map((x) => ({ type: "book", id: String(x.id), title: String(x.title) })),
          ...e.items.map((x) => ({ type: "exam", id: String(x.id), title: String(x.title) })),
        ]);
      })
      .catch(() => {});
  }, []);

  function openEdit(r: api.AdminReview) {
    setDraft({
      id: r.id,
      productType: (r.productType as ReviewDraft["productType"]) ?? "book",
      productId: r.productId,
      authorName: r.authorName ?? r.user?.name ?? "",
      rating: r.rating,
      text: r.text,
      imageUrl: r.imageUrl ?? "",
      status: (r.status as ReviewDraft["status"]) ?? "APPROVED",
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.text.trim()) {
      toast.error("Review text is required.");
      return;
    }
    if (!draft.productId) {
      toast.error("Choose a product.");
      return;
    }
    const dto: Record<string, unknown> = {
      productType: draft.productType,
      productId: draft.productId,
      authorName: draft.authorName.trim() || undefined,
      rating: draft.rating,
      text: draft.text.trim(),
      imageUrl: draft.imageUrl || undefined,
      status: draft.status,
    };
    setBusy(true);
    try {
      if (draft.id) await api.updateReview(draft.id, dto);
      else await api.createReview(dto);
      toast.success("Review saved");
      setDraft(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: api.AdminReview) {
    if (typeof window !== "undefined" && !window.confirm("Delete this review?")) return;
    try {
      await api.deleteReview(r.id);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function moderate(r: api.AdminReview, approve: boolean) {
    try {
      if (approve) await api.approveReview(r.id);
      else await api.rejectReview(r.id);
      toast.success(approve ? "Approved" : "Rejected");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  const productOptions = options.filter((o) => o.type === draft?.productType);
  const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add, edit, moderate and delete reviews for any book, course or exam.</p>
        </div>
        <button type="button" onClick={() => setDraft({ ...EMPTY_REVIEW })} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">+ Add review</button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button key={s} type="button" onClick={() => setFilter(s)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors", filter === s ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground")}>{s}</button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">No reviews here.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.user?.name ?? r.authorName ?? "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{r.productType} · {r.productId} · {r.rating}★ · {new Date(r.createdAt).toLocaleDateString("en-BD")}</p>
                  </div>
                </div>
                <Badge tone={r.status === "APPROVED" ? "success" : r.status === "REJECTED" ? "danger" : "accent"}>{r.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">“{r.text}”</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== "APPROVED" && <button type="button" onClick={() => moderate(r, true)} className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-success-foreground hover:opacity-90">Approve</button>}
                {r.status !== "REJECTED" && <button type="button" onClick={() => moderate(r, false)} className="rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-danger-foreground hover:opacity-90">Reject</button>}
                <button type="button" onClick={() => openEdit(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">Edit</button>
                <button type="button" onClick={() => remove(r)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AdminModal open={Boolean(draft)} title={draft?.id ? "Edit review" : "Add review"} onClose={() => setDraft(null)} wide>
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product type</span>
                <select value={draft.productType} onChange={(e) => setDraft({ ...draft, productType: e.target.value as ReviewDraft["productType"], productId: "" })} className={inputCls}>
                  <option value="course">Course</option>
                  <option value="book">Book</option>
                  <option value="exam">Exam</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</span>
                <select value={draft.productId} onChange={(e) => setDraft({ ...draft, productId: e.target.value })} className={inputCls}>
                  <option value="">— select —</option>
                  {productOptions.map((o) => (<option key={o.id} value={o.id}>{o.title}</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Author name</span>
                <input value={draft.authorName} onChange={(e) => setDraft({ ...draft, authorName: e.target.value })} placeholder="Learner name" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rating</span>
                <select value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} className={inputCls}>
                  {[5, 4, 3, 2, 1].map((n) => (<option key={n} value={n}>{n} ★</option>))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ReviewDraft["status"] })} className={inputCls}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review text *</span>
              <textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} rows={4} className={cn(inputCls, "resize-y")} />
            </label>
            <div>
              {draft.imageUrl ? (
                <div className="relative w-max">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.imageUrl} alt="" className="h-24 rounded-xl object-cover" />
                  <button type="button" onClick={() => setDraft({ ...draft, imageUrl: "" })} className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-danger-foreground" aria-label="Remove photo">✕</button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                  📷 Add photo (optional)
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, imageUrl: await resizeReviewImage(f) }); }} />
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button type="button" onClick={() => setDraft(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">Cancel</button>
              <button type="button" onClick={save} disabled={busy} className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-60">{busy ? "Saving…" : "Save review"}</button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  const [method, setMethod] = useState<"link" | "upload">("link");
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setMethod("link")} className={cn("text-xs transition-colors", method === "link" ? "font-bold text-accent" : "text-muted-foreground hover:text-foreground")}>Link</button>
          <button type="button" onClick={() => setMethod("upload")} className={cn("text-xs transition-colors", method === "upload" ? "font-bold text-accent" : "text-muted-foreground hover:text-foreground")}>Upload</button>
        </div>
      </div>
      {method === "link" ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent" placeholder="https://..." />
      ) : (
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => onChange(ev.target?.result as string);
          reader.readAsDataURL(file);
        }} className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-1 file:text-xs file:font-semibold file:text-accent-foreground hover:file:bg-accent-hover focus:border-accent" />
      )}
      {value && <img src={value} alt="" className="mt-3 h-14 w-auto max-w-full rounded border border-border object-contain bg-muted" />}
    </div>
  );
}

// ─── Settings ──────────────────────────────────────────────────────────────
const SETTINGS_DEFAULTS = {
  siteTitle: "Shohoz Skill",
  siteTitleBn: "সহজ স্কিল",
  logoUrl: "",
  faviconUrl: "",
  metaDescription:
    "Bangladesh's fastest learning platform for government-job preparation — courses, MCQ exams, and books. Learn to Earn.",
  ogImageUrl: "",
  keywords: "",
  supportEmail: "support@shohozskill.com",
  supportPhone: "+880 1700-000000",
  address: "Level 4, Dhanmondi, Dhaka 1209, Bangladesh",
  deliveryChargeDhaka: "60",
  deliveryChargeOutside: "120",
  codEnabled: true,
  sslcommerzEnabled: true,
  reviewScrollSeconds: "6",
};

type SettingsForm = typeof SETTINGS_DEFAULTS;

export function SettingsPage() {
  useAdminTitle("Site Settings");
  const toast = useToast();
  const [form, setForm] = useState<SettingsForm>(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "demo">("demo");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await api.getSiteSettings();
        if (cancelled) return;
        setForm({
          siteTitle: s.siteTitle ?? SETTINGS_DEFAULTS.siteTitle,
          siteTitleBn: s.siteTitleBn ?? SETTINGS_DEFAULTS.siteTitleBn,
          logoUrl: s.logoUrl ?? "",
          faviconUrl: s.faviconUrl ?? "",
          metaDescription: s.metaDescription ?? SETTINGS_DEFAULTS.metaDescription,
          ogImageUrl: s.ogImageUrl ?? "",
          keywords: (s.keywords ?? []).join(", "),
          supportEmail: s.supportEmail ?? SETTINGS_DEFAULTS.supportEmail,
          supportPhone: s.supportPhone ?? SETTINGS_DEFAULTS.supportPhone,
          address: s.address ?? SETTINGS_DEFAULTS.address,
          deliveryChargeDhaka: String(s.deliveryChargeDhaka ?? 60),
          deliveryChargeOutside: String(s.deliveryChargeOutside ?? 120),
          codEnabled: s.codEnabled ?? true,
          sslcommerzEnabled: s.sslcommerzEnabled ?? true,
          reviewScrollSeconds: String(s.reviewScrollSeconds ?? 6),
        });
        setMode("live");
      } catch {
        setMode("demo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (k: keyof SettingsForm, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));

  async function save() {
    setBusy(true);
    const payload = {
      siteTitle: form.siteTitle,
      siteTitleBn: form.siteTitleBn,
      logoUrl: form.logoUrl,
      faviconUrl: form.faviconUrl,
      metaDescription: form.metaDescription,
      ogImageUrl: form.ogImageUrl,
      keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      address: form.address,
      deliveryChargeDhaka: Number(form.deliveryChargeDhaka) || 0,
      deliveryChargeOutside: Number(form.deliveryChargeOutside) || 0,
      codEnabled: form.codEnabled,
      sslcommerzEnabled: form.sslcommerzEnabled,
      reviewScrollSeconds: Number(form.reviewScrollSeconds) || 6,
    };
    try {
      await api.updateSiteSettings(payload);
      toast.success("Site settings saved");
      setMode("live");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed — is the API running?");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent";
  const textFields: { key: keyof SettingsForm; label: string; span2?: boolean }[] = [
    { key: "siteTitle", label: "Site title" },
    { key: "siteTitleBn", label: "Site title (Bangla)" },
    { key: "keywords", label: "Keywords (comma separated)", span2: true },
    { key: "supportEmail", label: "Support email" },
    { key: "supportPhone", label: "Support phone" },
    { key: "deliveryChargeDhaka", label: "Delivery charge — inside Dhaka (৳)" },
    { key: "deliveryChargeOutside", label: "Delivery charge — outside Dhaka (৳)" },
    { key: "reviewScrollSeconds", label: "Reviews auto-scroll interval (seconds)", span2: true },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Site Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Branding, SEO metadata and delivery charges.</p>
      {mode === "demo" && <p className="mt-2 text-xs text-muted-foreground">API unreachable — showing defaults.</p>}

      {loading ? (
        <div className="mt-8 py-10 text-center text-sm text-muted-foreground">Loading settings…</div>
      ) : (
        <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map((f) => (
              <label key={f.key} className={cn("block", f.span2 && "sm:col-span-2")}>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</span>
                <input value={String(form[f.key])} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
              </label>
            ))}
            
            <ImageUploadField label="Logo" value={form.logoUrl} onChange={(v) => set("logoUrl", v)} className="sm:col-span-2" />
            <ImageUploadField label="Favicon" value={form.faviconUrl} onChange={(v) => set("faviconUrl", v)} className="sm:col-span-2" />
            <ImageUploadField label="OpenGraph image" value={form.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} className="sm:col-span-2" />

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta description</span>
              <textarea rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={cn(inputCls, "resize-y")} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-5 border-t border-border pt-5">
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <input type="checkbox" checked={form.codEnabled} onChange={(e) => set("codEnabled", e.target.checked)} className="h-4 w-4 accent-[#F2A93B]" />
              Cash on Delivery enabled
            </label>
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <input type="checkbox" checked={form.sslcommerzEnabled} onChange={(e) => set("sslcommerzEnabled", e.target.checked)} className="h-4 w-4 accent-[#F2A93B]" />
              SSLCOMMERZ enabled
            </label>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="mt-6 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Pages (CMS content) ─────────────────────────────────────────────────────
const PAGE_META: Record<string, { label: string; hint: string; template: Record<string, any> }> = {
  home: {
    label: "Home",
    hint: "Overrides for the homepage. Leave a field blank to use the default.",
    template: {
      heroEyebrow: "", heroTitle: "", heroDescription: "", heroMetrics: [],
      heroPrimaryLabel: "", heroPrimaryHref: "", heroSecondaryLabel: "", heroSecondaryHref: "", heroSearchPlaceholder: "",
      deviceStrip: [], stats: [], examsSteps: [], testimonials: [], faq: [],
    },
  },
  about: {
    label: "About Us",
    hint: "Story paragraphs, values and milestones.",
    template: { story: [], values: [], milestones: [] },
  },
  contact: {
    label: "Contact Us",
    hint: "Contact details and intro copy.",
    template: { title: "", description: "", email: "", phone: "", address: "", supportHours: "" },
  },
};

const pageInputCls = "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent";

function HomeForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = { ...PAGE_META.home.template, ...(data || {}) };
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });

  const addHeroMetric = () => set("heroMetrics", [...(d.heroMetrics || []), { value: "", label: "" }]);
  const updHeroMetric = (i: number, next: any) => set("heroMetrics", (d.heroMetrics || []).map((x: any, j: number) => j === i ? next : x));
  const remHeroMetric = (i: number) => set("heroMetrics", (d.heroMetrics || []).filter((_: any, j: number) => j !== i));

  const addStat = () => set("stats", [...(d.stats || []), { value: 0, suffix: "", label: "" }]);
  const updStat = (i: number, next: any) => set("stats", (d.stats || []).map((x: any, j: number) => j === i ? next : x));
  const remStat = (i: number) => set("stats", (d.stats || []).filter((_: any, j: number) => j !== i));

  const addExamStep = () => set("examsSteps", [...(d.examsSteps || []), { title: "", description: "" }]);
  const updExamStep = (i: number, next: any) => set("examsSteps", (d.examsSteps || []).map((x: any, j: number) => j === i ? next : x));
  const remExamStep = (i: number) => set("examsSteps", (d.examsSteps || []).filter((_: any, j: number) => j !== i));

  const addTestimonial = () => set("testimonials", [...(d.testimonials || []), { id: `t${Date.now()}`, type: "text", text: "", name: "", role: "", rating: 5, placement: "homepage" }]);
  const updTestimonial = (i: number, next: any) => set("testimonials", (d.testimonials || []).map((x: any, j: number) => j === i ? next : x));
  const remTestimonial = (i: number) => set("testimonials", (d.testimonials || []).filter((_: any, j: number) => j !== i));

  const renderSectionMeta = (keyPrefix: string, label: string) => (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
      <p className="mb-3 font-display text-sm font-extrabold text-foreground">{label} Section</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eyebrow (Small top text)</span>
          <input value={d[`${keyPrefix}Eyebrow`] || ""} onChange={(e) => set(`${keyPrefix}Eyebrow`, e.target.value)} className={pageInputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
          <input value={d[`${keyPrefix}Title`] || ""} onChange={(e) => set(`${keyPrefix}Title`, e.target.value)} className={pageInputCls} />
        </label>
        {keyPrefix !== "blogs" && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
            <textarea rows={2} value={d[`${keyPrefix}Description`] || ""} onChange={(e) => set(`${keyPrefix}Description`, e.target.value)} className={cn(pageInputCls, "resize-y")} />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <p className="mb-3 font-display text-sm font-extrabold text-foreground">Hero Section</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eyebrow</span>
            <input value={d.heroEyebrow || ""} onChange={(e) => set("heroEyebrow", e.target.value)} className={pageInputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input value={d.heroTitle || ""} onChange={(e) => set("heroTitle", e.target.value)} className={pageInputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
            <textarea rows={3} value={d.heroDescription || ""} onChange={(e) => set("heroDescription", e.target.value)} className={cn(pageInputCls, "resize-y")} />
          </label>
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Hero Metrics</p>
            <button type="button" onClick={addHeroMetric} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add Metric</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(d.heroMetrics || []).map((m: any, i: number) => (
              <div key={i} className="relative rounded-xl border border-border bg-card p-2">
                <input value={m.value} onChange={(e) => updHeroMetric(i, { ...m, value: e.target.value })} placeholder="Value (e.g. 62k+)" className={cn(pageInputCls, "mb-1 p-1.5 text-xs")} />
                <input value={m.label} onChange={(e) => updHeroMetric(i, { ...m, label: e.target.value })} placeholder="Label (e.g. Learners)" className={cn(pageInputCls, "p-1.5 text-xs")} />
                <button type="button" onClick={() => remHeroMetric(i)} className="absolute right-1 top-1 text-muted-foreground hover:text-danger">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-foreground">Hero Buttons &amp; Search</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary button label</span><input value={d.heroPrimaryLabel || ""} onChange={(e) => set("heroPrimaryLabel", e.target.value)} className={pageInputCls} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary button link</span><input value={d.heroPrimaryHref || ""} onChange={(e) => set("heroPrimaryHref", e.target.value)} placeholder="/courses" className={pageInputCls} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary button label</span><input value={d.heroSecondaryLabel || ""} onChange={(e) => set("heroSecondaryLabel", e.target.value)} className={pageInputCls} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary button link</span><input value={d.heroSecondaryHref || ""} onChange={(e) => set("heroSecondaryHref", e.target.value)} placeholder="/exams" className={pageInputCls} /></label>
            <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search box placeholder</span><input value={d.heroSearchPlaceholder || ""} onChange={(e) => set("heroSearchPlaceholder", e.target.value)} className={pageInputCls} /></label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <p className="mb-3 font-display text-sm font-extrabold text-foreground">Instant-access strip</p>
        <ListEditor value={listOf(d.deviceStrip)} onChange={(v) => set("deviceStrip", v)} placeholder="One line per entry (e.g. Log in on up to 2 devices)" />
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-extrabold text-foreground">Stats Band</p>
          <button type="button" onClick={addStat} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add Stat</button>
        </div>
        <div className="space-y-2">
          {(d.stats || []).map((s: any, i: number) => (
            <div key={i} className="flex gap-2 rounded-xl border border-border bg-card p-2">
              <input type="number" value={s.value} onChange={(e) => updStat(i, { ...s, value: Number(e.target.value) })} placeholder="Number" className={pageInputCls} />
              <input value={s.suffix} onChange={(e) => updStat(i, { ...s, suffix: e.target.value })} placeholder="Suffix (e.g. +)" className={pageInputCls} />
              <input value={s.label} onChange={(e) => updStat(i, { ...s, label: e.target.value })} placeholder="Label" className={cn(pageInputCls, "w-full flex-1")} />
              <button type="button" onClick={() => remStat(i)} className="px-2 text-muted-foreground hover:text-danger">✕</button>
            </div>
          ))}
        </div>
      </div>

      {renderSectionMeta("categories", "Categories")}
      {renderSectionMeta("courses", "Featured Courses")}
      
      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <p className="mb-3 font-display text-sm font-extrabold text-foreground">Exams Section</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eyebrow</span>
            <input value={d.examsEyebrow || ""} onChange={(e) => set("examsEyebrow", e.target.value)} className={pageInputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
            <input value={d.examsTitle || ""} onChange={(e) => set("examsTitle", e.target.value)} className={pageInputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
            <textarea rows={2} value={d.examsDescription || ""} onChange={(e) => set("examsDescription", e.target.value)} className={cn(pageInputCls, "resize-y")} />
          </label>
        </div>
        <div className="mt-4 border-t border-border/50 pt-4">
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Card heading</span>
            <input value={d.examEngineTitle || ""} onChange={(e) => set("examEngineTitle", e.target.value)} placeholder="How the exam engine works" className={pageInputCls} />
          </label>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">Steps</p>
            <button type="button" onClick={addExamStep} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add Step</button>
          </div>
          <div className="space-y-2">
            {(d.examsSteps || []).map((s: any, i: number) => (
              <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-2 relative">
                <input value={s.title} onChange={(e) => updExamStep(i, { ...s, title: e.target.value })} placeholder="Title" className={pageInputCls} />
                <textarea rows={2} value={s.description} onChange={(e) => updExamStep(i, { ...s, description: e.target.value })} placeholder="Description" className={cn(pageInputCls, "resize-y")} />
                <button type="button" onClick={() => remExamStep(i)} className="absolute right-2 top-2 rounded bg-background p-1 text-muted-foreground hover:text-danger">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renderSectionMeta("books", "Featured Books")}
      {renderSectionMeta("reviews", "Success Stories")}

      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-extrabold text-foreground">Testimonials</p>
          <button type="button" onClick={addTestimonial} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add testimonial</button>
        </div>
        <div className="space-y-3">
          {(d.testimonials || []).map((t: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={t.name || ""} onChange={(e) => updTestimonial(i, { ...t, name: e.target.value })} placeholder="Name" className={pageInputCls} />
                <input value={t.role || ""} onChange={(e) => updTestimonial(i, { ...t, role: e.target.value })} placeholder="Role / batch" className={pageInputCls} />
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rating</span>
                  <input type="number" min={0} max={5} step={0.5} value={t.rating ?? 5} onChange={(e) => updTestimonial(i, { ...t, rating: Number(e.target.value) })} className={pageInputCls} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Placement</span>
                  <select value={t.placement || "homepage"} onChange={(e) => updTestimonial(i, { ...t, placement: e.target.value })} className={pageInputCls}>
                    <option value="homepage">homepage</option>
                    <option value="all">all</option>
                    <option value="product">product</option>
                  </select>
                </label>
                <textarea rows={3} value={t.text || ""} onChange={(e) => updTestimonial(i, { ...t, text: e.target.value })} placeholder="Testimonial text" className={cn(pageInputCls, "sm:col-span-2 resize-y")} />
              </div>
              <button type="button" onClick={() => remTestimonial(i)} className="mt-2 rounded-lg border border-danger/40 px-3 py-1 text-xs font-bold text-danger hover:bg-danger/10">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {renderSectionMeta("blogs", "From the Blog")}
      {renderSectionMeta("faq", "FAQ")}

      <div>
        <FaqEditor value={d.faq} onChange={(v) => set("faq", v)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <p className="mb-3 font-display text-sm font-extrabold text-foreground">Bottom CTA Banner</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badge</span><input value={d.ctaBadge || ""} onChange={(e) => set("ctaBadge", e.target.value)} placeholder="Start today" className={pageInputCls} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span><input value={d.ctaTitle || ""} onChange={(e) => set("ctaTitle", e.target.value)} className={pageInputCls} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span><textarea rows={2} value={d.ctaDescription || ""} onChange={(e) => set("ctaDescription", e.target.value)} className={cn(pageInputCls, "resize-y")} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary label</span><input value={d.ctaPrimaryLabel || ""} onChange={(e) => set("ctaPrimaryLabel", e.target.value)} className={pageInputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary link</span><input value={d.ctaPrimaryHref || ""} onChange={(e) => set("ctaPrimaryHref", e.target.value)} placeholder="/courses" className={pageInputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary label</span><input value={d.ctaSecondaryLabel || ""} onChange={(e) => set("ctaSecondaryLabel", e.target.value)} className={pageInputCls} /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Secondary link</span><input value={d.ctaSecondaryHref || ""} onChange={(e) => set("ctaSecondaryHref", e.target.value)} placeholder="/exams" className={pageInputCls} /></label>
          <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Footnote</span><input value={d.ctaFootnote || ""} onChange={(e) => set("ctaFootnote", e.target.value)} className={pageInputCls} /></label>
        </div>
      </div>
    </div>
  );
}

function AboutForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = { ...PAGE_META.about.template, ...(data || {}) };
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });
  
  const addValue = () => set("values", [...(d.values || []), { title: "", description: "" }]);
  const updValue = (i: number, next: any) => set("values", (d.values || []).map((x: any, j: number) => j === i ? next : x));
  const remValue = (i: number) => set("values", (d.values || []).filter((_: any, j: number) => j !== i));

  const addMilestone = () => set("milestones", [...(d.milestones || []), { year: "", title: "", description: "" }]);
  const updMilestone = (i: number, next: any) => set("milestones", (d.milestones || []).map((x: any, j: number) => j === i ? next : x));
  const remMilestone = (i: number) => set("milestones", (d.milestones || []).filter((_: any, j: number) => j !== i));

  return (
    <div className="space-y-6">
      <ListEditor value={d.story} onChange={(v) => set("story", v)} />
      
      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-extrabold text-foreground">Core Values</p>
          <button type="button" onClick={addValue} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add Value</button>
        </div>
        <div className="space-y-3">
          {(d.values || []).map((v: any, i: number) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
              <div className="flex-1 space-y-2">
                <input value={v.title} onChange={(e) => updValue(i, { ...v, title: e.target.value })} placeholder="Title" className={pageInputCls} />
                <textarea rows={2} value={v.description} onChange={(e) => updValue(i, { ...v, description: e.target.value })} placeholder="Description" className={cn(pageInputCls, "resize-y")} />
              </div>
              <button type="button" onClick={() => remValue(i)} className="p-2 text-muted-foreground hover:text-danger">✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm font-extrabold text-foreground">Milestones</p>
          <button type="button" onClick={addMilestone} className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">Add Milestone</button>
        </div>
        <div className="space-y-3">
          {(d.milestones || []).map((m: any, i: number) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input value={m.year} onChange={(e) => updMilestone(i, { ...m, year: e.target.value })} placeholder="Year" className={pageInputCls} />
                  <input value={m.title} onChange={(e) => updMilestone(i, { ...m, title: e.target.value })} placeholder="Title" className={cn(pageInputCls, "col-span-2")} />
                </div>
                <textarea rows={2} value={m.description} onChange={(e) => updMilestone(i, { ...m, description: e.target.value })} placeholder="Description" className={cn(pageInputCls, "resize-y")} />
              </div>
              <button type="button" onClick={() => remMilestone(i)} className="p-2 text-muted-foreground hover:text-danger">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactForm({ data, onChange }: { data: any; onChange: (v: any) => void }) {
  const d = { ...PAGE_META.contact.template, ...(data || {}) };
  const set = (k: string, v: any) => onChange({ ...d, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
        <input value={d.title || ""} onChange={(e) => set("title", e.target.value)} className={pageInputCls} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
        <textarea rows={2} value={d.description || ""} onChange={(e) => set("description", e.target.value)} className={cn(pageInputCls, "resize-y")} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
        <input value={d.email || ""} onChange={(e) => set("email", e.target.value)} className={pageInputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</span>
        <input value={d.phone || ""} onChange={(e) => set("phone", e.target.value)} className={pageInputCls} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
        <input value={d.address || ""} onChange={(e) => set("address", e.target.value)} className={pageInputCls} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support Hours</span>
        <input value={d.supportHours || ""} onChange={(e) => set("supportHours", e.target.value)} className={pageInputCls} />
      </label>
    </div>
  );
}

export function PagesAdminPage() {
  useAdminTitle("Pages");
  const toast = useToast();
  const [active, setActive] = useState("home");
  const [docs, setDocs] = useState<Record<string, any>>({ home: {}, about: {}, contact: {} });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pages = await api.listPages();
        if (cancelled) return;
        const next: Record<string, any> = {};
        for (const p of pages) next[p.page] = p.data ?? {};
        setDocs((d) => ({ ...d, ...next }));
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setDoc(page: string, value: any) {
    setDocs((d) => ({ ...d, [page]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      await api.updatePage(active, docs[active] || {});
      toast.success(`${PAGE_META[active].label} content saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed — is the API running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-extrabold text-foreground">Pages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Edit the dynamic content of the Home, About and Contact pages.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {Object.entries(PAGE_META).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
              active === key ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <p className="mb-4 text-xs text-muted-foreground">{PAGE_META[active].hint}</p>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {active === "home" && <HomeForm data={docs.home} onChange={(v) => setDoc("home", v)} />}
            {active === "about" && <AboutForm data={docs.about} onChange={(v) => setDoc("about", v)} />}
            {active === "contact" && <ContactForm data={docs.contact} onChange={(v) => setDoc("contact", v)} />}
            
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save content"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORY_ICONS = ["graduation", "book", "target", "video", "brain"];
type CatRow = { slug: string; label: string; labelBn: string; description: string; icon: string; count: number };
const EMPTY_CAT: CatRow = { slug: "", label: "", labelBn: "", description: "", icon: "graduation", count: 0 };

export function CategoriesPage() {
  useAdminTitle("Categories");
  const toast = useToast();
  const [items, setItems] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getPage("categories")
      .then((p) => {
        if (cancelled) return;
        const list = (p.data as { items?: CatRow[] })?.items;
        setItems(Array.isArray(list) ? list.map((c) => ({ ...EMPTY_CAT, ...c })) : []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const upd = (i: number, next: Partial<CatRow>) => setItems((arr) => arr.map((c, j) => (j === i ? { ...c, ...next } : c)));
  const add = () => setItems((arr) => [...arr, { ...EMPTY_CAT }]);
  const rem = (i: number) => setItems((arr) => arr.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => setItems((arr) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  async function save() {
    const clean = items.map((c) => ({
      ...c,
      slug: (c.slug || c.label).trim().toLowerCase().replace(/\s+/g, "-"),
      label: c.label.trim(),
      labelBn: c.labelBn.trim(),
      description: c.description.trim(),
    }));
    if (clean.some((c) => !c.label)) {
      toast.error("Every category needs a label.");
      return;
    }
    setBusy(true);
    try {
      await api.updatePage("categories", { items: clean });
      setItems(clean);
      toast.success("Categories saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create the categories shown on the home page and selectable when adding a course.</p>
        </div>
        <button type="button" onClick={add} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">+ Add category</button>
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No categories yet. Click “Add category”.</p>
        ) : (
          <div className="space-y-3">
            {items.map((c, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface/50 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Label (English)</span>
                    <input value={c.label} onChange={(e) => upd(i, { label: e.target.value })} placeholder="BCS Preparation" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Label (Bangla)</span>
                    <input value={c.labelBn} onChange={(e) => upd(i, { labelBn: e.target.value })} placeholder="বিসিএস" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</span>
                    <input value={c.slug} onChange={(e) => upd(i, { slug: e.target.value })} placeholder="bcs" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icon</span>
                    <select value={c.icon} onChange={(e) => upd(i, { icon: e.target.value })} className={inputCls}>
                      {CATEGORY_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description (shown under the category)</span>
                    <input value={c.description} onChange={(e) => upd(i, { description: e.target.value })} placeholder="Preliminary, written & viva" className={inputCls} />
                  </label>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => move(i, -1)} className="rounded-lg border border-border px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground">↑</button>
                  <button type="button" onClick={() => move(i, 1)} className="rounded-lg border border-border px-2 py-1 text-xs font-bold text-muted-foreground hover:text-foreground">↓</button>
                  <button type="button" onClick={() => rem(i)} className="ml-auto rounded-lg border border-danger/40 px-3 py-1 text-xs font-bold text-danger hover:bg-danger/10">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
          <button type="button" onClick={save} disabled={busy || loading} className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-50">
            {busy ? "Saving…" : "Save categories"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Messages ────────────────────────────────────────────────────────
export function ContactMessagesPage() {
  useAdminTitle("Contact Messages");
  const toast = useToast();
  const perPage = 10;
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContactMessage | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.listContactMessages(status || undefined, page, perPage);
      setRows(res.items);
      setTotal(res.total);
      setMode("live");
    } catch {
      setRows([]);
      setTotal(0);
      setMode("demo");
    }
  }, [status, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function changeStatus(msg: ContactMessage, next: ContactMessage["status"]) {
    setBusyId(msg.id);
    try {
      await api.setContactMessageStatus(msg.id, next);
      toast.success(`Marked ${next}`);
      setViewing((v) => (v && v.id === msg.id ? { ...v, status: next } : v));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(msg: ContactMessage) {
    setBusyId(msg.id);
    try {
      await api.deleteContactMessage(msg.id);
      toast.success("Message deleted");
      setViewing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const tone = (s: string): "success" | "accent" | "muted" | "danger" =>
    s === "NEW" ? "accent" : s === "READ" ? "success" : s === "REPLIED" ? "success" : "muted";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Contact Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submissions from the public contact form</p>
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="REPLIED">Replied</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      {mode === "demo" && <p className="mt-2 text-xs text-muted-foreground">API unreachable — no contact messages to show.</p>}

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-bold">From</th>
                <th className="px-5 py-3 font-bold">Subject</th>
                <th className="px-5 py-3 font-bold">Message</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No messages.</td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id} className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => setViewing(m)}>
                    <td className="px-5 py-3">
                      <p className="font-bold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}{m.phone ? ` · ${m.phone}` : ""}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{m.subject ?? "—"}</td>
                    <td className="max-w-[34ch] truncate px-5 py-3 text-muted-foreground">{m.message}</td>
                    <td className="px-5 py-3"><Badge tone={tone(m.status)}>{m.status}</Badge></td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(m.createdAt).toLocaleDateString("en-BD")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} perPage={perPage} onChange={setPage} />
      </div>

      {viewing && (
        <AdminModal open onClose={() => setViewing(null)} title={`Message from ${viewing.name}`}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p><p className="mt-0.5 font-semibold text-foreground">{viewing.email}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</p><p className="mt-0.5 font-semibold text-foreground">{viewing.phone ?? "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p><p className="mt-0.5 font-semibold text-foreground">{viewing.subject ?? "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p><p className="mt-0.5 font-semibold text-foreground">{new Date(viewing.createdAt).toLocaleString("en-BD")}</p></div>
            </div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p><p className="mt-1 whitespace-pre-wrap rounded-xl bg-muted/60 p-4 text-foreground">{viewing.message}</p></div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            {(["NEW", "READ", "REPLIED", "ARCHIVED"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={busyId === viewing.id || viewing.status === s}
                onClick={() => changeStatus(viewing, s)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-40",
                  viewing.status === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent hover:text-accent",
                )}
              >
                {s}
              </button>
            ))}
            <a href={`mailto:${viewing.email}?subject=Re: ${encodeURIComponent(viewing.subject ?? "Your message")}`} className="rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/10">Reply by email</a>
            <button type="button" disabled={busyId === viewing.id} onClick={() => remove(viewing)} className="ml-auto rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10 disabled:opacity-40">Delete</button>
          </div>
        </AdminModal>
      )}
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
