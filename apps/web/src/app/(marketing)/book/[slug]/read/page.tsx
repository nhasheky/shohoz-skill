import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBook, hasSession } from "@/lib/api";
import { PdfReader } from "@/components/product/pdf-reader";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/book/[slug]/read">): Promise<Metadata> {
  const params = await props.params;
  const book = await getBook(params.slug);
  if (!book) return { title: "Book not found" };
  return {
    title: `${book.title} — Read Online (Watermarked) | Shohoz Skill`,
    description: `Read ${book.title} online in the watermarked reader. ${book.samplePages} pages free, then unlock the full book.`,
    robots: { index: false, follow: true },
  };
}

export default async function BookReadPage(props: PageProps<"/book/[slug]/read">) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const book = await getBook(params.slug);
  if (!book) notFound();

  // Preview = no `mode=full` query, OR user owns it (mock: always preview for now)
  const mode = typeof searchParams.mode === "string" ? searchParams.mode : "preview";
  const preview = mode !== "full";

  // Full digital content requires an authenticated session.
  if (!preview && !(await hasSession())) redirect(`/login`);

  const ownerName = "Demo Student (Rafi Ahmed)";

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/books" className="hover:text-accent">Books</Link>
            <span>/</span>
            <Link href={`/book/${book.slug}`} className="max-w-[20ch] truncate hover:text-accent">{book.title}</Link>
            <span>/</span>
            <span className="text-foreground">{preview ? "Free preview" : "Reader"}</span>
          </nav>
          {preview && (
            <a href={`/book/${book.slug}`} className="rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-hover">
              Unlock full book
            </a>
          )}
        </div>
      </div>
      <PdfReader book={book} ownerName={ownerName} preview={preview} />
    </div>
  );
}