import { cn } from "@/lib/cn";
import { IconStar, IconStarHalf } from "@/components/ui/icons";

export function Stars({ rating, className, size = 15 }: { rating: number; className?: string; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.35;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-accent", className)} aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <IconStar key={i} width={size} height={size} />;
        if (i === full && half) return <IconStarHalf key={i} width={size} height={size} />;
        return <IconStar key={i} width={size} height={size} className="text-border" />;
      })}
    </span>
  );
}

export function RatingLabel({ rating, count, className }: { rating: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
      <Stars rating={rating} />
      {typeof count === "number" && <span className="text-muted-foreground">({count.toLocaleString()})</span>}
    </span>
  );
}