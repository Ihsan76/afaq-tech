export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
          <span className="text-white text-2xl font-bold">آ</span>
        </div>
        <p style={{ color: "var(--color-text-muted)" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}
