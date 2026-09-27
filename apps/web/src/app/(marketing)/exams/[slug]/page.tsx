import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExam, getExams, getRelatedExams } from "@/lib/api";
import { getReviews } from "@/lib/data/reviews";
import { formatCount, formatDurationLabel } from "@/lib/format";
import { ProductCover } from "@/components/ui/product-cover";
import { Stars } from "@/components/ui/rating";
import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { PurchasePanel, type PurchasePlan } from "@/components/product/purchase-panel";
import { ReviewSection } from "@/components/product/review-section";
import { ExamCard } from "@/components/ui/product-card";
import { SectionHeader } from "@/components/marketing/section-header";
import {
  IconBrain,
  IconChevronRight,
  IconClock,
  IconList,
  IconPlayCircle,
  IconShieldCheck,
  IconTarget,
  IconTrendingUp,
  IconTrophy,
  IconUsers,
} from "@/components/ui/icons";

export const revalidate = 60;

export async function generateStaticParams() {
  const all = await getExams();
  return all.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata(props: PageProps<"/exams/[slug]">): Promise<Metadata> {
  const params = await props.params;
  const exam = await getExam(params.slug);
  if (!exam) return { title: "Exam not found" };
  return { title: exam.seo.title, description: exam.seo.description, keywords: exam.seo.keywords };
}

export default async function ExamDetailPage(props: PageProps<"/exams/[slug]">) {
  const params = await props.params;
  const exam = await getExam(params.slug);
  if (!exam) notFound();

  const isPackage = exam.examType === "package";
  const subjects = exam.subjects;
  const topicCount = subjects.reduce((n, s) => n + s.topics.length, 0);

  const plans: PurchasePlan[] = exam.isFree
    ? [{ id: "free", label: "Free · Unlimited attempts", price: 0 }]
    : [
        {
          id: "lifetime",
          label: formatDurationLabel("LIFETIME"),
          price: exam.price.amount,
          originalPrice: exam.price.originalAmount,
          note: "All subjects + topic-wise exams included",
        },
      ];

  const features = [
    `${subjects.length} subjects · ${topicCount} topic-wise exams`,
    `${exam.questionsCount.toLocaleString("en-BD")} questions with answer explanations`,
    exam.negativeMarking ? `Realistic negative marking (${exam.defaultNegativeMarks} per wrong answer)` : "No negative marking",
    "Instant result with subject-wise breakdown",
    "Unlimited retakes on every topic",
  ];

  const reviews = getReviews({ id: exam.id, count: 5, baseRating: exam.rating });

  const relatedExams = await getRelatedExams(exam, 3);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="accent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent">Home</Link>
            <IconChevronRight width={11} height={11} />
            <Link href="/exams" className="hover:text-accent">Exams</Link>
            <IconChevronRight width={11} height={11} />
            <span className="max-w-[26ch] truncate text-foreground">{exam.title}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${exam.isFree ? "bg-success/10 text-success" : "bg-accent/15 text-accent"}`}>
                  {exam.isFree ? "Free" : "Paid"}
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {isPackage ? "Exam Package" : "Topic Exam"}
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  Difficulty: {exam.difficulty}
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {exam.title}
                {exam.titleBn && <span className="mt-1 block text-xl text-muted-foreground sm:text-2xl">{exam.titleBn}</span>}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">{exam.tagline}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Stars rating={exam.rating} size={14} />
                  <span className="font-bold text-foreground">{exam.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUsers width={15} height={15} className="text-sky" /> {formatCount(exam.attemptCount)} attempts
                </span>
                <span className="flex items-center gap-1.5">
                  <IconTarget width={15} height={15} className="text-sky" /> {exam.totalMarks} total marks
                </span>
                <span className="flex items-center gap-1.5">
                  <IconClock width={15} height={15} className="text-sky" /> {exam.durationMinutes ? `${exam.durationMinutes} min` : "Topic-wise timers"}
                </span>
                {isPackage && (
                  <span className="flex items-center gap-1.5">
                    <IconTrendingUp width={15} height={15} className="text-sky" /> {exam.passRate}% average pass rate
                  </span>
                )}
              </div>

              <div className="mt-7 overflow-hidden rounded-3xl border border-border shadow-card">
                <ProductCover
                  title={exam.title}
                  category={isPackage ? "Exam Package" : "Topic Exam"}
                  kind={isPackage ? "package" : "exam"}
                  accentText={exam.isFree ? "Free" : exam.difficulty}
                />
              </div>
            </div>

            <aside className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <PurchasePanel
                  kind="Exam"
                  title={exam.title}
                  plans={plans}
                  planNote={exam.isFree ? "No payment required" : "One-time payment · lifetime access"}
                  features={features}
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-14">
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">About this {isPackage ? "package" : "exam"}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{exam.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard icon={IconBrain} label="Subjects" value={subjects.length} />
              <StatCard icon={IconList} label="Topic exams" value={topicCount} />
              <StatCard icon={IconTrophy} label="Avg. score" value={`${exam.avgScore}/${exam.totalMarks}`} />
            </div>
          </section>

          {/* Subjects / topics */}
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">What&rsquo;s inside</h2>
            <div className="mt-5 space-y-4">
              {subjects.map((s) => (
                <div key={s.id} className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-extrabold text-foreground">{s.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.topics.length} topics · {s.topics.reduce((n, t) => n + t.questionsCount, 0)} questions
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {s.topics.reduce((n, t) => n + t.durationMinutes, 0)} min
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {s.topics.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 hover:bg-muted/50">
                        <div className="flex min-w-0 items-center gap-3">
                          <IconPlayCircle width={16} height={16} className="shrink-0 text-accent" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.questionsCount} questions · {t.durationMinutes} min
                              {t.negativeMarks > 0 && ` · −${t.negativeMarks} per wrong`}
                            </p>
                          </div>
                        </div>
                        {exam.isFree || isPackage ? (
                          <ButtonLink href={`/exams/${exam.slug}/take?subject=${encodeURIComponent(s.id)}&topic=${encodeURIComponent(s.topics.indexOf(t))}`} variant="outline" size="sm">
                            {exam.isFree ? "Start" : "Start topic"}
                          </ButtonLink>
                        ) : (
                          <span className="flex items-center text-xs text-muted-foreground">
                            <IconShieldCheck width={14} height={14} className="mr-1 text-accent" /> Locked
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">How it works</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { n: "01", t: "Pick a topic", d: "Choose the subject and topic you want to drill, or take the whole paper." },
                { n: "02", t: "Sit the exam", d: "Timer runs, negative marking applies — just like the board." },
                { n: "03", t: "Review instantly", d: "Instant score, subject breakdown and step-by-step explanations." },
              ].map((s) => (
                <li key={s.n} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <span className="font-display text-2xl font-extrabold text-accent/70">{s.n}</span>
                  <p className="mt-2 font-display text-sm font-bold text-foreground">{s.t}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Negative marking explainer */}
          {exam.negativeMarking && (
            <section className="rounded-3xl border border-accent/30 bg-accent/5 p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
                <IconShieldCheck width={18} height={18} className="text-accent" /> Negative marking policy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Wrong answer costs <span className="font-bold text-foreground">−{exam.defaultNegativeMarks} marks</span> (1 mark per correct). Unanswered questions are never penalised. We recommend answering only what you are reasonably sure of — this simulates the real board rules.
              </p>
            </section>
          )}

          <ReviewSection id={`exam-${exam.id}`} title="User reviews" rating={exam.rating} count={exam.attemptCount} reviews={reviews} />
        </article>
      </div>

      <section className="border-t border-border bg-card/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="More practice" title="Other exams you may like" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedExams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: ComponentType<{ width?: number; height?: number; className?: string }>; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
      <Icon width={20} height={20} className="mx-auto text-accent" />
      <p className="mt-2 font-display text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}