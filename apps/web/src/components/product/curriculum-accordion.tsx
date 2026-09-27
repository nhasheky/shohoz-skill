"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { CurriculumSection as CurriculumSectionType } from "@/lib/types";
import { IconChevronDown, IconClock, IconPlay, IconVideo } from "@/components/ui/icons";

export function CurriculumAccordion({ sections }: { sections: CurriculumSectionType[] }) {
  const [open, setOpen] = useState<string | null>(sections[0]?.id ?? null);

  const sectionMin = (s: CurriculumSectionType) => s.lessons.reduce((n, l) => n + l.durationMinutes, 0);
  const pad = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}` : `${m}m`);

  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalMin = sections.reduce((n, s) => n + sectionMin(s), 0);

  return (
    <div className="rounded-3xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <h3 className="font-display text-lg font-extrabold text-foreground">Course Curriculum</h3>
        <span className="text-xs text-muted-foreground">
          {sections.length} sections · {totalLessons} lessons · {pad(totalMin)} total
        </span>
      </div>
      <div className="divide-y divide-border">
        {sections.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : s.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.lessons.length} lessons · {pad(sectionMin(s))}
                  </p>
                </div>
                <IconChevronDown
                  width={18}
                  height={18}
                  className={cn("shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
              {isOpen && (
                <ul className="px-5 pb-4 sm:px-6">
                  {s.lessons.map((l, i) => (
                    <li
                      key={l.id}
                      className="group flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        {l.source.type === "youtube" ? (
                          <IconPlay width={15} height={15} className="mt-0.5 shrink-0 text-accent" />
                        ) : (
                          <IconVideo width={15} height={15} className="mt-0.5 shrink-0 text-sky" />
                        )}
                        <p className="truncate text-sm text-foreground">{l.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {l.preview ?? i === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Free preview</span>
                        ) : null}
                        <span className="flex items-center text-xs text-muted-foreground">
                          <IconClock width={12} height={12} className="mr-1" />
                          {l.durationMinutes}m
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}