export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-4 w-32 rounded mb-6 animate-pulse" style={{ background: "var(--color-muted)" }} />
        <div className="flex gap-3 mb-4">
          <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: "var(--color-muted)" }} />
          <div className="h-6 w-24 rounded animate-pulse" style={{ background: "var(--color-muted)" }} />
        </div>
        <div className="h-12 w-3/4 rounded-xl animate-pulse mb-4" style={{ background: "var(--color-muted)" }} />
        <div className="h-6 w-full rounded-lg animate-pulse mb-8" style={{ background: "var(--color-muted)" }} />
        <div className="h-96 w-full rounded-3xl animate-pulse mb-10" style={{ background: "var(--color-muted)" }} />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ background: "var(--color-muted)", width: `${100 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
