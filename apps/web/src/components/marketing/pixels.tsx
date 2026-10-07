"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { MarketingPixel } from "@/lib/types";
import { buildBodySnippet, buildHeadSnippet, parseSnippetHtml, type ParsedPart } from "@/lib/pixel-snippets";

/**
 * Injects the admin-managed marketing pixels into every storefront page.
 * Base snippets (and the first PageView) run once; subsequent client-side
 * navigations re-fire PageView so SPAs stay tracked.
 */
export function MarketingPixels({ pixels }: { pixels: MarketingPixel[] }) {
  const pathname = usePathname();
  const first = useRef(true);

  const parts = useMemo(() => {
    const out: { key: string; part: ParsedPart }[] = [];
    for (const p of pixels ?? []) {
      if (p.enabled === false) continue;
      parseSnippetHtml(buildHeadSnippet(p)).forEach((part, i) => out.push({ key: `${p.id}-h${i}`, part }));
      parseSnippetHtml(buildBodySnippet(p)).forEach((part, i) => out.push({ key: `${p.id}-b${i}`, part }));
    }
    return out;
  }, [pixels]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    const w = window as Window & {
      fbq?: (...a: unknown[]) => void;
      ttq?: { page?: () => void };
      dataLayer?: Record<string, unknown>[];
    };
    try {
      if (typeof w.fbq === "function") w.fbq("track", "PageView");
      if (w.ttq && typeof w.ttq.page === "function") w.ttq.page();
      if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: "page_view", page_path: pathname });
    } catch {
      /* ignore */
    }
  }, [pathname]);

  if (!parts.length) return null;

  return (
    <>
      {parts.map(({ key, part }) =>
        part.kind === "code" ? (
          <Script key={key} id={`ss-px-${key}`} strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: part.value }} />
        ) : part.kind === "src" ? (
          <Script key={key} id={`ss-px-${key}`} src={part.value} strategy="afterInteractive" />
        ) : (
          <div key={key} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: part.value }} />
        ),
      )}
    </>
  );
}
