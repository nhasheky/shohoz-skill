import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const gradients: [string, string][] = [
  ["#0D2A4E", "#2E5E8C"],
  ["#14395F", "#7FC4E8"],
  ["#F2A93B", "#D97B29"],
  ["#7FC4E8", "#4AA3D8"],
  ["#0D2A4E", "#F2A93B"],
  ["#2E5E8C", "#4AA3D8"],
  ["#14395F", "#F6C063"],
  ["#4AA3D8", "#0D2A4E"],
  ["#D97B29", "#F2A93B"],
  ["#2E5E8C", "#7FC4E8"],
];

export function hashGradient(key: string): [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return gradients[h % gradients.length];
}

export function ProductCover({
  title,
  category = "Course",
  kind = "course",
  accentText,
  className,
  compact = false,
}: {
  title: string;
  category?: string;
  kind?: "course" | "book" | "exam" | "blog" | "package";
  accentText?: string;
  className?: string;
  compact?: boolean;
}) {
  const [from, to] = hashGradient(kind + category + title);
  const shape =
    kind === "book" ? "book" : kind === "exam" ? "target" : kind === "package" ? "package" : "cap";
  const titleLines = compact
    ? title.split(" ").slice(0, 4)
    : title.split(" ").slice(0, 6);
  const text = compact ? titleLines.join(" ") + (title.split(" ").length > 4 ? "…" : "") : titleLines.join(" ");
  const sub = category;

  return (
    <div
      className={cn("relative overflow-hidden aspect-video w-full", className)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <CoverPattern />
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
            {sub}
          </span>
          {accentText && (
            <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              {accentText}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-3">
          <h3 className="font-display text-sm font-bold leading-snug text-white sm:text-base line-clamp-3">
            {text}
          </h3>
          <CoverShape kind={shape} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

function CoverPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id="cover-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.2" fill="white" opacity="0.14" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cover-dots)" />
      <circle cx="92%" cy="12%" r="70" fill="white" opacity="0.08" />
      <circle cx="6%" cy="90%" r="54" fill="white" opacity="0.08" />
    </svg>
  );
}

function CoverShape({ kind }: { kind: "cap" | "book" | "target" | "package" }) {
  const common = { width: 38, height: 38, className: "text-white/80 shrink-0" as const };
  if (kind === "book")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...common}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" fill="rgba(255,255,255,.18)" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M8 7h8M8 11h8" />
      </svg>
    );
  if (kind === "package")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...common}>
        <path d="m12 3 9 5-9 5-9-5 9-5z" fill="rgba(255,255,255,.18)" />
        <path d="M4 13l8 4.5 8-4.5M4 17l8 4.5 8-4.5" />
      </svg>
    );
  if (kind === "target")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...common}>
        <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.18)" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...common}>
      <path d="m2 9 10-5 10 5-10 5L2 9z" fill="rgba(255,255,255,.18)" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </svg>
  );
}

export type CoverKind = "course" | "book" | "exam" | "blog" | "package";

export function CoverLoader({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("aspect-video w-full overflow-hidden rounded-t-xl", className)}>{children}</div>
  );
}