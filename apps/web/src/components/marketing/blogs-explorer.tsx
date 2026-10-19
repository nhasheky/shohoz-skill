"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BlogPost } from "@/lib/types";
import { BlogCard } from "@/components/ui/product-card";

export function BlogsExplorer({ posts }: { posts: BlogPost[] }) {
  return (
    <Suspense fallback={<Grid posts={posts} activeTag="" />}>
      <Inner posts={posts} />
    </Suspense>
  );
}

function Inner({ posts }: { posts: BlogPost[] }) {
  const tag = useSearchParams().get("tag") ?? "";
  return <Grid posts={posts} activeTag={tag} />;
}

function Grid({ posts, activeTag }: { posts: BlogPost[]; activeTag: string }) {
  const filtered = activeTag ? posts.filter((b) => b.tags.some((t) => t === activeTag) || b.category === activeTag) : posts;
  const allTags = [...new Set(posts.flatMap((b) => b.tags))];
  const categories = [...new Set(posts.map((b) => b.category))];

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => (
          <Link
            key={c}
            href={`/blogs?tag=${encodeURIComponent(c)}`}
            scroll={false}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTag === c ? "bg-accent text-accent-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </Link>
        ))}
        {!activeTag && <span className="text-xs text-muted-foreground">· all {posts.length} posts</span>}
      </div>

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
          <Link
            key={t}
            href={`/blogs?tag=${encodeURIComponent(t)}`}
            scroll={false}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            #{t}
          </Link>
        ))}
      </div>
    </>
  );
}
