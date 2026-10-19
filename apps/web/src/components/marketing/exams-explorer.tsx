"use client";

import type { Exam } from "@/lib/types";
import { useQueryParam } from "@/lib/use-query-param";
import { ExamCard } from "@/components/ui/product-card";
import { CatalogExplorer } from "./catalog-explorer";

export function ExamsExplorer({ items }: { items: Exam[] }) {
  const freeView = useQueryParam("type") === "free";

  if (freeView) {
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
