"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/admin-api";
import { cn } from "@/lib/cn";

export type SuggestedRef = { type: "course" | "book" | "exam"; id: string };

type Option = { type: SuggestedRef["type"]; id: string; title: string };

export function SuggestedProductsEditor({ value, onChange }: { value: SuggestedRef[]; onChange: (v: SuggestedRef[]) => void }) {
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.listCourses("", 1, 200), api.listBooks("", 1, 200), api.listExams("", 1, 200)])
      .then(([c, b, e]) => {
        setOptions([
          ...c.items.map((x) => ({ type: "course" as const, id: String(x.id), title: String(x.title) })),
          ...b.items.map((x) => ({ type: "book" as const, id: String(x.id), title: String(x.title) })),
          ...e.items.map((x) => ({ type: "exam" as const, id: String(x.id), title: String(x.title) })),
        ]);
      })
      .catch(() => {});
  }, []);

  const has = (t: string, id: string) => value.some((v) => v.type === t && v.id === id);
  const toggle = (t: SuggestedRef["type"], id: string) =>
    onChange(has(t, id) ? value.filter((v) => !(v.type === t && v.id === id)) : [...value, { type: t, id }]);
  const titleOf = (t: string, id: string) => options.find((o) => o.type === t && o.id === id)?.title ?? id;

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground">No suggestions picked — related items are auto-suggested.</span>
        )}
        {value.map((v) => (
          <span key={`${v.type}-${v.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <span className="uppercase opacity-70">{v.type}</span> {titleOf(v.type, v.id)}
            <button type="button" onClick={() => toggle(v.type, v.id)} className="text-accent/70 hover:text-accent" aria-label="remove">✕</button>
          </span>
        ))}
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted">
        {open ? "Close" : "+ Pick products"}
      </button>
      {open && (
        <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border bg-surface/50 p-3">
          {(["course", "book", "exam"] as const).map((t) => (
            <div key={t}>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{t}s</p>
              <div className="flex flex-wrap gap-1.5">
                {options.filter((o) => o.type === t).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggle(t, o.id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      has(t, o.id) ? "border-accent bg-accent/15 text-accent" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {o.title}
                  </button>
                ))}
                {options.filter((o) => o.type === t).length === 0 && <span className="text-xs text-muted-foreground">No {t}s.</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
