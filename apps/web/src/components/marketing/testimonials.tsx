"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/lib/data/site-content";
import { cn } from "@/lib/cn";
import { Stars } from "@/components/ui/rating";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/icons";

function IconQuote() {
  return (
    <svg viewBox="0 0 24 24" width={30} height={30} fill="currentColor" aria-hidden>
      <path d="M10 7H6a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-7a1 1 0 0 0-1-1zM21 7h-4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-7a1 1 0 0 0-1-1z" />
    </svg>
  );
}

export function TestimonialCarousel() {
  const items = testimonials.filter((t) => t.placement !== "product");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const current = items[index];

  return (
    <div
      className="mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card sm:p-10">
        <div className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-accent/10" />
        <div className="text-accent">
          <IconQuote />
        </div>
        <blockquote className="mt-4 text-pretty font-display text-lg font-medium leading-relaxed text-foreground sm:text-xl">
          {current.text ?? "Image review"}
        </blockquote>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {current.name.slice(0, 1)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{current.name}</p>
              <p className="text-xs text-muted-foreground">{current.role}</p>
            </div>
          </div>
          <Stars rating={current.rating} />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                aria-label={`Show testimonial ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all cursor-pointer",
                  i === index ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Previous testimonial"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-accent hover:text-accent cursor-pointer"
            >
              <IconChevronLeft width={17} height={17} />
            </button>
            <button
              aria-label="Next testimonial"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:border-accent hover:text-accent cursor-pointer"
            >
              <IconChevronRight width={17} height={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}