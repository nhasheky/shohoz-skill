import { BackgroundOrbs, ParticleField } from "@/components/layout/background";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconPlay, IconSearch, IconSparkles } from "@/components/ui/icons";

export function Hero({
  eyebrow = "Bangladesh's fastest learning platform",
  title,
  description = "BCS, NTRCA, bank & every government job — through fast video courses, real negative-marking MCQ exams, and books you can read instantly. Start learning in seconds, not weeks.",
  metrics,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  metrics?: Array<{ value: string; label: string }>;
}) {
  const displayMetrics = metrics?.length ? metrics : [
    { value: "62k+", label: "Learners" },
    { value: "320+", label: "Courses & exams" },
    { value: "1.2s", label: "Average page load" },
  ];

  return (
    <section className="relative overflow-hidden">
      <BackgroundOrbs />
      <ParticleField className="opacity-70" />
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-accent animate-fade-up">
            <IconSparkles width={14} height={14} /> {eyebrow}
          </span>

          {title ? (
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance animate-fade-up" style={{ animationDelay: "80ms" }}>
              {title}
            </h1>
          ) : (
            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance animate-fade-up" style={{ animationDelay: "80ms" }}>
              Prepare for <span className="text-primary">Govt. Jobs</span> with{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-accent">Learn to Earn</span>
                <svg className="absolute -bottom-1.5 left-0 z-0 h-3 w-full text-accent/70" viewBox="0 0 200 9" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 7C60 2 140 2 198 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          )}

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up" style={{ animationDelay: "160ms" }}>
            {description}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "240ms" }}>
            <ButtonLink href="/courses" variant="accent" size="xl" className="w-full sm:w-auto">
              Explore Courses
            </ButtonLink>
            <ButtonLink href="/exams" variant="outline" size="xl" className="w-full sm:w-auto">
              Free MCQ Exam
            </ButtonLink>
          </div>

          <form
            action="/courses"
            className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card animate-fade-up"
            style={{ animationDelay: "320ms" }}
            role="search"
          >
            <IconSearch width={18} height={18} className="ml-2 shrink-0 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search courses, exams, books…"
              className="w-full bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Search courses, exams and books"
            />
            <Button type="submit" size="sm" className="rounded-xl">
              Search
            </Button>
          </form>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center animate-fade-up" style={{ animationDelay: "400ms" }}>
            {displayMetrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-border bg-card/70 px-3 py-4">
                <div className="font-display text-2xl font-extrabold text-primary sm:text-3xl">{m.value}</div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mb-1 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-10" aria-hidden />
      </div>
    </section>
  );
}

export function DeviceLimitStrip() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-sky/50 bg-sky/5 px-4 py-3 text-center text-xs text-muted-foreground sm:flex-row">
        <span className="text-sky-deep">⚡ Instant access</span>
        <span className="hidden text-border sm:inline">•</span>
        <span>Log in on up to 2 devices</span>
        <span className="hidden text-border sm:inline">•</span>
        <span>Every page loads in under a second</span>
        <span className="hidden text-border sm:inline">•</span>
        <span className="inline-flex items-center gap-1">
          <IconPlay width={12} height={12} className="text-accent" /> Watch sample lesson
        </span>
      </div>
    </div>
  );
}