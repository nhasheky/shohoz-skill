"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { IconChevronDown } from "@/components/ui/icons";

export function FaqAccordion({ items, className }: { items: FaqItem[]; className?: string }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className={cn("divide-y divide-border rounded-2xl border border-border bg-card shadow-card", className)}>
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? -1 : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
            >
              <span className="font-display text-[15px] font-semibold text-foreground">{item.question}</span>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform duration-200",
                  open && "rotate-180 border-accent text-accent"
                )}
              >
                <IconChevronDown width={16} height={16} />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}