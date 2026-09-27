"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Book } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { IconBookOpen, IconChevronLeft, IconChevronRight, IconLock, IconX } from "@/components/ui/icons";

export function PdfReader({ book, ownerName, preview }: { book: Book; ownerName: string; preview?: boolean }) {
  const total = book.pages;
  const previewPages = Math.min(book.samplePages, total);
  const allowed = preview ? previewPages : total;

  const [page, setPage] = useState(1);
  const [spread, setSpread] = useState(false);
  const [notify, setNotify] = useState<string | null>(null);

  const content = useMemo(() => buildPages(book, total), [book, total]);

  // Deterrents
  useEffect(() => {
    const block = (e: MouseEvent | Event) => {
      if ((e as MouseEvent).button === 2 || e.type === "contextmenu") {
        e.preventDefault();
        setNotify("Screenshots & copying are disabled for copyrighted content.");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setNotify("Printing and source-view are disabled.");
      }
      if (e.key === "ArrowRight") setPage((p) => Math.min(allowed, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("keydown", onKey);
    };
  }, [allowed]);

  useEffect(() => {
    if (!notify) return;
    const t = setTimeout(() => setNotify(null), 2600);
    return () => clearTimeout(t);
  }, [notify]);

  const spreadPages = spread ? Math.max(1, Math.min(allowed, page)) : page;

  return (
    <div className="min-h-screen bg-[#e9e2d4] dark:bg-[#101d2b]">
      {/* Toolbar */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-[#122236]/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <IconBookOpen width={20} height={20} className="shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{book.title}</p>
              <p className="text-[11px] text-muted-foreground">{book.edition}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpread((v) => !v)}
              className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted sm:block"
            >
              {spread ? "Single page" : "Two pages"}
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              {spread ? `${spreadPages}–${Math.min(allowed, spreadPages + 1)}` : page} / {allowed}
            </span>
          </div>
        </div>
      </header>

      {/* Watermark notice */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <p className="flex items-center justify-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-center text-[11px] text-accent">
          <IconLock width={12} height={12} /> Watermarked for {ownerName} — please do not share screenshots.
        </p>
      </div>

      {/* Pages */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col items-center gap-5">
          <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-2">
            {spread ? (
              <>
                <PagePaper page={spreadPages} maxPages={allowed} content={content} owner={ownerName} />
                {spreadPages + 1 <= allowed && <PagePaper page={spreadPages + 1} maxPages={allowed} content={content} owner={ownerName} />}
              </>
            ) : (
              <PagePaper page={page} maxPages={allowed} content={content} owner={ownerName} className="sm:mx-auto sm:w-full sm:max-w-xl" />
            )}
          </div>
          {preview && page >= previewPages && (
            <div className="mt-2 flex w-full max-w-3xl flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/50 bg-accent/5 px-6 py-5 text-center">
              <p className="text-sm font-bold text-foreground">This is where the free preview ends</p>
              <p className="text-xs text-muted-foreground">
                Unlock all {total} pages with the online PDF for {formatPrice(book.pdfPrice.amount)}.
              </p>
              <ButtonLinkHref href={`/books/${book.slug}`} variant="accent" size="sm">
                Unlock full book
              </ButtonLinkHref>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <IconChevronLeft width={15} height={15} className="mr-1" /> Prev
          </Button>
          <span className="rounded-lg bg-muted px-4 py-1.5 font-mono text-xs text-muted-foreground">
            {spread ? `${spreadPages} / ${allowed}` : `${page} / ${allowed}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(allowed, p + 1))} disabled={page >= allowed}>
            Next <IconChevronRight width={15} height={15} className="ml-1" />
          </Button>
        </div>
      </main>

      {notify && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-pop">
          <IconX width={16} height={16} className="shrink-0 text-danger" onClick={() => setNotify(null)} />
          <p className="text-sm text-foreground">{notify}</p>
        </div>
      )}
    </div>
  );
}

function PagePaper({
  page,
  maxPages,
  content,
  owner,
  className,
}: {
  page: number;
  maxPages: number;
  content: string[];
  owner: string;
  className?: string;
}) {
  const locked = page > maxPages;
  const text = content[page - 1] ?? "";
  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden rounded-lg border border-black/20 bg-[#fffef7] shadow-lg dark:border-white/10 dark:bg-[#f5f2e8]", className)}>
      {/* Diagonal watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="rotate-[-24deg] whitespace-nowrap font-mono text-[11px] uppercase tracking-widest text-[#d3a24f]/25">
          {owner} · {new Date().getFullYear()}
        </span>
      </div>

      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur dark:bg-[#f5f2e8]/95">
          <IconLock width={26} height={26} className="text-accent" />
          <p className="text-sm font-bold text-foreground">Locked page</p>
          <p className="max-w-[24ch] text-center text-xs text-muted-foreground">Unlock the full book to continue reading.</p>
        </div>
      ) : (
        <article className="absolute inset-0 select-none p-6 sm:p-8">
          <p className="font-display text-sm font-extrabold text-[#1a2b45]">{text.split("\n")[0]}</p>
          <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-[#333b47]">
            {text.split("\n").slice(1).map((line, i) => (
              <p key={i} className={cn("text-justify", line.startsWith("•") && "pl-3")}>{line}</p>
            ))}
          </div>
          <footer className="absolute inset-x-0 bottom-3 text-center font-mono text-[10px] text-[#8a8a8a]">{page}</footer>
        </article>
      )}
    </div>
  );
}

function buildPages(book: Book, total: number): string[] {
  const chapters = book.tableOfContents.map((c) => c.title);
  const sentences = book.description.split(". ").map((s) => s.trim() + ".");
  const filler = [
    "এখানে বিষয়ভিত্তিক আলোচনা, উদাহরণ ও সূত্র ধাপে ধাপে ব্যাখ্যা করা হয়েছে।",
    "প্রতিটি টপিকের শেষে ৫–১০টি মডেল প্রশ্ন যুক্ত হয়েছে যাতে প্রস্তুতি যাচাই করা যায়।",
    "গত দশ বছরের বোর্ড প্রশ্নের ধারা বিশ্লেষণ করে এই অধ্যায়টি সাজানো হয়েছে।",
    "শর্টকাট নিয়মগুলো মনে রাখার জন্য সারণি ও মেমোরি হুক ব্যবহার করা হয়েছে।",
    "পরীক্ষায় টাইম ম্যানেজমেন্টের জন্য প্রতিটি অনুশীলনের সময়সীমা নির্ধারিত।",
    "The English and Bangla glossaries at the end help you decode exam vocabulary fast.",
  ];
  return Array.from({ length: total }).map((_, i) => {
    const chapter = chapters[i % chapters.length] ?? "অধ্যায়";
    const body = [
      `CHAPTER ${i + 1} · ${chapter}`,
      sentences[(i * 3) % sentences.length],
      filler[(i * 5) % filler.length],
      filler[(i * 7 + 2) % filler.length],
      filler[(i * 11 + 1) % filler.length],
    ];
    return body.join("\n");
  });
}

function formatPrice(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function ButtonLinkHref({ href, variant, size, children }: { href: string; variant: "accent" | "outline"; size: "sm"; children: ReactNode }) {
  void size;
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-colors",
        variant === "accent" ? "bg-accent text-accent-foreground hover:bg-accent-hover" : "border border-border hover:bg-muted",
      )}
    >
      {children}
    </a>
  );
}