import { cn } from "@/lib/cn";

type LogoMarkProps = {
  className?: string;
  markOnly?: boolean;
  showTagline?: boolean;
};

export function LogoMark({ className, markOnly = false }: LogoMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" width="40" height="40" role="img" aria-label="Shohoz Skill" className="shrink-0">
        <defs>
          <linearGradient id="ss-navy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#14395f" />
            <stop offset="1" stopColor="#0D2A4E" />
          </linearGradient>
          <linearGradient id="ss-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6C063" />
            <stop offset="1" stopColor="#F2A93B" />
          </linearGradient>
        </defs>

        <circle cx="32" cy="32" r="30" fill="url(#ss-navy)" />
        <circle cx="32" cy="32" r="29" fill="none" stroke="#F2A93B" strokeWidth="1.6" strokeOpacity="0.85" />
        <circle cx="32" cy="32" r="25.5" fill="none" stroke="#7FC4E8" strokeWidth="1" strokeOpacity="0.4" />

        <g>
          <path
            d="M32 16.6l-10.6 5.4L32 27.4l10.6-5.4L32 16.6z"
            fill="#7FC4E8"
          />
          <path
            d="M21.4 24.2v8.6c0 2 4.7 3.7 10.6 3.7s10.6-1.7 10.6-3.7v-8.6L32 29.7l-10.6-5.5z"
            fill="#EAF6FD"
          />
          <path d="M32 27.4v17.1" stroke="#7FC4E8" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        <path
          d="M21 26.8c0 1.5-.4 11.4 11.5 11.4"
          fill="none"
          stroke="#F2A93B"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M21 29.5"
          fill="none"
          stroke="#F2A93B"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        <path
          d="M49.5 19.5l.8 1.9 1.9.8-1.9.9-.8 1.9-.9-1.9-1.9-.9 1.9-.8z"
          fill="#F2A93B"
        />
        <circle cx="15.5" cy="42.5" r="1.6" fill="#7FC4E8" opacity="0.9" />
        <circle cx="50" cy="40" r="1.1" fill="#F2A93B" opacity="0.9" />
      </svg>

      {!markOnly && (
        <div className="leading-none select-none">
          <div className="font-display text-xl font-extrabold tracking-tight text-foreground">
            Shohoz Skill
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
            Learn to Earn
          </div>
        </div>
      )}
    </div>
  );
}