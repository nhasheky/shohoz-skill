import type { Metadata } from "next";
import { BackgroundOrbs } from "@/components/layout/background";
import { SectionHeader } from "@/components/marketing/section-header";
import { BlogsExplorer } from "@/components/marketing/blogs-explorer";
import { getBlogs } from "@/lib/api";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Study plans, exam analysis, negative-marking strategy and viva guides — written by the people who cleared these exams.",
};

export const revalidate = 60;

export default async function BlogsPage() {
  const blogs = await getBlogs();

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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <BlogsExplorer posts={blogs} />
      </section>
    </main>
  );
}
