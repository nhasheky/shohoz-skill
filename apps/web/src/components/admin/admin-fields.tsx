"use client";

import { cn } from "@/lib/cn";
import { adminInputCls } from "./admin-form";
import { IconPlus, IconTrash } from "@/components/ui/icons";

const DURATIONS = ["LIFETIME", "1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS"];

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 dark:bg-background/60">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-display text-sm font-extrabold text-foreground">{title}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const AddBtn = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-accent/60 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/5"
  >
    <IconPlus width={13} height={13} /> {children}
  </button>
);

const RowRemove = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-danger hover:text-danger" aria-label="Remove">
    <IconTrash width={14} height={14} />
  </button>
);

// ─── Prices (multi-duration) ───────────────────────────────────────────────
export type PriceRow = { duration: string; amount: number | ""; originalAmount: number | "" };
export function PriceListEditor({ value, onChange }: { value: PriceRow[] | undefined; onChange: (v: PriceRow[]) => void }) {
  const rows = value ?? [];
  const upd = (i: number, next: PriceRow) => onChange(rows.map((r, j) => (j === i ? next : r)));
  return (
    <SectionCard title="Prices" hint="One row per access duration">
      <div className="space-y-2">
        {rows.map((p, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_auto] items-center gap-2">
            <select value={p.duration} onChange={(e) => upd(i, { ...p, duration: e.target.value })} className={adminInputCls}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input type="number" placeholder="৳ price" value={String(p.amount)} onChange={(e) => upd(i, { ...p, amount: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
            <input type="number" placeholder="৳ original" value={String(p.originalAmount ?? "")} onChange={(e) => upd(i, { ...p, originalAmount: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
            <RowRemove onClick={() => onChange(rows.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <AddBtn onClick={() => onChange([...rows, { duration: "LIFETIME", amount: "", originalAmount: "" }])}>Add price</AddBtn>
    </SectionCard>
  );
}

// ─── Curriculum builder ────────────────────────────────────────────────────
export type LessonRow = { title: string; durationMinutes: number | ""; sourceKind: string; sourceId: string; preview: boolean };
export type SectionRow = { title: string; lessons: LessonRow[] };
export function CurriculumEditor({ value, onChange }: { value: SectionRow[] | undefined; onChange: (v: SectionRow[]) => void }) {
  const sections = value ?? [];
  const updSection = (i: number, next: SectionRow) => onChange(sections.map((s, j) => (j === i ? next : s)));
  const updLesson = (si: number, li: number, next: LessonRow) =>
    updSection(si, { ...sections[si], lessons: sections[si].lessons.map((l, j) => (j === li ? next : l)) });

  return (
    <SectionCard title="Curriculum" hint="Sections with video lessons">
      <div className="space-y-3">
        {sections.map((s, si) => (
          <div key={si} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <input value={s.title} placeholder="Section title (e.g. Bangla)" onChange={(e) => updSection(si, { ...s, title: e.target.value })} className={adminInputCls} />
              <RowRemove onClick={() => onChange(sections.filter((_, j) => j !== si))} />
            </div>
            <div className="mt-2 space-y-2 pl-1">
              {s.lessons.map((l, li) => (
                <div key={li} className="grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)_auto] items-center gap-2">
                  <input value={l.title} placeholder="Lesson title" onChange={(e) => updLesson(si, li, { ...l, title: e.target.value })} className={adminInputCls} />
                  <input type="number" placeholder="min" value={String(l.durationMinutes)} onChange={(e) => updLesson(si, li, { ...l, durationMinutes: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
                  <div className="flex gap-2">
                    <select value={l.sourceKind} onChange={(e) => updLesson(si, li, { ...l, sourceKind: e.target.value })} className={cn(adminInputCls, "w-24")}>
                      <option value="youtube">YouTube</option>
                      <option value="direct">Direct/HLS</option>
                    </select>
                    <input value={l.sourceId} placeholder="ID or URL" onChange={(e) => updLesson(si, li, { ...l, sourceId: e.target.value })} className={adminInputCls} />
                  </div>
                  <RowRemove onClick={() => updSection(si, { ...s, lessons: s.lessons.filter((_, j) => j !== li) })} />
                </div>
              ))}
              <AddBtn
                onClick={() =>
                  updSection(si, {
                    ...s,
                    lessons: [...s.lessons, { title: "", durationMinutes: "", sourceKind: "youtube", sourceId: "", preview: false }],
                  })
                }
              >
                Add lesson
              </AddBtn>
            </div>
          </div>
        ))}
      </div>
      <AddBtn onClick={() => onChange([...sections, { title: "", lessons: [] }])}>Add section</AddBtn>
    </SectionCard>
  );
}

// ─── String list (learning outcomes / requirements / whoIsFor) ─────────────
export function ListEditor({ value, onChange, placeholder }: { value: string[] | undefined; onChange: (v: string[]) => void; placeholder?: string }) {
  const items = value ?? [];
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={it} placeholder={placeholder ?? "Item"} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={adminInputCls} />
          <RowRemove onClick={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...items, ""])}>Add item</AddBtn>
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────
export function FaqEditor({ value, onChange }: { value: { question: string; answer: string }[] | undefined; onChange: (v: { question: string; answer: string }[]) => void }) {
  const items = value ?? [];
  return (
    <div className="space-y-2">
      {items.map((f, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2">
            <input value={f.question} placeholder="Question" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} className={adminInputCls} />
            <RowRemove onClick={() => onChange(items.filter((_, j) => j !== i))} />
          </div>
          <textarea rows={2} value={f.answer} placeholder="Answer" onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} className={cn(adminInputCls, "mt-2 resize-y")} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...items, { question: "", answer: "" }])}>Add FAQ</AddBtn>
    </div>
  );
}

// ─── SEO ───────────────────────────────────────────────────────────────────
export function SeoEditor({ value, onChange }: { value: Record<string, unknown> | undefined; onChange: (v: Record<string, unknown>) => void }) {
  const seo = value ?? {};
  const set = (k: string, v: unknown) => onChange({ ...seo, [k]: v });
  return (
    <SectionCard title="SEO" hint="Search metadata for this item">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</span>
          <input value={String(seo.title ?? "")} onChange={(e) => set("title", e.target.value)} placeholder="SEO title" className={adminInputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
          <textarea rows={2} value={String(seo.description ?? "")} onChange={(e) => set("description", e.target.value)} placeholder="Meta description" className={cn(adminInputCls, "resize-y")} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keywords</span>
          <input value={Array.isArray(seo.keywords) ? (seo.keywords as string[]).join(", ") : String(seo.keywords ?? "")} onChange={(e) => set("keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="bcs, preliminary, bangla" className={adminInputCls} />
        </label>
      </div>
    </SectionCard>
  );
}

// ─── Exam: subject → topic → question builder ─────────────────────────────
export type QuestionRow = { text: string; options: string[]; answerIndex: number; explanation: string };
export type TopicRow = {
  title: string;
  slug: string;
  questionsCount: number | "";
  durationMinutes: number | "";
  marksPerQuestion: number | "";
  negativeMarks: number | "";
  questions: QuestionRow[];
};
export type SubjectRow = { title: string; topics: TopicRow[] };

const blankQuestion = (): QuestionRow => ({ text: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" });
const blankTopic = (): TopicRow => ({ title: "", slug: "", questionsCount: "", durationMinutes: "", marksPerQuestion: "", negativeMarks: "", questions: [blankQuestion()] });

export function ExamSubjectsEditor({ value, onChange }: { value: SubjectRow[] | undefined; onChange: (v: SubjectRow[]) => void }) {
  const subjects = value ?? [];
  const updSubject = (i: number, next: SubjectRow) => onChange(subjects.map((s, j) => (j === i ? next : s)));
  const updTopic = (si: number, ti: number, next: TopicRow) =>
    updSubject(si, { ...subjects[si], topics: subjects[si].topics.map((t, j) => (j === ti ? next : t)) });
  const updQuestion = (si: number, ti: number, qi: number, next: QuestionRow) =>
    updTopic(si, ti, { ...subjects[si].topics[ti], questions: subjects[si].topics[ti].questions.map((q, j) => (j === qi ? next : q)) });

  return (
    <SectionCard title="Subjects" hint="Package → subject → topic → questions">
      <div className="space-y-3">
        {subjects.map((s, si) => (
          <div key={si} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <input value={s.title} placeholder="Subject title (e.g. Bangla)" onChange={(e) => updSubject(si, { ...s, title: e.target.value })} className={adminInputCls} />
              <RowRemove onClick={() => onChange(subjects.filter((_, j) => j !== si))} />
            </div>
            <div className="mt-2 space-y-2">
              {s.topics.map((t, ti) => (
                <div key={ti} className="rounded-lg border border-border bg-surface/60 p-3 dark:bg-background/60">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <input value={t.title} placeholder="Topic title" onChange={(e) => updTopic(si, ti, { ...t, title: e.target.value })} className={adminInputCls} />
                    <input value={t.slug} placeholder="Topic slug" onChange={(e) => updTopic(si, ti, { ...t, slug: e.target.value })} className={adminInputCls} />
                    <input type="number" placeholder="Q count" value={String(t.questionsCount)} onChange={(e) => updTopic(si, ti, { ...t, questionsCount: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input type="number" placeholder="Duration (min)" value={String(t.durationMinutes)} onChange={(e) => updTopic(si, ti, { ...t, durationMinutes: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
                    <input type="number" placeholder="Marks/q" value={String(t.marksPerQuestion)} onChange={(e) => updTopic(si, ti, { ...t, marksPerQuestion: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
                    <input type="number" placeholder="Negative" value={String(t.negativeMarks)} onChange={(e) => updTopic(si, ti, { ...t, negativeMarks: e.target.value === "" ? "" : Number(e.target.value) })} className={adminInputCls} />
                  </div>

                  <div className="mt-3 space-y-2">
                    {t.questions.map((q, qi) => (
                      <div key={qi} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start gap-2">
                          <textarea rows={2} value={q.text} placeholder="Question text" onChange={(e) => updQuestion(si, ti, qi, { ...q, text: e.target.value })} className={cn(adminInputCls, "resize-y")} />
                          <RowRemove onClick={() => updTopic(si, ti, { ...t, questions: t.questions.filter((_, j) => j !== qi) })} />
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt, oi) => (
                            <input
                              key={oi}
                              value={opt}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              onChange={(e) => updQuestion(si, ti, qi, { ...q, options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                              className={cn(adminInputCls, q.answerIndex === oi && "border-success/60")}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <label className="text-xs font-semibold text-muted-foreground">Correct answer</label>
                          <select value={q.answerIndex} onChange={(e) => updQuestion(si, ti, qi, { ...q, answerIndex: Number(e.target.value) })} className={cn(adminInputCls, "w-24")}>
                            {q.options.map((_, oi) => (
                              <option key={oi} value={oi}>{String.fromCharCode(65 + oi)}</option>
                            ))}
                          </select>
                          <input value={q.explanation} placeholder="Explanation (optional)" onChange={(e) => updQuestion(si, ti, qi, { ...q, explanation: e.target.value })} className={adminInputCls} />
                        </div>
                      </div>
                    ))}
                    <AddBtn onClick={() => updTopic(si, ti, { ...t, questions: [...t.questions, blankQuestion()] })}>Add question</AddBtn>
                  </div>
                </div>
              ))}
              <AddBtn onClick={() => updSubject(si, { ...s, topics: [...s.topics, blankTopic()] })}>Add topic</AddBtn>
            </div>
          </div>
        ))}
      </div>
      <AddBtn onClick={() => onChange([...subjects, { title: "", topics: [blankTopic()] }])}>Add subject</AddBtn>
    </SectionCard>
  );
}

// ─── Blog rich content editor ─────────────────────────────────────────────
export type BlogBlockRow = {
  type: string;
  text?: string;
  cite?: string;
  ordered?: boolean;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
  youtubeId?: string;
  title?: string;
  images?: { src: string; alt: string }[];
};

const BLOCK_TYPES = ["paragraph", "heading", "list", "quote", "image", "video", "gallery"];

export function BlogContentEditor({ value, onChange }: { value: BlogBlockRow[] | undefined; onChange: (v: BlogBlockRow[]) => void }) {
  const blocks = value ?? [];
  const upd = (i: number, next: BlogBlockRow) => onChange(blocks.map((b, j) => (j === i ? next : b)));

  return (
    <SectionCard title="Content blocks" hint="Paragraph, heading, list, quote, image, video, gallery">
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <select value={b.type} onChange={(e) => upd(i, { ...b, type: e.target.value })} className={cn(adminInputCls, "w-36")}>
                {BLOCK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="text-[11px] font-semibold text-muted-foreground">#{i + 1}</span>
              <div className="ml-auto">
                <RowRemove onClick={() => onChange(blocks.filter((_, j) => j !== i))} />
              </div>
            </div>

            {(b.type === "paragraph" || b.type === "heading" || b.type === "quote") && (
              <div className="mt-2 space-y-2">
                <textarea rows={2} value={b.text ?? ""} placeholder="Text" onChange={(e) => upd(i, { ...b, text: e.target.value })} className={cn(adminInputCls, "resize-y")} />
                {b.type === "quote" && (
                  <input value={b.cite ?? ""} placeholder="Citation (optional)" onChange={(e) => upd(i, { ...b, cite: e.target.value })} className={adminInputCls} />
                )}
              </div>
            )}

            {b.type === "list" && (
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={Boolean(b.ordered)} onChange={(e) => upd(i, { ...b, ordered: e.target.checked })} className="h-4 w-4 accent-[#F2A93B]" />
                  Ordered list
                </label>
                <textarea
                  rows={4}
                  value={(b.items ?? []).join("\n")}
                  placeholder={"One item per line"}
                  onChange={(e) => upd(i, { ...b, items: e.target.value.split("\n") })}
                  className={cn(adminInputCls, "resize-y")}
                />
              </div>
            )}

            {b.type === "image" && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={b.src ?? ""} placeholder="Image URL" onChange={(e) => upd(i, { ...b, src: e.target.value })} className={adminInputCls} />
                <input value={b.alt ?? ""} placeholder="Alt text" onChange={(e) => upd(i, { ...b, alt: e.target.value })} className={adminInputCls} />
                <input value={b.caption ?? ""} placeholder="Caption (optional)" onChange={(e) => upd(i, { ...b, caption: e.target.value })} className={cn(adminInputCls, "sm:col-span-2")} />
              </div>
            )}

            {b.type === "video" && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={b.youtubeId ?? ""} placeholder="YouTube ID" onChange={(e) => upd(i, { ...b, youtubeId: e.target.value })} className={adminInputCls} />
                <input value={b.title ?? ""} placeholder="Title (optional)" onChange={(e) => upd(i, { ...b, title: e.target.value })} className={adminInputCls} />
              </div>
            )}

            {b.type === "gallery" && (
              <div className="mt-2">
                <textarea
                  rows={3}
                  value={(b.images ?? []).map((im) => `${im.src}||${im.alt}`).join("\n")}
                  placeholder={"One image per line: URL||alt"}
                  onChange={(e) =>
                    upd(
                      i,
                      { ...b, images: e.target.value.split("\n").filter((l) => l.trim()).map((l) => ({ src: l.split("||")[0]?.trim() ?? "", alt: l.split("||")[1]?.trim() ?? "" })) },
                    )
                  }
                  className={cn(adminInputCls, "resize-y font-mono text-xs")}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <select id="new-block-type" defaultValue="paragraph" className={cn(adminInputCls, "w-40")}>
          {BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const sel = document.getElementById("new-block-type") as HTMLSelectElement;
            onChange([...blocks, { type: sel.value, text: "", items: [] }]);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-accent/60 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/5"
        >
          <IconPlus width={13} height={13} /> Add block
        </button>
      </div>
    </SectionCard>
  );
}
