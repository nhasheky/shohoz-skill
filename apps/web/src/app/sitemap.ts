import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { courses } from "@/lib/data/courses";
import { books } from "@/lib/data/books";
import { allExams } from "@/lib/data/exams";
import { blogs } from "@/lib/data/blogs";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const staticRoutes = [
    "",
    "/courses",
    "/books",
    "/exams",
    "/exams?type=free",
    "/blogs",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const courseRoutes = courses.map((c) => ({
    url: `${base}/courses/${c.slug}`,
    lastModified: new Date(c.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const bookRoutes = books.map((b) => ({
    url: `${base}/books/${b.slug}`,
    lastModified: new Date(b.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const examRoutes = allExams.map((e) => ({
    url: `${base}/exams/${e.slug}`,
    lastModified: new Date(e.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogRoutes = blogs.map((b) => ({
    url: `${base}/blogs/${b.slug}`,
    lastModified: new Date(b.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...courseRoutes, ...bookRoutes, ...examRoutes, ...blogRoutes];
}
