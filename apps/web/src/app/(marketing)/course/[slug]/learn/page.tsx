import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourse, getMyEnrollments, hasSession } from "@/lib/api";
import { CoursePlayer } from "@/components/product/course-player";
import { BackgroundOrbs } from "@/components/layout/background";

export const metadata: Metadata = { title: "Watch course", robots: { index: false } };
export const revalidate = 0;

export default async function CourseLearnPage(props: PageProps<"/course/[slug]/learn">) {
  const params = await props.params;
  const course = await getCourse(params.slug);
  if (!course) notFound();

  let enrolled = false;
  try {
    if (await hasSession()) {
      const list = await getMyEnrollments();
      enrolled = list.some(
        (e) => e.type === "course" && (e.productId === course.id || e.slug === course.slug),
      );
    }
  } catch {
    enrolled = false;
  }

  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 overflow-hidden">
        <BackgroundOrbs variant="navy" className="opacity-50" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading…</div>}>
          <CoursePlayer title={course.title} sections={course.curriculum} enrolled={enrolled} />
        </Suspense>
      </div>
    </main>
  );
}
