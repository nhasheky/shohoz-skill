import { Stars } from "@/components/ui/rating";
import { IconUser } from "@/components/ui/icons";
import type { TestimonialReview } from "@/lib/types";

export function ReviewSection({
  id,
  title = "What our students say",
  rating,
  count,
  reviews,
}: {
  id: string;
  title?: string;
  rating: number;
  count: number;
  reviews: TestimonialReview[];
}) {
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const weight = Math.max(0.02, 0.55 - (5 - star) * 0.16 + ((rating - 4.4) * 0.05));
    return { star, pct: Math.min(1, weight) };
  });

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]" id={`${id}-reviews`}>
      <div>
        <h3 className="font-display text-lg font-extrabold text-foreground">{title}</h3>
        <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <div className="font-display text-5xl font-extrabold text-foreground">{rating.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <Stars rating={rating} size={18} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Based on {count.toLocaleString("en-BD")} reviews</p>
          <div className="mt-5 space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-xs">
                <span className="w-6 shrink-0 text-muted-foreground">{b.star} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(b.pct * 100)}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-muted-foreground">{Math.round(count * b.pct).toLocaleString("en-BD")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No written reviews yet — be the first to share your experience.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-3xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} size={13} />
                  <span className="font-display text-2xl leading-none text-accent/60">&ldquo;</span>
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">“{r.text}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-surface">
                    <IconUser width={16} height={16} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}