"use client";

import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function MapSection({ content }: { content?: Record<string, any> }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {localizedContent(c, "title", locale) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          {c.embed_url ? (
            <iframe src={c.embed_url} width="100%" height={c.height || 400} style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="flex items-center justify-center text-sm" style={{ height: c.height || 400, backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
              {localizedContent(c, "placeholder", locale) || "أدخل رابط خريطة Google Maps في إعدادات البلوك"}
            </div>
          )}
        </div>
        {c.address && (
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>📍 {c.address}</p>
          </div>
        )}
      </div>
    </section>
  );
}
