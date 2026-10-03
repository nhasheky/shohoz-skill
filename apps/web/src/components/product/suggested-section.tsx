import { SectionHeader } from "@/components/marketing/section-header";
import { CourseCard, BookCard, ExamCard } from "@/components/ui/product-card";
import type { SuggestionCard } from "@/lib/api";

/** Cross-type "you may also like" rail shown under product pages. */
export function SuggestedSection({
  cards,
  eyebrow = "You may also like",
  title = "আপনার ভালো লাগতে পারে",
}: {
  cards: SuggestionCard[];
  eyebrow?: string;
  title?: string;
}) {
  if (!cards.length) return null;
  return (
    <section className="border-t border-border bg-card/40 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) =>
            c.type === "course" ? (
              <CourseCard key={`c-${c.course.id}`} course={c.course} />
            ) : c.type === "book" ? (
              <BookCard key={`b-${c.book.id}`} book={c.book} />
            ) : (
              <ExamCard key={`e-${c.exam.id}`} exam={c.exam} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
