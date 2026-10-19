"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/types";
import { useQueryParam } from "@/lib/use-query-param";
import { BlogCard } from "@/components/ui/product-card";

export function BlogsExplorer({ posts }: { posts: BlogPost[] }) {
  const urlTag = useQueryParam("tag");
  const [tagEdit, setTagEdit] = useState<string | null>(null);
  const activeTag = tagEdit ?? urlTag;

  const filtered = activeTag ? posts.filter((b) => b.tags.some((t) => t === activeTag) || b.category === activeTag) : posts;
  const allTags = [...new Set(posts.flatMap((b) => b.tags))];
  const categories = [...new Set(posts.map((b) => b.category))];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTagEdit(c)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTag === c ? "bg-accent text-accent-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
        {activeTag && (
          <button
            type="button"
            onClick={() => setTagEdit("")}
            className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            সব দেখুন
          </button>
        )}
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
          <button
            key={t}
            type="button"
            onClick={() => setTagEdit(t)}
            className="cursor-pointer rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            #{t}
          </button>
        ))}
      </div>
    </>
  );
}
