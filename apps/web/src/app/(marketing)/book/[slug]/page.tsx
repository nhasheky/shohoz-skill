import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook, getBooks, getMyEnrollments, getSiteSettings, getProductReviews, getSuggestions, hasSession } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { Stars } from "@/components/ui/rating";
import { BookPreview } from "@/components/product/book-preview";
import { BookAutoDemo } from "@/components/product/book-auto-demo";
import { BookOrderForm } from "@/components/product/book-order-form";
import { BackgroundOrbs } from "@/components/layout/background";
import { ReviewSection } from "@/components/product/review-section";
import { SuggestedSection } from "@/components/product/suggested-section";
import type { PurchasePlan } from "@/components/product/purchase-panel";
import {
  IconChevronRight,
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

function VideoEmbed({ url }: { url: string }) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const isFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  if (isFile) {
    return <video src={url} controls className="aspect-video w-full rounded-2xl border border-border bg-black" />;
  }
  const embed = yt ? `https://www.youtube.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : url;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black">
      <iframe
        src={embed}
        title="Book video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

export default async function BookDetailPage(props: PageProps<"/book/[slug]">) {
  const params = await props.params;
  const book = await getBook(params.slug);
  if (!book) notFound();

  const methodsFor = (base: string[]) =>
    book.allowedPaymentMethods?.length ? base.filter((m) => book.allowedPaymentMethods!.includes(m)) : base;

  const hardcopyNote =
    "বই হাতে পেয়ে টাকা দিন। অগ্রিম এক টাকা লাগবে না। আমরা আপনাদের বিশ্বাস করেই বই পাঠাই।";
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
      label: "Hardcopy",
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
    `ক্রয়ের আগে ${bn(book.samplePages)} পৃষ্ঠা বিনামূল্যে পড়ে দেখতে পারেন।`,
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

  let enrolled = false;
  try {
    if (await hasSession()) {
      const list = await getMyEnrollments();
      enrolled = list.some((e) => e.type === "book" && (e.productId === book.id || e.slug === book.slug));
    }
  } catch {
    enrolled = false;
  }

  const headline = book.headline || book.title;
  const subheading = book.subheading || book.titleBn || book.subtitle;

  return (
    <main>
      {/* Hero — buyer sees the big admin-authored headline first. */}
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

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
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

              <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl">
                {headline}
              </h1>
              {subheading && <p className="mt-3 font-display text-lg font-semibold text-muted-foreground sm:text-xl">{subheading}</p>}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Stars rating={book.rating} size={14} />
                  <span className="font-bold text-foreground">{book.rating.toFixed(1)}</span>
                  <span>({formatCount(book.reviewCount)} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IconUsers width={15} height={15} className="text-sky" /> {bn(book.students)} জন অর্ডার করেছেন
                </span>
                <span className="flex items-center gap-1.5">
                  <IconFileText width={15} height={15} className="text-sky" /> {book.pages} pages
                </span>
                <span className="flex items-center gap-1.5">
                  <IconGlobe width={15} height={15} className="text-sky" /> {book.edition}
                </span>
              </div>

              {book.shortDescription && (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{book.shortDescription}</p>
              )}

              {plans.length > 0 && (
                <a
                  href="#order"
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 font-display text-base font-extrabold text-accent-foreground shadow-glow transition-colors hover:bg-accent-hover"
                >
                  এখনই অর্ডার করুন <IconChevronRight width={16} height={16} />
                </a>
              )}
            </div>

            <div className="mx-auto w-full max-w-[280px] lg:max-w-none">
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
          </div>
        </div>
      </section>

      {/* Video + extra image + full description. */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {book.videoUrl && (
          <div className="mb-10">
            <h2 className="mb-4 font-display text-2xl font-extrabold text-foreground">ভিডিও দেখুন</h2>
            <VideoEmbed url={book.videoUrl} />
          </div>
        )}

        {book.landingImageUrl && (
          <div className="mb-10 overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={book.landingImageUrl} alt={book.title} className="w-full object-cover" />
          </div>
        )}

        {book.description && (
          <div className="rich-text text-base text-muted-foreground" dangerouslySetInnerHTML={{ __html: book.description }} />
        )}

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {features.map((f) => (
            <li key={f} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{f}</li>
          ))}
        </ul>
      </section>

      {/* Demo auto-loads — the customer just scrolls and reads. */}
      {hasDemo && (
        <section className="border-y border-border bg-surface/60">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-4 text-center">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">ফ্রি ডেমো</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground">নমুনা পড়ে দেখুন</h2>
              <p className="mt-1 text-sm text-muted-foreground">কিছু পৃষ্ঠা বিনামূল্যে পড়ুন — নিচে স্ক্রল করে পড়া শুরু করুন, কোনো ক্লিক লাগবে না।</p>
            </div>
            <BookAutoDemo bookId={book.id} title={book.title} logoUrl={settings.logoUrl} />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <ReviewSection
          productType="book"
          productId={book.id}
          initialReviews={reviews}
          rating={book.rating}
          count={book.reviewCount}
          scrollSeconds={settings.reviewScrollSeconds}
        />
      </div>

      {/* CartFlows-style order form at the very bottom. */}
      <section id="order" className="border-t border-border bg-surface/60">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h2 className="font-display text-3xl font-extrabold text-foreground">অর্ডার কনফার্ম করুন</h2>
            <p className="mt-1 text-sm text-muted-foreground">নিচের ফর্মটি পূরণ করে অর্ডার কনফার্ম করুন।</p>
          </div>
          {plans.length ? (
            <BookOrderForm
              title={book.title}
              productId={book.id}
              thumbnailUrl={book.thumbnailUrl}
              allowedPaymentMethods={book.allowedPaymentMethods}
              plans={plans}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-card">
              <p className="font-display text-lg font-extrabold text-foreground">Coming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">This book is not available for purchase yet.</p>
            </div>
          )}
          {enrolled && <p className="mt-4 text-center text-sm font-semibold text-success">✅ আপনি ইতিমধ্যে এটি কিনেছেন — ড্যাশবোর্ড থেকে ব্যবহার করুন।</p>}
        </div>
      </section>

      <SuggestedSection cards={suggestions} eyebrow="Keep exploring" title="আপনার ভালো লাগতে পারে" />
    </main>
  );
}
