import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook, getBooks, getSiteSettings, getProductReviews, getSuggestions } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { Stars } from "@/components/ui/rating";
import { BookPreview } from "@/components/product/book-preview";
import { BackgroundOrbs } from "@/components/layout/background";
import { ButtonLink } from "@/components/ui/button";
import { PurchasePanel, type PurchasePlan } from "@/components/product/purchase-panel";
import { ReviewSection } from "@/components/product/review-section";
import { SuggestedSection } from "@/components/product/suggested-section";
import {
  IconChevronRight,
  IconEye,
  IconFileText,
  IconGlobe,
  IconUsers,
} from "@/components/ui/icons";

export const revalidate = 60;

export async function generateStaticParams() {
  const all = await getBooks();
  return all.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: PageProps<"/book/[slug]">): Promise<Metadata> {
  const params = await props.params;
  const book = await getBook(params.slug);
  if (!book) return { title: "Book not found" };
  return { title: book.seo.title, description: book.seo.description, keywords: book.seo.keywords };
}

export default async function BookDetailPage(props: PageProps<"/book/[slug]">) {
  const params = await props.params;
  const book = await getBook(params.slug);
  if (!book) notFound();

  // Mirror the server's per-variant payment rules: PDF = online only,
  // hardcopy = online + cash on delivery (an admin override can narrow this).
  const methodsFor = (base: string[]) =>
    book.allowedPaymentMethods?.length ? base.filter((m) => book.allowedPaymentMethods!.includes(m)) : base;

  const hardcopyNote =
    "বই হাতে পেয়ে টাকা দিন। অগ্রিম এক টাকা লাগবে না। আমরা আপনাদের বিশ্বাস করেই বই পাঠাই। আশা করি, ফেইক অর্ডার করে আমাদের ঠকাবেন না।";
  const plans: PurchasePlan[] = [];
  if (book.pdfPrice) {
    plans.push({
      id: "pdf",
      label: "PDF Copy",
      price: book.pdfPrice.amount,
      originalPrice: book.pdfPrice.originalAmount,
      allowedPaymentMethods: methodsFor(["SSLCOMMERZ"]),
    });
  }
  if (book.hardcopyPrice) {
    plans.push({
      id: "hardcopy",
      label: "",
      price: book.hardcopyPrice.amount,
      originalPrice: book.hardcopyPrice.originalAmount,
      note: hardcopyNote,
      allowedPaymentMethods: methodsFor(["COD", "SSLCOMMERZ"]),
    });
  }
  const hasDemo = Boolean(book.hasDemo || book.demoPdfUrl);
  const canRead = hasDemo || Boolean(book.pdfPrice);

  const bn = (n: number) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
  const features = [
    `বইটিতে ${bn(book.pages)} টি পৃষ্ঠা রয়েছে।`,
    `ক্রয়ের আগে ${bn(book.samplePages)} পৃষ্ঠা বিনামূল্যে পড়ে দেখতে পারবেন।`,
    book.language === "Bn"
      ? "বাংলা ভার্সনের জন্যে লেখা।"
      : book.language === "En"
        ? "ইংরেজি ভার্সনের জন্যে লেখা।"
        : "বাংলা ও ইংরেজি মিলিয়ে লেখা।",
  ];

  const [reviews, suggestions, settings] = await Promise.all([
    getProductReviews("book", book.id),
    getSuggestions("book", book.suggested, 3),
    getSiteSettings(),
  ]);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent">Home</Link>
            <IconChevronRight width={11} height={11} />
            <Link href="/books" className="hover:text-accent">Books</Link>
            <IconChevronRight width={11} height={11} />
            <span className="max-w-[24ch] truncate text-foreground">{book.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
            <div className="lg:pt-1">
              <BookPreview
                bookId={book.id}
                slug={book.slug}
                title={book.title}
                category={book.category}
                thumbnailUrl={book.thumbnailUrl}
                hasDemo={hasDemo}
                canRead={canRead}
                accentText={`${book.pages} pages`}
                logoUrl={settings.logoUrl}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {book.category}
                </span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {book.language === "Bn" ? "বাংলা" : book.language === "En" ? "English" : "বাংলা + English"}
                </span>
                {book.isNew && <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-accent">New</span>}
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {book.title}
                {book.titleBn && <span className="mt-1 block text-xl text-muted-foreground sm:text-2xl">{book.titleBn}</span>}
              </h1>
              <p className="mt-2 font-display text-sm font-semibold text-accent">{book.subtitle}</p>
              <div className="rich-text mt-3 max-w-2xl text-base text-muted-foreground" dangerouslySetInnerHTML={{ __html: book.description }} />

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Stars rating={book.rating} size={14} />
                  <span className="font-bold text-foreground">{book.rating.toFixed(1)}</span>
                  <span>({formatCount(book.reviewCount)} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUsers width={15} height={15} className="text-sky" /> {bn(book.students)} জন মানুষ এই বইটি অর্ডার করেছেন
                </span>
                <span className="flex items-center gap-1.5">
                  <IconFileText width={15} height={15} className="text-sky" /> {book.pages} pages
                </span>
                <span className="flex items-center gap-1.5">
                  <IconGlobe width={15} height={15} className="text-sky" /> {book.edition}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {canRead && (
                  <ButtonLink href={`/book/${book.slug}/read`} variant="accent">
                    <IconEye width={16} height={16} className="mr-2" /> একটু পড়ে দেখুন
                  </ButtonLink>
                )}
              </div>
            </div>

            <aside className="lg:col-span-2 xl:col-span-1">
              <div className="xl:sticky xl:top-24">
                {plans.length ? (
                  <PurchasePanel kind="Book" title={book.title} productId={book.id} productType="book" allowedPaymentMethods={book.allowedPaymentMethods} plans={plans} features={features} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-border bg-card p-6 text-center shadow-card">
                    <p className="font-display text-lg font-extrabold text-foreground">Coming soon</p>
                    <p className="mt-1 text-sm text-muted-foreground">This book is not available for purchase yet.</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <article className="min-w-0">
          <ReviewSection
            productType="book"
            productId={book.id}
            initialReviews={reviews}
            rating={book.rating}
            count={book.reviewCount}
            scrollSeconds={settings.reviewScrollSeconds}
          />
        </article>
      </div>

      <SuggestedSection cards={suggestions} eyebrow="Keep exploring" title="আপনার ভালো লাগতে পারে" />
    </main>
  );
}