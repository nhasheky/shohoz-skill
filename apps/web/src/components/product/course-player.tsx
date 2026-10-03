"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoPlayer } from "./video-player";
import { cn } from "@/lib/cn";
import type { CurriculumSection, CurriculumLesson } from "@/lib/types";
import { IconCheck, IconLock, IconPlay, IconVideo } from "@/components/ui/icons";

export function CoursePlayer({
  title,
  sections,
  enrolled,
}: {
  title: string;
  sections: CurriculumSection[];
  enrolled: boolean;
}) {
  const params = useSearchParams();
  const lessons = useMemo(
    () => sections.flatMap((s) => s.lessons.map((l) => ({ section: s.title, lesson: l }))),
    [sections],
  );
  const initial = params.get("lesson");
  const [activeId, setActiveId] = useState<string | null>(initial ?? lessons[0]?.lesson.id ?? null);
  const active = lessons.find((x) => x.lesson.id === activeId) ?? lessons[0] ?? null;
  const canWatch = (l: CurriculumLesson) => enrolled || Boolean(l.preview);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {enrolled ? "Full access unlocked — enjoy the course." : "কিছু লেসন ফ্রি প্রিভিউ — বাকিগুলো কিনলে আনলক হবে।"}
        </p>

        <div className="mt-4">
          {active && canWatch(active.lesson) ? (
            <VideoPlayer
              source={active.lesson.source}
              title={active.lesson.title}
              autoplayable={false}
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <IconLock width={26} height={26} />
              </span>
              <p className="font-display text-base font-extrabold text-foreground">এই লেসনটি লক করা</p>
              <p className="max-w-xs text-sm text-muted-foreground">কোর্সটি কিনলে সব ভিডিও আনলক হয়ে যাবে।</p>
            </div>
          )}
          {active && (
            <div className="mt-3">
              <p className="text-sm font-bold text-foreground">{active.lesson.title}</p>
              <p className="text-xs text-muted-foreground">
                {active.section} · {active.lesson.durationMinutes} min
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="min-w-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Course content</p>
            <p className="text-xs text-muted-foreground">{lessons.length} lessons</p>
          </div>
          <div className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {lessons.map(({ section, lesson }) => {
              const unlocked = canWatch(lesson);
              const isActive = activeId === lesson.id;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveId(lesson.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    isActive ? "bg-accent/10" : "hover:bg-muted/50",
                  )}
                >
                  <span className={cn("shrink-0", unlocked ? "text-accent" : "text-muted-foreground")}>
                    {unlocked ? (
                      isActive ? (
                        <IconPlay width={16} height={16} />
                      ) : (
                        <IconVideo width={16} height={16} />
                      )
                    ) : (
                      <IconLock width={16} height={16} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{lesson.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {section} · {lesson.durationMinutes}m
                    </span>
                  </span>
                  {lesson.preview && unlocked && !enrolled && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">FREE</span>
                  )}
                  {enrolled && <IconCheck width={15} height={15} className="shrink-0 text-success" />}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
