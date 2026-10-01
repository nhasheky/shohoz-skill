"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight, IconLock, IconX } from "@/components/ui/icons";
import { LogoMark } from "@/components/brand/logo-mark";

type PdfPage = {
  getViewport: (p: { scale: number }) => { width: number; height: number };
  render: (p: Record<string, unknown>) => { promise: Promise<void>; cancel?: () => void };
};
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> };

// pdf.js is browser-only and heavy; load it lazily and share one worker.
let pdfjsPromise: Promise<any> | null = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      (mod as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

// Cache parsed documents by source so the modal opens instantly after preload.
const docCache = new Map<string, Promise<PdfDoc>>();
function loadDoc(src: string): Promise<PdfDoc> {
  let cached = docCache.get(src);
  if (!cached) {
    cached = (async () => {
      const pdfjs = (await getPdfjs()) as unknown as {
        getDocument: (o: { data: ArrayBuffer }) => { promise: Promise<PdfDoc> };
      };
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      return pdfjs.getDocument({ data: buf }).promise;
    })();
    docCache.set(src, cached);
  }
  return cached;
}

/** Warm the PDF (fetch + parse) so the viewer renders on the first click. */
export function preloadPdf(src: string) {
  void loadDoc(src).catch(() => {});
}

/**
 * Scrollable, page-snapping PDF reader built on pdf.js <canvas>.
 * Works on iOS Safari / Android (where an <iframe> PDF shows one page or asks
 * to download). Pages render lazily as they scroll into view; a watermark logo
 * sits in the centre of every page and downloads/printing are disabled.
 */
export function SecurePdfViewer({
  dataUrl,
  title,
  logoUrl,
  className,
}: {
  dataUrl: string;
  title: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(1);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    loadDoc(dataUrl)
      .then((d) => {
        if (!cancelled) {
          renderedRef.current = new Set();
          setDoc(d);
          setNumPages(d.numPages || 0);
          setCurrent(1);
        }
      })
      .catch(() => {
        if (!cancelled) setError("PDF লোড করা যায়নি। আবার চেষ্টা করুন।");
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  const renderPage = useCallback(
    async (n: number) => {
      if (!doc || renderedRef.current.has(n)) return;
      renderedRef.current.add(n);
      const canvas = canvasRefs.current[n - 1];
      const holder = pageRefs.current[n - 1];
      if (!canvas) {
        renderedRef.current.delete(n);
        return;
      }
      try {
        const p = await doc.getPage(n);
        const base = p.getViewport({ scale: 1 });
        const wrapW = holder?.clientWidth || base.width;
        const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2);
        const scale = wrapW / base.width;
        const viewport = p.getViewport({ scale });
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        await p.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        }).promise;
        // Page heights changed → refresh the current-page indicator.
        scrollRef.current?.dispatchEvent(new Event("scroll"));
      } catch {
        renderedRef.current.delete(n);
      }
    },
    [doc],
  );

  // Render pages as they approach the viewport.
  useEffect(() => {
    if (!doc) return;
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.page);
            if (idx) void renderPage(idx);
          }
        }
      },
      { root, rootMargin: "700px 0px", threshold: 0.01 },
    );
    for (const el of pageRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [doc, numPages, renderPage]);

  // Track which page is centred for the indicator.
  useEffect(() => {
    if (!doc) return;
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      // The current page is the last one whose top has scrolled past the
      // container's top edge — this reads naturally while scrolling down.
      const edge = root.getBoundingClientRect().top + 12;
      let best = 1;
      pageRefs.current.forEach((el, i) => {
        if (!el) return;
        if (el.getBoundingClientRect().top <= edge) best = i + 1;
      });
      setCurrent(best);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => root.removeEventListener("scroll", onScroll);
  }, [doc, numPages]);

  const goTo = useCallback((n: number) => {
    const root = scrollRef.current;
    const el = pageRefs.current[n - 1];
    if (!root || !el) return;
    const rootRect = root.getBoundingClientRect();
    const top = el.getBoundingClientRect().top - rootRect.top + root.scrollTop;
    root.scrollTo({ top: top - 8, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const blockContext = (e: Event) => {
      e.preventDefault();
      setNotify("ডাউনলোড, কপি ও প্রিন্ট বন্ধ আছে।");
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setNotify("ডাউনলোড, কপি ও প্রিন্ট বন্ধ আছে।");
      }
    };
    document.addEventListener("contextmenu", blockContext);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!notify) return;
    const t = setTimeout(() => setNotify(null), 2600);
    return () => clearTimeout(t);
  }, [notify]);

  if (error) {
    return (
      <div className={cn("flex h-[60vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center", className)}>
        <IconLock width={26} height={26} className="text-danger" />
        <p className="text-sm font-bold text-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)} onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 snap-y snap-proximity scroll-smooth overflow-y-auto rounded-2xl bg-[#e9e2d4] p-2 dark:bg-[#101d2b]"
      >
        {doc ? (
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {Array.from({ length: numPages }).map((_, i) => {
              const n = i + 1;
              return (
                <div
                  key={n}
                  data-page={n}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                  }}
                  className="relative min-h-[70vh] snap-start select-none"
                >
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[i] = el;
                    }}
                    className="mx-auto block h-auto rounded-lg bg-white shadow-lg"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={logoUrl} alt="" className="w-[55%] max-w-[340px] opacity-40" />
                    ) : (
                      <LogoMark markOnly className="h-36 w-36 opacity-40" />
                    )}
                  </div>
                  <span className="absolute bottom-2 right-3 rounded bg-black/30 px-1.5 text-[10px] font-semibold text-white">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-accent" />
            <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => goTo(Math.max(1, current - 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <IconChevronLeft width={15} height={15} /> আগের
        </button>
        <span className="rounded-lg bg-muted px-4 py-1.5 font-mono text-xs text-muted-foreground">
          {current} / {numPages || "…"}
        </span>
        <button
          type="button"
          disabled={numPages === 0 || current >= numPages}
          onClick={() => goTo(Math.min(numPages, current + 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          পরের <IconChevronRight width={15} height={15} />
        </button>
      </div>

      {notify && (
        <div className="fixed bottom-6 left-1/2 z-[130] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-pop">
          <IconX width={16} height={16} className="shrink-0 cursor-pointer text-danger" onClick={() => setNotify(null)} />
          <p className="text-sm text-foreground">{notify}</p>
        </div>
      )}
    </div>
  );
}
