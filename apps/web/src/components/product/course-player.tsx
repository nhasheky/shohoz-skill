"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoPlayer } from "./video-player";
import { cn } from "@/lib/cn";
import type { CurriculumSection, CurriculumLesson } from "@/lib/types";
import { IconCheck, IconLock, IconPlay, IconVideo } from "@/components/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shohoz_token");
}

export function CoursePlayer({
  courseId,
  title,
  sections,
  enrolled,
}: {
  courseId: string;
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
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const active = lessons.find((x) => x.lesson.id === activeId) ?? lessons[0] ?? null;
  const canWatch = (l: CurriculumLesson) => enrolled || Boolean(l.preview);

  const load = useCallback(async () => {
    const t = token();
    if (!t) return;
    try {
      const res = await fetch(`${API_URL}/api/users/me/course-progress/${encodeURIComponent(courseId)}`, {
        headers: { Authorization: `Bearer ${t}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { lessons?: { lessonId: string | null; percent: number }[] };
      const done = new Set<string>();
      for (const l of data.lessons ?? []) if (l.lessonId && l.percent >= 100) done.add(l.lessonId);
      setCompleted(done);
    } catch {
      /* ignore */
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleComplete(lessonId: string, next: boolean) {
    const t = token();
    if (!t) return;
    setSaving(true);
    setCompleted((prev) => {
      const s = new Set(prev);
      if (next) s.add(lessonId);
      else s.delete(lessonId);
      return s;
    });
    try {
      await fetch(`${API_URL}/api/users/me/course-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ courseId, lessonId, completed: next }),
      });
    } catch {
      /* keep optimistic */
    } finally {
      setSaving(false);
    }
  }

  const total = lessons.length;
  const doneCount = completed.size;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const loggedIn = Boolean(token());

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-extrabold text-foreground sm:text-2xl">{title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-foreground">{doneCount}/{total} complete · {pct}%</span>
          {!enrolled && <span className="text-xs text-muted-foreground">(ফ্রি প্রিভিউ)</span>}
        </div>

        <div className="mt-4">
          {active && canWatch(active.lesson) ? (
            <VideoPlayer source={active.lesson.source} title={active.lesson.title} autoplayable={false} />
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">{active.lesson.title}</p>
                <p className="text-xs text-muted-foreground">{active.section} · {active.lesson.durationMinutes} min</p>
              </div>
              {canWatch(active.lesson) && loggedIn && (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={completed.has(active.lesson.id)}
                    disabled={saving}
                    onChange={(e) => void toggleComplete(active.lesson.id, e.target.checked)}
                    className="h-4 w-4 accent-[#F2A93B]"
                  />
                  {completed.has(active.lesson.id) ? "Completed ✓" : "Mark as complete"}
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="min-w-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-foreground">Course content</p>
            <p className="text-xs text-muted-foreground">{total} lessons · {doneCount} completed</p>
          </div>
          <div className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {lessons.map(({ section, lesson }) => {
              const unlocked = canWatch(lesson);
              const isActive = activeId === lesson.id;
              const isDone = completed.has(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveId(lesson.id)}
                  className={cn("flex w-full items-center gap-3 px-4 py-3 text-left transition-colors", isActive ? "bg-accent/10" : "hover:bg-muted/50")}
                >
                  <span className={cn("shrink-0", isDone ? "text-success" : unlocked ? "text-accent" : "text-muted-foreground")}>
                    {isDone ? <IconCheck width={16} height={16} /> : unlocked ? isActive ? <IconPlay width={16} height={16} /> : <IconVideo width={16} height={16} /> : <IconLock width={16} height={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{lesson.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{section} · {lesson.durationMinutes}m</span>
                  </span>
                  {lesson.preview && unlocked && !enrolled && <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">FREE</span>}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
