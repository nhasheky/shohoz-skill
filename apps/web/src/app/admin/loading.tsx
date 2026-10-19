export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="mt-3 skeleton h-7 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-11 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
