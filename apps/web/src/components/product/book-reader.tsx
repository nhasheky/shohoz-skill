"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { PdfReader } from "./pdf-reader";
import { SecurePdfViewer, preloadPdf } from "./secure-pdf-viewer";
import { IconLock } from "@/components/ui/icons";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/+$/, "");

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shohoz_token");
}

type State = "loading" | "ready" | "demo-fallback" | "locked" | "empty";

/**
 * Read page body.
 * - preview: opens the public demo PDF (falls back to the stylized preview).
 * - full:    fetches the owner-only PDF from the API and renders it locked down.
 */
export function BookReader({ book, ownerName, preview, logoUrl }: { book: Book; ownerName: string; preview: boolean; logoUrl?: string | null }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      const endpoint = preview
        ? `${API_URL}/api/books/${encodeURIComponent(book.id)}/demo`
        : `${API_URL}/api/books/${encodeURIComponent(book.id)}/content`;
      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (!preview) headers.Authorization = `Bearer ${readToken() ?? ""}`;
        const res = await fetch(endpoint, { headers, cache: "no-store" });
        if (!res.ok) {
          if (cancelled) return;
          if (preview) setState("demo-fallback");
          else if (res.status === 401 || res.status === 403) setState("locked");
          else setState("empty");
          return;
        }
        const data = (await res.json()) as { pdfUrl?: string };
        if (cancelled) return;
        if (typeof data.pdfUrl === "string" && data.pdfUrl.length) {
          setPdfUrl(data.pdfUrl);
          preloadPdf(data.pdfUrl);
          setState("ready");
        } else {
          setState(preview ? "demo-fallback" : "empty");
        }
      } catch {
        if (!cancelled) setState(preview ? "demo-fallback" : "empty");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [book.id, preview]);

  if (state === "ready" && pdfUrl) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <SecurePdfViewer dataUrl={pdfUrl} title={book.title} logoUrl={logoUrl} />
        {preview && (
          <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/50 bg-accent/5 px-6 py-5 text-center">
            <p className="text-sm font-bold text-foreground">This is a free sample</p>
            <p className="text-xs text-muted-foreground">Unlock the full book to keep reading every page.</p>
            <Link href={`/book/${book.slug}`} className="mt-1 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
              Unlock full book
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-accent" />
        <p className="text-sm text-muted-foreground">Opening your book…</p>
      </div>
    );
  }

  if (state === "locked") {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <IconLock width={26} height={26} />
        </span>
        <p className="font-display text-xl font-extrabold text-foreground">You don&apos;t own this book yet</p>
        <p className="text-sm text-muted-foreground">Buy the online PDF to read the full book in your dashboard.</p>
        <Link href={`/book/${book.slug}`} className="mt-2 inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover">
          Buy online PDF
        </Link>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="font-display text-lg font-extrabold text-foreground">No online PDF available</p>
        <p className="mt-1 text-sm text-muted-foreground">This book doesn&apos;t have a readable PDF copy.</p>
      </div>
    );
  }

  // demo-fallback — no demo file uploaded, use the stylized preview.
  return <PdfReader book={book} ownerName={ownerName} preview />;
}
