"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Exam } from "@/lib/types";
import { ExamCard } from "@/components/ui/product-card";
import { CatalogExplorer } from "./catalog-explorer";

export function ExamsExplorer({ items }: { items: Exam[] }) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="skeleton aspect-video w-full rounded-xl" />
              <div className="mt-3 skeleton h-4 w-3/4 rounded" />
              <div className="mt-2 skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      }
    >
      <Inner items={items} />
    </Suspense>
  );
}

function Inner({ items }: { items: Exam[] }) {
  const isFreeView = useSearchParams().get("type") === "free";

  if (isFreeView) {
    const free = items.filter((e) => e.isFree);
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-3">
          <p className="text-sm font-bold text-foreground">ফ্রি পরীক্ষা — unlimited attempts</p>
          <span className="text-xs font-semibold text-muted-foreground">{free.length} free exams</span>
        </div>
        {free.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            এখনো কোনো ফ্রি exam নেই।
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {free.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <CatalogExplorer kind="exam" items={items} placeholder="Search exams & packages (e.g. NTRCA, BCS…)" />;
}
