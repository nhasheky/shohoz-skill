"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { IconLock, IconX } from "@/components/ui/icons";
import { LogoMark } from "@/components/brand/logo-mark";

/**
 * Renders a PDF (data URL or link) inside a locked-down viewer:
 * - the browser toolbar / download button is hidden (`#toolbar=0`)
 * - right-click, copy, print and "save as" shortcuts are intercepted
 * - an owner watermark is overlaid on every page
 *
 * This is a deterrent layer, not DRM — it keeps honest users honest.
 */
export function SecurePdfViewer({
  dataUrl,
  title,
  owner,
  watermarkLogo = false,
  className,
}: {
  dataUrl: string;
  title: string;
  owner?: string;
  watermarkLogo?: boolean;
  className?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let revoked = false;

    (async () => {
      setError("");
      setBlobUrl(null);
      try {
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error("fetch failed");
        const raw = await res.blob();
        const blob =
          raw.type === "application/pdf"
            ? raw
            : new Blob([await raw.arrayBuffer()], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        if (!revoked) setBlobUrl(objectUrl);
      } catch {
        if (!revoked) setError("Could not load this PDF. Please try again.");
      }
    })();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [dataUrl]);

  useEffect(() => {
    const blockContext = (e: Event) => {
      e.preventDefault();
      setNotify("Downloading, copying & printing are disabled for this book.");
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        setNotify("Downloading, copying & printing are disabled.");
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
    const t = setTimeout(() => setNotify(null), 2800);
    return () => clearTimeout(t);
  }, [notify]);

  return (
    <div className={cn("relative", className)} onContextMenu={(e) => e.preventDefault()}>
      {blobUrl ? (
        <iframe
          src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`}
          title={`${title} — secure reader`}
          className="h-[80vh] w-full select-none rounded-2xl border border-border bg-white shadow-card"
        />
      ) : error ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center">
          <IconLock width={26} height={26} className="text-danger" />
          <p className="text-sm font-bold text-foreground">{error}</p>
        </div>
      ) : (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-border">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-border border-t-accent" />
          <p className="text-sm text-muted-foreground">Loading secure reader…</p>
        </div>
      )}

      {owner && blobUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
          <span className="rotate-[-24deg] whitespace-nowrap font-mono text-[13px] uppercase tracking-widest text-[#0d2a4e]/10">
            {owner} · Shohoz Skill
          </span>
        </div>
      )}

      {watermarkLogo && blobUrl && (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 place-items-center gap-y-4 overflow-hidden rounded-2xl opacity-[0.08]">
          {Array.from({ length: 9 }).map((_, i) => (
            <LogoMark key={i} markOnly className="h-16 w-16 sm:h-20 sm:w-20" />
          ))}
        </div>
      )}

      {notify && (
        <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-pop">
          <IconX width={16} height={16} className="shrink-0 cursor-pointer text-danger" onClick={() => setNotify(null)} />
          <p className="text-sm text-foreground">{notify}</p>
        </div>
      )}
    </div>
  );
}
