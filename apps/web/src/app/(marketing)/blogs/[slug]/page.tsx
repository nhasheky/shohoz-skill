import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlog, getBlogs, getRelatedBlogs } from "@/lib/api";
import type { BlogBlock } from "@/lib/types";
import { formatDate, formatReadTime } from "@/lib/format";
import { ProductCover } from "@/components/ui/product-cover";
import { BackgroundOrbs } from "@/components/layout/background";
import { BlogCard } from "@/components/ui/product-card";
import { SectionHeader } from "@/components/marketing/section-header";
import { IconCalendar, IconChevronRight, IconClock } from "@/components/ui/icons";
import { CtaBanner } from "@/components/marketing/cta-banner";

export const revalidate = 60;

export async function generateStaticParams() {
  const all = await getBlogs();
  return all.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata(props: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const params = await props.params;
  const post = await getBlog(params.slug);
  if (!post) return { title: "Blog not found" };
  return { title: post.seo.title, description: post.seo.description, keywords: post.tags };
}

export default async function BlogDetailPage(props: PageProps<"/blogs/[slug]">) {
  const params = await props.params;
  const post = await getBlog(params.slug);
  if (!post) notFound();

  const related = await getRelatedBlogs(post, 3);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs variant="navy" />
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-accent">Home</Link>
            <IconChevronRight width={11} height={11} />
            <Link href="/blogs" className="hover:text-accent">Blogs</Link>
            <IconChevronRight width={11} height={11} />
            <span className="max-w-[30ch] truncate text-foreground">{post.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/blogs?tag=${encodeURIComponent(post.category)}`}
              className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-bold text-accent"
            >
              {post.category}
              {post.categoryBn && <span> · {post.categoryBn}</span>}
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconCalendar width={13} height={13} /> {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconClock width={13} height={13} /> {formatReadTime(post.readMinutes)}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>

          <div className="mt-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky font-display font-extrabold text-white dark:from-primary dark:to-sky-deep">
              {post.author.name.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">
                {post.author.name}
                {post.author.nameBn && <span className="text-muted-foreground"> · {post.author.nameBn}</span>}
              </p>
              <p className="text-xs text-muted-foreground">{post.author.title}</p>
            </div>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border shadow-card">
          <ProductCover title={post.title} category={post.category} kind="blog" compact />
        </div>

        <div className="mt-10 space-y-6">
          {post.content.map((block, i) => (
            <BlogBlockView key={i} block={block} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/blogs?tag=${encodeURIComponent(t)}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              #{t}
            </Link>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-card/40 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader eyebrow="Keep learning" title="Related articles" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((b) => (
                <BlogCard key={b.id} post={b} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-20">
        <CtaBanner
          title="Stop reading, start practising"
          description="Turn these strategies into scores with a free mock exam — no signup needed to preview."
          primaryLabel="Try a Free Exam"
          primaryHref="/exams?type=free"
          secondaryLabel="Browse Courses"
          secondaryHref="/courses"
        />
      </section>
    </main>
  );
}

function BlogBlockView({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="pt-2 font-display text-2xl font-extrabold text-foreground">{block.text}</h2>;
    case "paragraph":
      return <p className="leading-relaxed text-muted-foreground">{block.text}</p>;
    case "list":
      return block.ordered ? (
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground marker:font-bold marker:text-accent">
          {block.items.map((it, i) => (
            <li key={i} className="leading-relaxed">{it}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground marker:text-accent">
          {block.items.map((it, i) => (
            <li key={i} className="leading-relaxed">{it}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="rounded-2xl border-l-4 border-accent bg-accent/5 px-5 py-4">
          <p className="font-display text-lg font-bold leading-relaxed text-foreground">“{block.text}”</p>
          {block.cite && <footer className="mt-2 text-sm text-accent">— {block.cite}</footer>}
        </blockquote>
      );
    case "image":
      return (
        <figure>
          <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-primary/15 to-sky/15" />
          {block.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{block.caption}</figcaption>}
        </figure>
      );
    case "video":
      return (
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${block.youtubeId}?rel=0`}
            title={block.title ?? "Video"}
            loading="lazy"
            allowFullScreen
          />
        </div>
      );
    case "gallery":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.images.map((img, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-sky/15 to-accent/15" />
          ))}
        </div>
      );
    default:
      return null;
  }
}