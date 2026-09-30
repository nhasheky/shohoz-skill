import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCourses, getRelatedCourses } from "@/lib/api";
import { getReviews } from "@/lib/data/reviews";
import { formatBdt, formatCount, formatDate, formatDurationLabel } from "@/lib/format";
import { ProductCover } from "@/components/ui/product-cover";
import { Stars } from "@/components/ui/rating";
import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { VideoPlayer } from "@/components/product/video-player";
import { PurchasePanel, type PurchasePlan } from "@/components/product/purchase-panel";
import { CurriculumAccordion } from "@/components/product/curriculum-accordion";
import { ReviewSection } from "@/components/product/review-section";
import { CourseCard } from "@/components/ui/product-card";
import { SectionHeader } from "@/components/marketing/section-header";
import {
  IconAward,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconFileText,
  IconFlame,
  IconGlobe,
  IconLayers,
  IconBrain,
  IconUsers,
  IconVideo,
} from "@/components/ui/icons";

const DURATION_ORDER = ["1_MONTH", "2_MONTHS", "3_MONTHS", "6_MONTHS", "LIFETIME"] as const;

export const revalidate = 60;

export async function generateStaticParams() {
  const all = await getCourses();
  return all.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const params = await props.params;
  const course = await getCourse(params.slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.seo.title,
    description: course.seo.description,
    keywords: course.seo.keywords,
    openGraph: {
      title: course.seo.title,
      description: course.seo.description,
      type: "website",
    },
  };
}

export default async function CourseDetailPage(props: PageProps<"/courses/[slug]">) {
  const params = await props.params;
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const plans: PurchasePlan[] = DURATION_ORDER.filter((d) => course.priceMap[d])
    .map((d) => ({
      id: d,
      label: formatDurationLabel(d),
      price: course.priceMap[d]!.amount,
      originalPrice: course.priceMap[d]!.originalAmount,
      note: d === "LIFETIME" ? "Best value · all future updates included" : d === "1_MONTH" ? "Try the course cheaply first" : undefined,
    }))
    .sort((a, b) => a.price - b.price);
  const lifetime = course.priceMap.LIFETIME;
  const cheapest = [...plans].sort((a, b) => a.price - b.price)[0];

  const videoSource =
    course.videos.youtube?.trim() ?
      { type: "youtube" as const, youtubeId: course.videos.youtube }
    : course.videos.direct?.trim() ?
      { type: "direct" as const, hlsUrl: course.videos.direct }
    : null;

  const reviews = getReviews({ id: course.id, count: Math.min(6, Math.max(4, Math.round(course.reviewCount / 400))), baseRating: course.rating });

  const relatedCourses = await getRelatedCourses(course, 3);

  const features = [
    `${course.lectures} video lessons + ${course.quizzes} quizzes`,
    `${course.resources} downloadable resources`,
    course.certificate ? "Course completion certificate" : "Progress tracking & revision schedule",
    "Works on phone, tablet & laptop (1 premium device)",
    "Access to exam bank & mock-test simulators",
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="navy" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent">Home</Link>
            <IconChevronRight width={11} height={11} />
            <Link href="/courses" className="hover:text-accent">Courses</Link>
            <IconChevronRight width={11} height={11} />
            <span className="max-w-[24ch] truncate text-foreground">{course.title}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {course.isNew && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">
                    <IconFlame width={12} height={12} /> New
                  </span>
                )}
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {course.category}
                  {course.categoryBn && <span> · {course.categoryBn}</span>}
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {course.level}
                </span>
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {course.title}
                {course.titleBn && <span className="mt-1 block text-xl text-muted-foreground sm:text-2xl">{course.titleBn}</span>}
              </h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">{course.tagline}</p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Stars rating={course.rating} size={14} />
                  <span className="font-bold text-foreground">{course.rating.toFixed(1)}</span>
                  <span>({formatCount(course.reviewCount)} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUsers width={15} height={15} className="text-sky" /> {formatCount(course.students)} students
                </span>
                <span className="flex items-center gap-1.5">
                  <IconClock width={15} height={15} className="text-sky" /> {course.durationLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <IconGlobe width={15} height={15} className="text-sky" /> Updated {formatDate(course.createdAt)}
                </span>
              </div>

              <div className="mt-7 overflow-hidden rounded-3xl border border-border shadow-card">
                <ProductCover
                  title={course.title}
                  category={course.category}
                  kind="course"
                  accentText={course.level}
                  className="aspect-video"
                  thumbnailUrl={course.thumbnailUrl}
                />
              </div>
            </div>

            <aside className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <PurchasePanel kind="Course" title={course.title} productId={course.id} productType="course" allowedPaymentMethods={course.allowedPaymentMethods} plans={plans} planNote="One-time payment" features={features} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-card/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
          {[
            { icon: IconVideo, label: "Video lessons", value: course.lectures },
            { icon: IconBrain, label: "Quizzes", value: course.quizzes },
            { icon: IconFileText, label: "Articles", value: course.articles },
            { icon: IconLayers, label: "Resources", value: course.resources },
            { icon: IconClock, label: "Total hours", value: course.totalHours },
            { icon: IconAward, label: "Certificate", value: course.certificate ? "Yes" : "—" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 px-2 py-2">
              <s.icon width={18} height={18} className="shrink-0 text-accent" />
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <article className="min-w-0 space-y-14">
          {/* About + preview */}
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">About this course</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{course.description}</p>
            {videoSource && (
              <div className="mt-6">
                <VideoPlayer source={videoSource} title={`${course.title} — preview`} autoplayable={false} />
                <p className="mt-2 text-center text-xs text-muted-foreground">Sample lesson preview · full lessons unlock after enrollment</p>
              </div>
            )}
          </section>

          {/* What you'll learn */}
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">What you&rsquo;ll learn</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.learningOutcomes.map((o) => (
                <li key={o} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground/90">
                  <IconCheck width={16} height={16} className="mt-0.5 shrink-0 text-success" />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          {/* Curriculum */}
          <section>
            <CurriculumAccordion sections={course.curriculum} />
          </section>

          {/* Audience + requirements */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
                <IconUsers width={18} height={18} className="text-accent" /> Who this course is for
              </h3>
              <ul className="mt-4 space-y-2.5">
                {course.whoIsFor.map((w) => (
                  <li key={w} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
                <IconFileText width={18} height={18} className="text-accent" /> Requirements
              </h3>
              <ul className="mt-4 space-y-2.5">
                {course.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Instructor */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover font-display text-3xl font-extrabold text-white dark:from-primary dark:to-sky">
                {course.instructor.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-extrabold text-foreground">{course.instructor.name}</h3>
                  {course.instructor.verified && (
                    <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky">
                      Verified instructor
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{course.instructor.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Stars rating={course.instructor.rating} size={12} /> {course.instructor.rating.toFixed(1)}</span>
                  <span className="flex items-center gap-1"><IconUsers width={12} height={12} /> {formatCount(course.instructor.students)} students</span>
                  <span className="flex items-center gap-1"><IconVideo width={12} height={12} /> {course.instructor.courses} courses</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{course.instructor.bio}</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <ReviewSection
            id={`course-${course.id}`}
            title="Student reviews"
            rating={course.rating}
            count={course.reviewCount}
            reviews={reviews}
          />

          {/* FAQ */}
          <section>
            <h2 className="font-display text-2xl font-extrabold text-foreground">Frequently asked questions</h2>
            <div className="mt-5 space-y-3">
              {course.faq.map((f) => (
                <details key={f.question} className="group rounded-2xl border border-border bg-card shadow-card">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-foreground">
                    {f.question}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">＋</span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Save time — enroll directly</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-foreground">
              {lifetime ? formatBdt(lifetime.amount) : cheapest ? formatBdt(cheapest.price) : formatBdt(0)}
            </p>
            <ButtonLink href="#enroll" variant="accent" className="mt-4 w-full">
              Enroll Now
            </ButtonLink>
            <a
              href="#enroll"
              className="mt-2 block rounded-xl px-4 py-3 text-center text-sm font-bold text-accent transition-colors hover:bg-accent/10"
            >
              Or start a free mini test →
            </a>
          </div>
        </aside>
      </div>

      {/* Related */}
      <section className="border-t border-border bg-card/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Keep learning" title="Related courses" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Anchor for enroll (mobile) */}
      <div id="enroll" className="scroll-mt-24 lg:hidden" data-enroll-anchor />
    </main>
  );
}