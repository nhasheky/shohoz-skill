import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { ExamCard } from "@/components/ui/product-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { CatalogExplorer } from "@/components/marketing/catalog-explorer";
import { getExams, getFreeExams } from "@/lib/api";
import { IconTarget } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "MCQ Exam & Packages",
  description:
    "Free & paid MCQ exams with real negative marking, instant results and explanations. Topic-wise exams bundled into packages for BCS, NTRCA and bank jobs.",
};

export const revalidate = 60;

export default async function ExamsPage(props: PageProps<"/exams">) {
  const searchParams = await props.searchParams;
  const type = typeof searchParams.type === "string" ? searchParams.type : "";

  if (type === "free") {
    const freeExams = await getFreeExams();
    return (
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <BackgroundOrbs />
          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <SectionHeader
              eyebrow="Free Exams"
              title="Test the engine for free, unlimited attempts"
              description="No signup for preview — sign in only when you want to save your result and see full analysis."
              center
            />
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {freeExams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        </section>
      </main>
    );
  }

  const all = await getExams();
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="accent" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            eyebrow="Exam Engine"
            title="MCQ exams that feel like the real board"
            description="Packages bundle subjects, each subject splits into topic-wise exams. Negative marking is configurable per question — just like the board."
            center
          />
          <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
              <IconTarget width={14} height={14} className="text-accent" /> Package → Subject → Topic
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
              Instant result + answer explanations
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-muted-foreground">
              Negative-marking simulators
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CatalogExplorer kind="exam" items={all} placeholder="Search exams & packages (e.g. NTRCA, BCS…)" />
      </section>

      <section className="pb-20">
        <CtaBanner
          title="Practise before the board even opens the envelope"
          description="Join 15,000+ students who sit a Shohoz Skill mock exam every single week."
          primaryLabel="View Packages"
          primaryHref="/exams"
          secondaryLabel="Free Mini Tests"
          secondaryHref="/exams?type=free"
        />
      </section>
    </main>
  );
}