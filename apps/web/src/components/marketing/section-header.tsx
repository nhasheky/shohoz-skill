import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconArrowRight } from "@/components/ui/icons";

export function SectionHeader({
  eyebrow,
  title,
  description,
  center = true,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 sm:mb-10", center ? "text-center" : "text-left", className)}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-[34px] text-balance">
        {title}
      </h2>
      {description && (
        <p className={cn("mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground", center && "mx-auto")}>
          {description}
        </p>
      )}
      {viewAllHref && (
        <div className={cn("mt-5", center && "flex justify-center")}>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {viewAllLabel} <IconArrowRight width={15} height={15} />
          </Link>
        </div>
      )}
    </div>
  );
}