import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { CatalogExplorer } from "@/components/marketing/catalog-explorer";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getCourses } from "@/lib/api";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore BCS, NTRCA, bank and government-job courses. Short video lessons, exam-oriented content and instant enrollment.",
};

export const revalidate = 60;

export default async function CoursesPage(props: PageProps<"/courses">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";

  const courses = await getCourses();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            eyebrow="Courses"
            title="Government-job courses, taught exam-first"
            description="Every course is built around questions actually asked in real exams — with shortcuts, quizzes and a certificate on completion."
            center
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CatalogExplorer
          kind="course"
          items={courses}
          placeholder="Search courses (e.g. BCS prelim, NTRCA…)"
          searchParam={q}
          initialCategory={category}
        />
      </section>

      <section className="pb-20">
        <CtaBanner
          title="Not sure which course fits you?"
          description="Talk to our academic advisors for free — they will map a 3-month plan around your target exam."
          primaryLabel="Book a Free Consult"
          primaryHref="/contact"
          secondaryLabel="Browse Free Exams"
          secondaryHref="/exams?type=free"
        />
      </section>
    </main>
  );
}