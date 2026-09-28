import type { Metadata } from "next";
import { Hero, DeviceLimitStrip } from "@/components/marketing/hero";
import { SectionHeader } from "@/components/marketing/section-header";
import { StatsBand } from "@/components/marketing/stats";
import { TestimonialCarousel } from "@/components/marketing/testimonials";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FaqAccordion } from "@/components/marketing/faq";
import { CourseCard, BookCard, ExamCard, BlogCard } from "@/components/ui/product-card";
import { getFeaturedCourses, getFeaturedBooks, getFeaturedExams, getFeaturedBlogs, getPageContent, type HomePageData } from "@/lib/api";
import { categories, homeFaq } from "@/lib/data/site-content";
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
  const [courses, books, exams, blogPosts, home] = await Promise.all([
    getFeaturedCourses(4),
    getFeaturedBooks(4),
    getFeaturedExams(3),
    getFeaturedBlogs(3),
    getPageContent<HomePageData>("home"),
  ]);

  const cats = home.categories?.length ? home.categories : categories;
  const faqItems = home.faq?.length ? home.faq : homeFaq;

  return (
    <main>
      <Hero eyebrow={home.heroEyebrow || undefined} title={home.heroTitle || undefined} description={home.heroDescription || undefined} />
      <DeviceLimitStrip />
      <StatsBand />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionHeader
          eyebrow="Categories"
          title="Pick your exam, we do the rest"
          description="Focused preparation tracks for every government job of Bangladesh."
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c) => (
            <a
              key={c.slug}
              href={`/courses?category=${c.slug}`}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-card transition-all hover:-translate-y-1 hover:border-accent hover:shadow-card-hover"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <CategoryIcon slug={c.slug} />
              </span>
              <span className="font-display text-sm font-bold text-foreground">{c.label}</span>
              <span className="text-[11px] text-muted-foreground">{c.description}</span>
              <span className="text-[11px] font-bold text-accent">{c.count} items</span>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Featured Courses"
            title="Courses that turn preparation into placement"
            description="Short, exam-first video lessons with shortcuts, quizzes and a certificate on completion."
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
              eyebrow="MCQ Exam Engine"
              title="Practice under real exam pressure"
              description="Topic-wise exams inside packages, negative marking simulators, and instant result analysis with explanations. Free till you're ready for the paid battlefield."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {exams.map((e) => (
                <ExamCard key={e.id} exam={e} />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <h3 className="font-display text-xl font-bold text-foreground">How the exam engine works</h3>
            <ol className="mt-6 space-y-5">
              {[
                { icon: <IconPlayCircle width={20} height={20} />, t: "Pick a topic", d: "Subject → topic-wise exam, tuned to the real paper pattern." },
                { icon: <IconBrain width={20} height={20} />, t: "Sit the test", d: "Per-question marks & negative marking exactly like the board." },
                { icon: <IconGraduationCap width={20} height={20} />, t: "Get instant analysis", d: "Score, breakdown, and every answer explained in seconds." },
              ].map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    {s.icon}
                  </span>
                  <div>
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                      <span className="text-xs text-muted-foreground">0{i + 1}</span> {s.t}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
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
            eyebrow="Featured Books"
            title="Read the book the moment you buy it"
            description="Watermarked online reader — no downloads, no waiting. Or get hardcopy shipped to any upazila of Bangladesh."
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
          eyebrow="Success Stories"
          title="Reviews from our learners"
          description="From first attempt to final selection — real words from real toppers."
        />
        <TestimonialCarousel />
      </section>

      <section className="bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="From the Blog"
            title="Strategy notes, study plans, exam analysis"
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
              eyebrow="FAQ"
              title="Questions? Answered."
              description="Still stuck? Write to support@shohozskill.com — average reply time under 2 hours."
            />
          </div>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <CtaBanner />
      </section>
    </main>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  const map: Record<string, React.ReactNode> = {
    bcs: <IconGraduationCap width={22} height={22} />,
    ntrca: <IconBookOpen width={22} height={22} />,
    bank: <IconChevronRight width={22} height={22} />,
    gk: <IconVideo width={22} height={22} />,
    english: <IconBookOpen width={22} height={22} />,
    writing: <IconGraduationCap width={22} height={22} />,
  };
  return map[slug] ?? <IconGraduationCap width={22} height={22} />;
}