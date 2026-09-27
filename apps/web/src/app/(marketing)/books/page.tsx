import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { CatalogExplorer } from "@/components/marketing/catalog-explorer";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getBooks } from "@/lib/api";

export const metadata: Metadata = {
  title: "Books",
  description:
    "BCS, bank and NTRCA books in two formats — read the watermarked PDF instantly online, or get hardcopy shipped anywhere in Bangladesh.",
};

export const revalidate = 60;

export default async function BooksPage(props: PageProps<"/books">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";

  const books = await getBooks();

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="navy" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            eyebrow="Books"
            title="Instant PDF reader or hardcopy at your door"
            description="Every book is available as a watermarked online PDF (read-only, no download) and as a printed hardcopy with nationwide shipping."
            center
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CatalogExplorer
          kind="book"
          items={books}
          placeholder="Search books (e.g. BCS Bangla, English grammar…)"
          searchParam={q}
          initialCategory={category}
        />
      </section>

      <section className="pb-20">
        <CtaBanner
          title="Read 12 pages free before you buy"
          description="Every book has a sample chapter you can flip through in the online reader — no signup needed."
          primaryLabel="Browse Books"
          primaryHref="/books"
          secondaryLabel="Start a Free Exam"
          secondaryHref="/exams?type=free"
        />
      </section>
    </main>
  );
}