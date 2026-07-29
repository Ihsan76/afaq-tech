export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-sm mb-6">
          <div className="h-4 w-20 rounded animate-pulse" style={{ background: "var(--color-muted)" }} />
          <div className="h-4 w-4 rounded animate-pulse" style={{ background: "var(--color-muted)" }} />
          <div className="h-4 w-24 rounded animate-pulse" style={{ background: "var(--color-muted)" }} />
        </div>
        <div className="h-10 w-64 rounded-xl animate-pulse mb-8" style={{ background: "var(--color-muted)" }} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-3xl animate-pulse" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--color-muted)" }} />
              <div className="h-6 w-32 rounded mb-2" style={{ background: "var(--color-muted)" }} />
              <div className="h-4 w-20 rounded" style={{ background: "var(--color-muted)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
