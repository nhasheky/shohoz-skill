import type { Metadata } from "next";
import { Hero, DeviceLimitStrip } from "@/components/marketing/hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { StatsBand } from "@/components/marketing/stats";
import { TestimonialCarousel } from "@/components/marketing/testimonials";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FaqAccordion } from "@/components/marketing/faq";
import { CourseCard, BookCard, ExamCard, BlogCard } from "@/components/ui/product-card";
import { getFeaturedCourses, getFeaturedBooks, getFeaturedExams, getFeaturedBlogs, getCourses, getCategories, getPageContent, type HomePageData } from "@/lib/api";
import { homeFaq } from "@/lib/data/site-content";
import {
  IconBookOpen,
  IconBrain,
  IconChevronRight,
  IconGraduationCap,
  IconPlayCircle,
  IconVideo,
} from "@/components/ui/icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Courses, MCQ Exams & Books — BCS, NTRCA, Bank Job",
  description:
    "Shohoz Skill — Bangladesh's fastest learning platform for government-job preparation. Courses, MCQ exams with real negative marking, and books. Learn to Earn.",
  keywords: ["BCS", "NTRCA", "bank job", "govt job preparation", "MCQ exam", "সহজ স্কিল"],
  openGraph: {
    title: "Shohoz Skill — Learn to Earn",
    description: "Courses, MCQ exams and books for government-job preparation in Bangladesh.",
    type: "website",
  },
};

export default async function HomePage() {
  const [courses, books, exams, blogPosts, home, allCourses, catsRaw] = await Promise.all([
    getFeaturedCourses(4),
    getFeaturedBooks(4),
    getFeaturedExams(3),
    getFeaturedBlogs(3),
    getPageContent<HomePageData>("home"),
    getCourses(),
    getCategories(),
  ]);

  const cats = catsRaw.map((c) => ({
    ...c,
    count: allCourses.filter((cc) => (cc.category ?? "").toLowerCase() === c.label.toLowerCase()).length,
  }));
  const faqItems = home.faq?.length ? home.faq : homeFaq;

  return (
    <main>
      <Hero
        eyebrow={home.heroEyebrow || undefined}
        title={home.heroTitle || undefined}
        description={home.heroDescription || undefined}
        metrics={home.heroMetrics}
        primaryLabel={home.heroPrimaryLabel || undefined}
        primaryHref={home.heroPrimaryHref || undefined}
        secondaryLabel={home.heroSecondaryLabel || undefined}
        secondaryHref={home.heroSecondaryHref || undefined}
        searchPlaceholder={home.heroSearchPlaceholder || undefined}
      />
      <DeviceLimitStrip items={home.deviceStrip} />
      <StatsBand stats={home.stats} />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeader
          eyebrow={home.categoriesEyebrow || "Categories"}
          title={home.categoriesTitle || "Pick your exam, we do the rest"}
          description={home.categoriesDescription || "Focused preparation tracks for every government job of Bangladesh."}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c) => (
            <a
              key={c.slug}
              href={`/courses?category=${encodeURIComponent(c.label)}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-accent hover:shadow-card-hover"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <CategoryIcon slug={c.slug} icon={c.icon} />
              </span>
              <span className="font-display text-sm font-bold text-foreground">{c.labelBn || c.label}</span>
              <span className="text-[11px] text-muted-foreground">{c.description}</span>
              <span className="text-[11px] font-bold text-accent">{c.count} items</span>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={home.coursesEyebrow || "Featured Courses"}
            title={home.coursesTitle || "Courses that turn preparation into placement"}
            description={home.coursesDescription || "Short, exam-first video lessons with shortcuts, quizzes and a certificate on completion."}
            viewAllHref="/courses"
            viewAllLabel="All courses"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader
              center={false}
              eyebrow={home.examsEyebrow || "MCQ Exam Engine"}
              title={home.examsTitle || "Practice under real exam pressure"}
              description={home.examsDescription || "Topic-wise exams inside packages, negative marking simulators, and instant result analysis with explanations. Free till you're ready for the paid battlefield."}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {exams.map((e) => (
                <ExamCard key={e.id} exam={e} />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <h3 className="font-display text-xl font-bold text-foreground">{home.examEngineTitle || "How the exam engine works"}</h3>
            <ol className="mt-6 space-y-5">
              {(home.examsSteps?.length ? home.examsSteps : [
                { title: "Pick a topic", description: "Subject → topic-wise exam, tuned to the real paper pattern." },
                { title: "Sit the test", description: "Per-question marks & negative marking exactly like the board." },
                { title: "Get instant analysis", description: "Score, breakdown, and every answer explained in seconds." },
              ]).map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    {i === 0 ? <IconPlayCircle width={20} height={20} /> : i === 1 ? <IconBrain width={20} height={20} /> : <IconGraduationCap width={20} height={20} />}
                  </span>
                  <div>
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                      <span className="text-xs text-muted-foreground">0{i + 1}</span> {s.title}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={home.booksEyebrow || "Featured Books"}
            title={home.booksTitle || "Read the book the moment you buy it"}
            description={home.booksDescription || "Watermarked online reader — no downloads, no waiting. Or get hardcopy shipped to any upazila of Bangladesh."}
            viewAllHref="/books"
            viewAllLabel="All books"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeader
          eyebrow={home.reviewsEyebrow || "Success Stories"}
          title={home.reviewsTitle || "Reviews from our learners"}
          description={home.reviewsDescription || "From first attempt to final selection — real words from real toppers."}
        />
        <TestimonialCarousel items={home.testimonials} />
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow={home.blogsEyebrow || "From the Blog"}
            title={home.blogsTitle || "Strategy notes, study plans, exam analysis"}
            viewAllHref="/blogs"
            viewAllLabel="All articles"
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((b) => (
              <BlogCard key={b.id} post={b} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeader
              center={false}
              eyebrow={home.faqEyebrow || "FAQ"}
              title={home.faqTitle || "Questions? Answered."}
              description={home.faqDescription || "Still stuck? Write to support@shohozskill.com — average reply time under 2 hours."}
            />
          </div>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <CtaBanner
          badge={home.ctaBadge || undefined}
          title={home.ctaTitle || undefined}
          description={home.ctaDescription || undefined}
          primaryLabel={home.ctaPrimaryLabel || undefined}
          primaryHref={home.ctaPrimaryHref || undefined}
          secondaryLabel={home.ctaSecondaryLabel || undefined}
          secondaryHref={home.ctaSecondaryHref || undefined}
          footnote={home.ctaFootnote || undefined}
        />
      </section>
    </main>
  );
}

function CategoryIcon({ slug, icon }: { slug: string; icon?: string }) {
  const key = (icon || slug || "").toLowerCase();
  const map: Record<string, React.ReactNode> = {
    graduation: <IconGraduationCap width={22} height={22} />,
    book: <IconBookOpen width={22} height={22} />,
    target: <IconChevronRight width={22} height={22} />,
    video: <IconVideo width={22} height={22} />,
    brain: <IconGraduationCap width={22} height={22} />,
    bcs: <IconGraduationCap width={22} height={22} />,
    ntrca: <IconBookOpen width={22} height={22} />,
    bank: <IconChevronRight width={22} height={22} />,
    gk: <IconVideo width={22} height={22} />,
    english: <IconBookOpen width={22} height={22} />,
    writing: <IconGraduationCap width={22} height={22} />,
  };
  return map[key] ?? <IconGraduationCap width={22} height={22} />;
}