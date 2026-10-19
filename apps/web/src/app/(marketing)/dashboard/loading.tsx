export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-8 w-56 rounded" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="mt-3 skeleton h-7 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3">
            <div className="skeleton aspect-video w-full rounded-xl" />
            <div className="mt-3 skeleton h-4 w-3/4 rounded" />
            <div className="mt-2 skeleton h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
