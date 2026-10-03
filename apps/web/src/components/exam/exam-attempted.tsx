"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconCircleX, IconRefresh } from "@/components/ui/icons";
import type { Exam } from "@/lib/types";
import type { MyExamAttempt } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

type FlatQ = {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
  topicTitle: string;
};

export function ExamAttempted({
  exam,
  attempt,
  pending,
}: {
  exam: Exam;
  attempt: MyExamAttempt["attempt"];
  pending: boolean;
}) {
  const [isPending, setIsPending] = useState(pending);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showAnswers, setShowAnswers] = useState(true);

  const answers = attempt?.answers ?? {};
  const flat: FlatQ[] = exam.subjects.flatMap((s) =>
    s.topics.flatMap((t) =>
      t.questions.map((q) => ({ id: q.id, text: q.text, options: q.options, answerIndex: q.answerIndex, explanation: q.explanation, topicTitle: t.title })),
    ),
  );

  async function requestReExam() {
    const token = typeof window !== "undefined" ? localStorage.getItem("shohoz_token") : null;
    if (!token) {
      setMsg("Re-exam request করতে লগইন করুন।");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/exams/${exam.id}/re-exam`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(((await res.json()) as { message?: string })?.message || "Request failed");
      setIsPending(true);
      setMsg("Re-exam request পাঠানো হয়েছে — admin approve করলে আবার পরীক্ষা দিতে পারবেন।");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  const pct = attempt ? Math.round((attempt.score / Math.max(1, attempt.maxMarks)) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        {attempt?.passed ? (
          <IconCheckCircle width={48} height={48} className="mx-auto text-success" />
        ) : (
          <IconCircleX width={48} height={48} className="mx-auto text-danger" />
        )}
        <h1 className="mt-4 font-display text-2xl font-extrabold text-foreground">আপনি ইতিমধ্যে এই পরীক্ষা দিয়েছেন</h1>
        <p className="mt-1 text-sm text-muted-foreground">{exam.title}</p>

        {attempt && (
          <>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Score" value={`${attempt.score}`} sub={`/ ${attempt.maxMarks}`} tone="accent" />
              <Stat label="Correct" value={`${attempt.correct}`} tone="success" />
              <Stat label="Wrong" value={`${attempt.wrong}`} tone="danger" />
              <Stat label="Skipped" value={`${attempt.unanswered}`} tone="muted" />
            </div>
            <p className={cn("mt-4 font-display text-lg font-extrabold", attempt.passed ? "text-success" : "text-danger")}>
              {attempt.passed ? "PASS" : "FAIL"} · {pct}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(attempt.submittedAt).toLocaleString("en-BD")}</p>
          </>
        )}
      </div>

      {attempt && flat.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAnswers((v) => !v)}
            className="mb-4 flex items-center gap-2 text-sm font-bold text-accent hover:underline"
          >
            {showAnswers ? "উত্তর ও ব্যাখ্যা লুকান" : "উত্তর ও ব্যাখ্যা দেখুন"} ({flat.length}টি প্রশ্ন)
          </button>

          {showAnswers && (
            <div className="space-y-3">
              {flat.map((q, i) => {
                const given = answers[q.id];
                const isCorrect = given === q.answerIndex;
                return (
                  <div key={q.id} className={cn("rounded-3xl border bg-card p-5 shadow-card", given === undefined ? "border-border" : isCorrect ? "border-success/30" : "border-danger/30")}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-foreground">{i + 1}. {q.text}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", given === undefined ? "bg-muted text-muted-foreground" : isCorrect ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                        {given === undefined ? "SKIPPED" : isCorrect ? "CORRECT" : "WRONG"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isAnswer = oi === q.answerIndex;
                        const isGiven = given === oi;
                        return (
                          <div key={oi} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", isAnswer ? "bg-success/10 text-success" : isGiven ? "bg-danger/10 text-danger" : "text-muted-foreground")}>
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
                        <span className="font-bold text-foreground">ব্যাখ্যা: </span>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        {isPending ? (
          <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-semibold text-foreground">
            Re-exam request admin-এর কাছে pending। Approve হলে আবার পরীক্ষা দিতে পারবেন।
          </p>
        ) : (
          <Button variant="accent" onClick={requestReExam} disabled={busy}>
            <IconRefresh width={16} height={16} className="mr-2" /> {busy ? "Requesting…" : "Re-exam request পাঠান"}
          </Button>
        )}
        {msg && <p className="mt-3 text-xs font-semibold text-muted-foreground">{msg}</p>}
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/exams" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">All exams</Link>
          <Link href="/dashboard" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: "accent" | "success" | "danger" | "muted" }) {
  const tones = { accent: "text-accent", success: "text-success", danger: "text-danger", muted: "text-foreground" };
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3 text-center">
      <p className={cn("font-display text-xl font-extrabold", tones[tone])}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}{sub ? ` ${sub}` : ""}</p>
    </div>
  );
}
