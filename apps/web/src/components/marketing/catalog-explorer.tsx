"use client";

import { useMemo, useState } from "react";
import type { Book, Course, Exam } from "@/lib/types";
import { cn } from "@/lib/cn";
import { CourseCard, BookCard, ExamCard } from "@/components/ui/product-card";
import { IconSearch, IconX } from "@/components/ui/icons";

type SortKey = "popular" | "rating" | "price-asc" | "price-desc" | "newest";

type Base = { id: string; title: string; titleBn?: string; category: string; categoryBn?: string; rating: number; createdAt: string; students?: number; attemptCount?: number; isFree?: boolean; priceLow?: number };
type Item = Course | Book | Exam;

function metaOf(item: Item): Base {
  if (isCourse(item)) return { ...item, category: item.category, priceLow: item.priceMap.LIFETIME?.amount ?? 0, students: item.students };
  if (isBook(item)) {
    const prices = [item.pdfPrice?.amount, item.hardcopyPrice?.amount].filter((n): n is number => typeof n === "number");
    return { ...item, priceLow: prices.length ? Math.min(...prices) : 0, students: item.students };
  }
  return { ...item, title: item.title, category: item.category ?? "Exam", priceLow: item.isFree ? 0 : item.price?.amount ?? 0, students: item.attemptCount };
}

function isCourse(i: Item): i is Course {
  return "priceMap" in i;
}
function isBook(i: Item): i is Book {
  return "hardcopyPrice" in i || "pdfPrice" in i;
}

const sorters: Record<SortKey, (a: Base, b: Base) => number> = {
  popular: (a, b) => (b.students ?? b.attemptCount ?? 0) - (a.students ?? a.attemptCount ?? 0),
  rating: (a, b) => b.rating - a.rating,
  "price-asc": (a, b) => (a.priceLow ?? 0) - (b.priceLow ?? 0),
  "price-desc": (a, b) => (b.priceLow ?? 0) - (a.priceLow ?? 0),
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
};

export function CatalogExplorer({
  kind,
  items,
  placeholder,
  enableSearch = true,
  enableSort = true,
  searchParam,
  initialCategory,
}: {
  kind: "course" | "book" | "exam";
  items: Item[];
  placeholder: string;
  enableSearch?: boolean;
  enableSort?: boolean;
  searchParam?: string;
  initialCategory?: string;
}) {
  const [q, setQ] = useState(searchParam ?? "");
  const [cat, setCat] = useState<string>(initialCategory && initialCategory !== "all" ? initialCategory : "All");
  const [sort, setSort] = useState<SortKey>("popular");

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      const c = isCourse(i) ? i.category : isBook(i) ? i.category : i.category ?? "Exam";
      set.add(c);
    });
    return ["All", ...set];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const result = items.filter((i) => {
      const text = `${i.title} ${i.titleBn ?? ""} ${i.category}`.toLowerCase();
      if (needle && !text.includes(needle)) return false;
      const c = isCourse(i) ? i.category : isBook(i) ? i.category : i.category ?? "Exam";
      if (cat !== "All" && c.toLowerCase() !== cat.toLowerCase()) return false;
      return true;
    });
    return result
      .map((i) => ({ item: i, meta: metaOf(i) }))
      .sort((a, b) => sorters[sort](a.meta, b.meta))
      .map((x) => x.item);
  }, [items, q, cat, sort]);

  const show = (i: Item) => {
    if (kind === "course") return <CourseCard course={i as Course} />;
    if (kind === "book") return <BookCard book={i as Book} />;
    return <ExamCard exam={i as Exam} />;
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center">
        {enableSearch && (
          <label className="relative flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <IconSearch width={16} height={16} className="shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {q && (
              <button aria-label="Clear search" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <IconX width={14} height={14} />
              </button>
            )}
          </label>
        )}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {allCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer",
                cat === c ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {enableSort && (
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none"
            aria-label="Sort products"
          >
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="newest">Newest</option>
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
          No results for &ldquo;{q}&rdquo;. Try a different keyword.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((i) => (
            <div key={i.id}>{show(i)}</div>
          ))}
        </div>
      )}
    </div>
  );
}