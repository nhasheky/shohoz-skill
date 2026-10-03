"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconCircleX, IconRefresh } from "@/components/ui/icons";
import type { Exam } from "@/lib/types";
import type { MyExamAttempt } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd";

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
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
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
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(attempt.submittedAt).toLocaleString("en-BD")}
            </p>
          </>
        )}

        <div className="mt-8 space-y-3">
          {isPending ? (
            <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-semibold text-foreground">
              Re-exam request admin-এর কাছে pending। Approve হলে আবার পরীক্ষা দিতে পারবেন।
            </p>
          ) : (
            <Button variant="accent" onClick={requestReExam} disabled={busy}>
              <IconRefresh width={16} height={16} className="mr-2" /> {busy ? "Requesting…" : "Re-exam request পাঠান"}
            </Button>
          )}
          {msg && <p className="text-xs font-semibold text-muted-foreground">{msg}</p>}
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/exams" className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted">All exams</Link>
            <Link href="/dashboard" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">Dashboard</Link>
          </div>
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
