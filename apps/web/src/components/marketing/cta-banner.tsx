import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { IconRocket } from "@/components/ui/icons";

export function CtaBanner({
  badge = "Start today",
  title = "Your job is waiting. Learn to Earn.",
  description = "Join 62,000+ aspirants preparing faster with Shohoz Skill. Courses, MCQ exams and books — all under one roof.",
  primaryLabel = "Browse Courses",
  primaryHref = "/courses",
  secondaryLabel = "View Exam Packages",
  secondaryHref = "/exams",
  footnote = "Pay with bKash · Nagad · SSLCommerz — instant access",
}: {
  badge?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  footnote?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center shadow-card sm:px-12">
        <BackgroundOrbs variant="accent" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
            <IconRocket width={14} height={14} /> {badge}
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl text-balance">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-primary-foreground/80">{description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={primaryHref} variant="accent" size="lg">
              {primaryLabel}
            </ButtonLink>
            <ButtonLink
              href={secondaryHref}
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              {secondaryLabel}
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-primary-foreground/60">{footnote}</p>
        </div>
      </div>
    </section>
  );
}