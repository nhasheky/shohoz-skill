"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Exam, Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconChevronLeft, IconChevronRight, IconCircleX, IconClock, IconFlag, IconTarget } from "@/components/ui/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

type AttemptQuestion = Question & { topicTitle: string; subjectId: string; marks: number; negative: number };

type Result = {
  examId: string;
  subjectId?: string;
  title: string;
  date: string;
  score: number;
  maxMarks: number;
  correct: number;
  wrong: number;
  unanswered: number;
  passed: boolean;
};

export function ExamSession({
  exam,
  subjectId,
  topicIndex,
}: {
  exam: Exam;
  subjectId?: string;
  topicIndex?: string;
}) {
  const input = useMemo(() => Subjectless(exam, subjectId, topicIndex), [exam, subjectId, topicIndex]);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Set<string>>(() => new Set());
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(input.totalMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          // auto-submit
          setTimeout(() => setSubmitted(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  const flat: AttemptQuestion[] = useMemo(() => {
    return input.subjects.flatMap((s) =>
      s.topics.flatMap((t) =>
        t.questions.map((q) => ({
          ...q,
          topicTitle: t.title,
          subjectId: s.id,
          marks: t.marksPerQuestion ?? 1,
          negative: t.negativeMarks ?? exam.defaultNegativeMarks ?? 0,
        })),
      ),
    );
  }, [input, exam.defaultNegativeMarks]);

  const q = flat[current];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((current / Math.max(1, flat.length - 1)) * 100);

  function mark(qid: string, index: number) {
    setAnswers((a) => ({ ...a, [qid]: index }));
  }

  function toggleFlag(qid: string) {
    setFlags((f) => {
      const next = new Set(f);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  }

  // Persist the finished attempt to the account (dashboard results / admin).
  useEffect(() => {
    if (!submitted || saved) return;
    setSaved(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("shohoz_token") : null;
    if (!token) return;
    const res = computeResult(exam, flat, answers, input.subjectId);
    void fetch(`${API_URL}/api/exams/${exam.id}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...res, answers }),
    }).catch(() => {});
  }, [submitted, saved, exam, flat, answers, input.subjectId]);

  const result = submitted ? computeResult(exam, flat, answers, input.subjectId) : null;

  if (submitted && result) return <ResultView result={result} flat={flat} answers={answers} examTitle={exam.title} onRetry={() => { setAnswers({}); setFlags(new Set()); setCurrent(0); setSeconds(input.totalMinutes * 60); setSubmitted(false); setSaved(false); }} onExitHref="/exams" />;

  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-extrabold text-foreground">{exam.title}</p>
            <p className="text-xs text-muted-foreground">
              {input.subjectTitle ? `${input.subjectTitle} · ` : ""}{input.topicTitle ?? ""} · Question {current + 1} of {flat.length}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-bold", seconds < 60 ? "bg-danger/10 text-danger" : "bg-muted text-foreground")}>
              <IconClock width={14} height={14} />
              {mmss(seconds)}
            </span>
            <Button variant="accent" size="sm" onClick={() => setConfirmOpen(true)} disabled={submitted}>
              Submit
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-muted">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-8">
        {/* Question */}
        <section key={q.id} className="min-w-0 animate-fade-up">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary dark:bg-surface">{q.topicTitle}</span>
              <button
                type="button"
                onClick={() => toggleFlag(q.id)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                  flags.has(q.id) ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <IconFlag width={13} height={13} /> Flag
              </button>
            </div>
            <h2 className="mt-4 font-display text-lg font-bold leading-relaxed text-foreground sm:text-xl">
              {current + 1}. {q.text}
            </h2>
            <div className="mt-6 space-y-2.5">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => mark(q.id, i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition-colors",
                      selected ? "border-accent bg-accent/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-sky/50 hover:text-foreground",
                    )}
                  >
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold", selected ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground")}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
                <IconChevronLeft width={15} height={15} className="mr-1.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {answeredCount} answered · {flags.size} flagged
              </span>
              {current < flat.length - 1 ? (
                <Button variant="accent" size="sm" onClick={() => setCurrent((c) => Math.min(flat.length - 1, c + 1))}>
                  Next <IconChevronRight width={15} height={15} className="ml-1.5" />
                </Button>
              ) : (
                <Button variant="accent" size="sm" onClick={() => setConfirmOpen(true)}>
                  Submit
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Palette */}
        <aside className="mt-6 lg:mt-0">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm font-bold text-foreground">Question palette</p>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-6">
              {flat.map((item, i) => {
                const isAns = answers[item.id] !== undefined;
                const isFlag = flags.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "relative flex h-9 items-center justify-center rounded-lg text-xs font-bold transition-colors",
                      isAns ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                      i === current && "ring-2 ring-sky",
                      isFlag && "after:absolute after:right-1 after:top-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-danger",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> Answered</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted ring-1 ring-border" /> Unanswered</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Flagged</span>
            </div>
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
              <IconTarget width={12} height={12} className="mr-1 inline text-accent" />
              Negative marking: −{exam.defaultNegativeMarks} for wrong answers. Unanswered = no penalty.
            </p>
          </div>
        </aside>
      </main>

      {/* Confirm submit modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-pop">
            <p className="font-display text-lg font-extrabold text-foreground">Submit exam?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You answered {answeredCount} of {flat.length} questions{seconds < 60 ? " and the timer is about to expire." : "."} You can review before submitting.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
                Keep working
              </Button>
              <Button
                variant="accent"
                className="flex-1"
                onClick={() => {
                  setConfirmOpen(false);
                  setSubmitted(true);
                }}
              >
                Submit now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function computeResult(
  exam: Exam,
  flat: AttemptQuestion[],
  answers: Record<string, number>,
  subjectId?: string,
): Result {
  let correct = 0;
  let wrong = 0;
  let score = 0;
  let max = 0;
  for (const q of flat) {
    max += q.marks;
    const given = answers[q.id];
    if (given === undefined) continue;
    if (given === q.answerIndex) {
      correct += 1;
      score += q.marks;
    } else {
      wrong += 1;
      score -= q.negative;
    }
  }
  score = Math.max(0, Math.round(score * 10) / 10);
  return {
    examId: exam.id,
    subjectId,
    title: exam.title,
    date: new Date().toISOString(),
    score,
    maxMarks: max,
    correct,
    wrong,
    unanswered: flat.length - correct - wrong,
    passed: (score / max) * 100 >= (exam.passRate ?? 50),
  };
}

function ResultView({
  result,
  flat,
  answers,
  examTitle,
  onRetry,
  onExitHref,
}: {
  result: Result;
  flat: AttemptQuestion[];
  answers: Record<string, number>;
  examTitle: string;
  onRetry: () => void;
  onExitHref: string;
}) {
  const pct = Math.round((result.score / Math.max(1, result.maxMarks)) * 100);
  const [showExplanations, setShowExplanations] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10">
        <div className="flex flex-col items-center text-center">
          {result.passed ? (
            <IconCheckCircle width={52} height={52} className="text-success" />
          ) : (
            <IconCircleX width={52} height={52} className="text-danger" />
          )}
          <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            {result.passed ? "Excellent work!" : "Keep practising"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {examTitle} · {new Date(result.date).toLocaleString("en-BD")}
          </p>

          <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultStat label="Score" value={`${result.score}`} sub={`/ ${result.maxMarks}`} tone="accent" />
            <ResultStat label="Correct" value={`${result.correct}`} sub="answers" tone="success" />
            <ResultStat label="Wrong" value={`${result.wrong}`} sub={`− penalties applied`} tone="danger" />
            <ResultStat label="Unanswered" value={`${result.unanswered}`} sub="skipped" tone="muted" />
          </div>

          <div className="mt-6 w-full max-w-md rounded-2xl bg-muted/60 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Percentage</span>
              <span className={cn("font-display text-lg font-extrabold", pct >= 60 ? "text-success" : pct >= 40 ? "text-warning" : "text-danger")}>{pct}%</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", pct >= 60 ? "bg-success" : pct >= 40 ? "bg-warning" : "bg-danger")}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="accent" onClick={onRetry}>
              Retry exam
            </Button>
            <ButtonLinkClassic href={onExitHref} variant="outline">
              Back to exams
            </ButtonLinkClassic>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => setShowExplanations((v) => !v)}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-accent hover:underline"
        >
          {showExplanations ? "Hide" : "Show"} step-by-step solutions ({flat.length})
        </button>
        {showExplanations && (
          <div className="space-y-3">
            {flat.map((q, i) => {
              const given = answers[q.id];
              const isCorrect = given === q.answerIndex;
              return (
                <div key={q.id} className={cn("rounded-3xl border bg-card p-5 shadow-card", isCorrect ? "border-success/30" : "border-border")}>
                  <p className="text-sm font-bold text-foreground">
                    {i + 1}. {q.text}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const isAnswer = oi === q.answerIndex;
                      const isGiven = given === oi;
                      return (
                        <div
                          key={oi}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                            isAnswer ? "bg-success/10 text-success" : isGiven ? "bg-danger/10 text-danger" : "text-muted-foreground",
                          )}
                        >
                          <span className="w-5 font-bold">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                          {isAnswer && <IconCheckCircle width={14} height={14} className="ml-auto" />}
                          {isGiven && !isAnswer && <IconCircleX width={14} height={14} className="ml-auto" />}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <p className="mt-3 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-bold text-foreground">Why: </span>
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "accent" | "success" | "danger" | "muted" }) {
  const tones: Record<string, string> = {
    accent: "text-accent",
    success: "text-success",
    danger: "text-danger",
    muted: "text-foreground",
  };
  return (
    <div className={cn("rounded-2xl border border-border bg-muted/40 p-3 text-center")}>
      <p className={cn("font-display text-2xl font-extrabold", tones[tone])}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function ButtonLinkClassic({ href, variant, children }: { href: string; variant: "outline"; children: ReactNode }) {
  const styles = variant === "outline" ? "border border-border" : "";
  return (
    <a
      href={href}
      className={cn("inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition-colors hover:bg-muted", styles)}
    >
      {children}
    </a>
  );
}

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Subjectless(exam: Exam, subjectId?: string, topicIndex?: string) {
  const subject = subjectId ? exam.subjects.find((s) => s.id === subjectId) : undefined;
  const topic =
    subject && topicIndex !== undefined
      ? subject.topics[Number(topicIndex)]
      : undefined;
  const subjects = subject
    ? [{ ...subject, topics: topic ? [topic] : subject.topics }]
    : exam.subjects;
  return {
    subjects,
    subjectId: subject?.id,
    subjectTitle: subject?.title ?? (subjects.length > 1 ? "Full package" : undefined),
    topicTitle: topic?.title,
    totalMinutes: subjects.reduce((n, s) => n + s.topics.reduce((m, t) => m + t.durationMinutes, 0), 0),
  };
}