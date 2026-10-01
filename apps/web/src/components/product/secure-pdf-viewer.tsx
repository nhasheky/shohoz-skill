"use client";

import { useEffect, useRef, useState } from "react";
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

// Cache parsed documents by source so the modal can open instantly after preload.
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
 * Renders a PDF to <canvas> with pdf.js — works on iOS Safari and Android where
 * an <iframe>/<embed> PDF either shows only page 1 or asks to download.
 * Right-click, copy, print and "save as" are intercepted, and a watermark logo
 * is overlaid in the centre of every page.
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
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<{ cancel?: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDoc(dataUrl)
      .then((d) => {
        if (!cancelled) {
          setDoc(d);
          setNumPages(d.numPages || 0);
        }
      })
      .catch(() => {
        if (!cancelled) setError("PDF লোড করা যায়নি। আবার চেষ্টা করুন।");
      });
    return () => {
      cancelled = true;
    };
  }, [dataUrl]);

  // Render the current page, fit to the container width, HiDPI aware.
  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await doc.getPage(page);
        const base = p.getViewport({ scale: 1 });
        const wrapW = wrapRef.current?.clientWidth || base.width;
        const dpr = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2);
        const scale = wrapW / base.width;
        const viewport = p.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        try {
          taskRef.current?.cancel?.();
        } catch {
          /* previous render already finished */
        }
        const task = p.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        taskRef.current = task;
        await task.promise;
      } catch {
        /* render cancelled */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page]);

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
    <div className={cn("relative flex h-full flex-col", className)} onContextMenu={(e) => e.preventDefault()}>
      <div ref={wrapRef} className="flex-1 overflow-y-auto rounded-2xl bg-[#e9e2d4] p-2 dark:bg-[#101d2b]">
        <div className="relative mx-auto w-full max-w-3xl select-none">
          <canvas ref={canvasRef} className="mx-auto block h-auto rounded-lg shadow-lg" />
          {doc ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="" className="w-[55%] max-w-[340px] opacity-40" />
              ) : (
                <LogoMark markOnly className="h-36 w-36 opacity-40" />
              )}
            </div>
          ) : (
            <div className="flex h-[60vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-accent" />
                <p className="text-sm text-muted-foreground">লোড হচ্ছে…</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <IconChevronLeft width={15} height={15} /> আগের
        </button>
        <span className="rounded-lg bg-muted px-4 py-1.5 font-mono text-xs text-muted-foreground">
          {page} / {numPages || "…"}
        </span>
        <button
          type="button"
          disabled={numPages === 0 || page >= numPages}
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
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
