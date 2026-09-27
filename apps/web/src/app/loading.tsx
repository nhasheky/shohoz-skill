import { SectionHeader } from "@/components/marketing/section-header";

export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader title="Loading…" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3 shadow-card">
            <div className="skeleton aspect-video w-full rounded-xl" />
            <div className="mt-3 skeleton h-4 w-3/4 rounded" />
            <div className="mt-2 skeleton h-4 w-1/2 rounded" />
            <div className="mt-4 flex items-center justify-between">
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-6 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}