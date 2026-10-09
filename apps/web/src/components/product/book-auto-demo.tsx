"use client";

import { useEffect, useState } from "react";
import { SecurePdfViewer, preloadPdf } from "./secure-pdf-viewer";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.shohozskill.com.bd").replace(/\/+$/, "");

/**
 * Auto-loads the free sample PDF and renders it inline — no click required.
 * The customer simply scrolls down and starts reading the demo.
 */
export function BookAutoDemo({ bookId, title, logoUrl }: { bookId: string; title: string; logoUrl?: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/books/${encodeURIComponent(bookId)}/demo`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { pdfUrl?: string } | null) => {
        if (cancelled) return;
        if (d && typeof d.pdfUrl === "string") {
          setUrl(d.pdfUrl);
          preloadPdf(d.pdfUrl);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  if (failed) return null;

  return (
    <div className="h-[75vh] min-h-[520px]">
      {url ? (
        <SecurePdfViewer dataUrl={url} title={`${title} (demo)`} logoUrl={logoUrl} />
      ) : (
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm text-muted-foreground">ডেমো লোড হচ্ছে…</p>
        </div>
      )}
    </div>
  );
}
