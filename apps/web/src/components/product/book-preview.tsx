"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductCover } from "@/components/ui/product-cover";
import { SecurePdfViewer, preloadPdf } from "./secure-pdf-viewer";
import { IconEye, IconX } from "@/components/ui/icons";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/+$/, "");

/**
 * Book cover on the detail page.
 * - Renders the cover in book (portrait) ratio with a Bangla "একটু পড়ে দেখুন" call-to-action.
 * - Pre-loads the sample PDF so clicking opens it instantly in a modal (no navigation / spinner).
 */
export function BookPreview({
  bookId,
  slug,
  title,
  category,
  thumbnailUrl,
  hasDemo,
  canRead,
  accentText,
  logoUrl,
}: {
  bookId: string;
  slug: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  hasDemo: boolean;
  canRead: boolean;
  accentText?: string;
  logoUrl?: string | null;
}) {
  const router = useRouter();
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Warm the sample PDF as soon as the page loads for an instant open.
  useEffect(() => {
    if (!hasDemo) return;
    let cancelled = false;
    fetch(`${API_URL}/api/books/${encodeURIComponent(bookId)}/demo`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pdfUrl?: string } | null) => {
        if (!cancelled && d && typeof d.pdfUrl === "string") {
          setDemoUrl(d.pdfUrl);
          preloadPdf(d.pdfUrl); // parse ahead so the modal opens instantly
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bookId, hasDemo]);

  async function openPreview() {
    if (!canRead) return;
    if (!hasDemo) {
      router.push(`/book/${slug}/read`);
      return;
    }
    if (demoUrl) {
      setOpen(true);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${API_URL}/api/books/${encodeURIComponent(bookId)}/demo`, { cache: "no-store" });
      const d = r.ok ? ((await r.json()) as { pdfUrl?: string }) : null;
      if (d && typeof d.pdfUrl === "string") {
        setDemoUrl(d.pdfUrl);
        setOpen(true);
      } else {
        router.push(`/book/${slug}/read`);
      }
    } catch {
      router.push(`/book/${slug}/read`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <button
        type="button"
        onClick={openPreview}
        disabled={!canRead}
        aria-label={canRead ? "একটু পড়ে দেখুন" : title}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-pop disabled:cursor-default"
      >
        <ProductCover title={title} category={category} kind="book" ratio="portrait" thumbnailUrl={thumbnailUrl} accentText={accentText} />
        {canRead && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-lg transition-transform group-hover:scale-[1.03]">
              <IconEye width={15} height={15} /> {busy ? "খুলছে…" : "একটু পড়ে দেখুন"}
            </span>
          </div>
        )}
      </button>

      {canRead && (
        <>
          <div className="pointer-events-none absolute -right-3 top-20 hidden text-accent sm:block" aria-hidden>
            <svg width="44" height="44" viewBox="0 0 46 46" fill="none" className="animate-bounce">
              <path d="M40 6C27 4 13 11 10 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 5" />
              <path d="M5 21l6 9 7-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-3 text-center text-xs font-bold text-accent">কভারে ক্লিক করে নমুনা পড়ুন</p>
        </>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-black/80 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 text-white">
            <p className="min-w-0 truncate text-sm font-bold">{title} — নমুনা</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="বন্ধ করুন"
            >
              <IconX width={18} height={18} />
            </button>
          </div>
          <div className="mx-auto w-full max-w-5xl flex-1 px-2 pb-2 sm:px-0">
            {demoUrl ? (
              <SecurePdfViewer dataUrl={demoUrl} title={`${title} (demo)`} logoUrl={logoUrl} />
            ) : (
              <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-white/95 text-sm text-muted-foreground">লোড হচ্ছে…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
