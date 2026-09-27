import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { BlogCard } from "@/components/ui/product-card";
import { getBlogs } from "@/lib/api";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Study plans, exam analysis, negative-marking strategy and viva guides — written by the people who cleared these exams.",
};

export const revalidate = 60;

export default async function BlogsPage(props: PageProps<"/blogs">) {
  const searchParams = await props.searchParams;
  const tag = typeof searchParams.tag === "string" ? searchParams.tag : "";

  const blogs = await getBlogs();

  const filtered = tag ? blogs.filter((b) => b.tags.some((t) => t === tag) || b.category === tag) : blogs;
  const allTags = [...new Set(blogs.flatMap((b) => b.tags))];
  const categories = [...new Set(blogs.map((b) => b.category))];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeader
            eyebrow="Blog & Strategy Center"
            title="Learn how toppers study, then steal their methods"
            description="Free strategy articles on every major government exam of Bangladesh."
            center
          />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {categories.map((c) => (
              <a
                key={c}
                href={`/blogs?tag=${encodeURIComponent(c)}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tag === c ? "bg-accent text-accent-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </a>
            ))}
            {!tag && <span className="text-xs text-muted-foreground">· all {blogs.length} posts</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BlogCard key={b.id} post={b} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Nothing here yet — check other categories.
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-2">
          {allTags.slice(0, 14).map((t) => (
            <a
              key={t}
              href={`/blogs?tag=${encodeURIComponent(t)}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              #{t}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}