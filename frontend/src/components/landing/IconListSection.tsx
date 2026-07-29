"use client";

import { localizedContent } from "@/lib/i18n";

export default function IconListSection({ content }: { content?: Record<string, any> }) {
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultItems = [
    { icon: "✅", text: { ar: "تصميم عصري يتوافق مع جميع الأجهزة", en: "Modern design responsive across all devices" } },
    { icon: "✅", text: { ar: "سرعة تحميل فائقة", en: "Ultra-fast loading speed" } },
    { icon: "✅", text: { ar: "تحسين محركات البحث (SEO)", en: "Search engine optimization (SEO)" } },
    { icon: "✅", text: { ar: "أمان وحماية متقدمة", en: "Advanced security and protection" } },
    { icon: "✅", text: { ar: "دعم فني على مدار الساعة", en: "24/7 technical support" } },
    { icon: "✅", text: { ar: "تقارير وإحصائيات مفصلة", en: "Detailed reports and analytics" } },
  ];

  const items = c.items?.map((item: any) => ({
    icon: item.icon || "✅",
    text: localizedContent(item, "text", locale),
  })) || defaultItems;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {(localizedContent(c, "title", locale)) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="space-y-4">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl transition-all" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <span className="text-2xl flex-shrink-0" style={{ color: "var(--color-primary)" }}>{item.icon}</span>
              <span className="text-base font-medium" style={{ color: "var(--color-text)" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
