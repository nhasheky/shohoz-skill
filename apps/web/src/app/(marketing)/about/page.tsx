import type { Metadata } from "next";
import { aboutContent } from "@/lib/data/site-content";
import { getPageContent, type AboutPageData } from "@/lib/api";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { StatsBand } from "@/components/marketing/stats";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { SITE } from "@/lib/site";
import { IconSparkles, IconTarget, IconWallet, IconGlobe } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: `About Us — ${SITE.name}`,
  description: "Who we are, why we built Shohoz Skill, and how we're making government-job preparation fast, honest and affordable.",
};

const VALUE_ICONS = [IconSparkles, IconTarget, IconWallet, IconGlobe];

export default async function AboutPage() {
  const about = await getPageContent<AboutPageData>("about");
  const story = about.story?.length ? about.story : aboutContent.story;
  const values = about.values?.length ? about.values : aboutContent.values;
  const milestones = about.milestones?.length ? about.milestones : aboutContent.milestones;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="navy" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="About Us"
            title={about.title || "Job preparation, rebuilt as a product"}
            description={about.description || "We are a small team of ex-BCS and ex-bank officers who got tired of how slow and expensive government-job preparation had become."}
            center
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-5">
          {story.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-muted-foreground">
              {i === 0 ? <span className="float-left pr-3 font-display text-6xl font-extrabold leading-[0.8] text-accent">{p.charAt(0)}</span> : null}
              {p}
            </p>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <StatsBand />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Our values" title="What we refuse to compromise on" center />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <div key={v.title} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon width={20} height={20} />
                </span>
                <p className="mt-4 font-display text-base font-extrabold text-foreground">{v.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-card/40 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="The journey" title="Milestones" center />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => (
              <div key={m.year} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <p className="font-display text-3xl font-extrabold text-accent">{m.year}</p>
                <p className="mt-2 font-display text-base font-extrabold text-foreground">{m.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <CtaBanner
          title="Join the 62,000+ learners"
          description="Start with a free exam — feel the speed before you commit."
          primaryLabel="Try a Free Exam"
          primaryHref="/exams?type=free"
          secondaryLabel="Talk to us"
          secondaryHref="/contact"
        />
      </section>
    </main>
  );
}