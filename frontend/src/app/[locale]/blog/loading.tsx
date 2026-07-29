export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="relative py-16 sm:py-24 overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="h-12 w-48 mx-auto rounded-xl animate-pulse mb-4" style={{ background: "var(--color-muted)" }} />
          <div className="h-6 w-80 mx-auto rounded-lg animate-pulse" style={{ background: "var(--color-muted)" }} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex gap-2 mb-10 justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 rounded-full animate-pulse" style={{ background: "var(--color-muted)" }} />
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-3xl animate-pulse" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-full h-40 rounded-2xl mb-4" style={{ background: "var(--color-muted)" }} />
              <div className="h-5 w-3/4 rounded mb-2" style={{ background: "var(--color-muted)" }} />
              <div className="h-4 w-full rounded mb-2" style={{ background: "var(--color-muted)" }} />
              <div className="h-4 w-1/2 rounded" style={{ background: "var(--color-muted)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
