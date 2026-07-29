"use client";

import { localizedContent } from "@/lib/i18n";

export default function DownloadSection({ content }: { content?: Record<string, any> }) {
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultItems = [
    { icon: "📄", title: { ar: "دليل المنصة", en: "Platform Guide" }, desc: { ar: "دليل شامل لاستخدام جميع ميزات المنصة", en: "A comprehensive guide to using all platform features" }, url: "#" },
    { icon: "📊", title: { ar: "تقرير الخدمات", en: "Services Report" }, desc: { ar: "تقرير مفصل عن جميع الخدمات المتاحة", en: "A detailed report of all available services" }, url: "#" },
    { icon: "📐", title: { ar: "قالب التصميم", en: "Design Template" }, desc: { ar: "قالب جاهز لبدء تصميم مشروعك", en: "A ready template to start your project design" }, url: "#" },
  ];

  const items = c.items?.map((item: any) => ({
    icon: item.icon || "📄",
    title: localizedContent(item, "title", locale),
    desc: localizedContent(item, "desc", locale),
    url: item.url || "#",
  })) || defaultItems;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {(localizedContent(c, "title", locale)) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item: any, i: number) => (
            <a key={i} href={item.url} className="p-6 rounded-2xl transition-all hover:scale-105 flex flex-col items-center text-center" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <span className="text-4xl mb-4">{item.icon}</span>
              <h3 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{item.title}</h3>
              <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{item.desc}</p>
              <span className="text-sm font-semibold mt-auto" style={{ color: "var(--color-primary)" }}>
                {locale === "ar" ? "تحميل ⬇" : "Download ⬇"}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
