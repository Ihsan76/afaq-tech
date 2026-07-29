"use client";

import { useState } from "react";
import { localizedContent } from "@/lib/i18n";

export default function AccordionSection({ content }: { content?: Record<string, any> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultItems = [
    { title_ar: "البيانات والأمان", title_en: "Data & Security", desc_ar: "نحمي بياناتك بأعلى معايير الأمان والتشفير.", desc_en: "We protect your data with the highest security and encryption standards.", icon: "🔒" },
    { title_ar: "التكامل", title_en: "Integration", desc_ar: "نتكامل مع جميع الأدوات والأنظمة التي تستخدمها.", desc_en: "We integrate with all the tools and systems you use.", icon: "🔗" },
    { title_ar: "الدعم الفني", title_en: "Support", desc_ar: "فريق دعم متخصص على مدار الساعة لمساعدتك.", desc_en: "A specialized support team around the clock to help you.", icon: "🎧" },
  ];

  const items = c.items?.map((item: any) => ({
    title: localizedContent(item, "title", locale),
    desc: localizedContent(item, "desc", locale),
    icon: item.icon || "•",
  })) || defaultItems;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, "أقسام تفصيلية")}
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <span className="font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{item.title}</span>
                </div>
                <span className="text-xl flex-shrink-0 transition-transform" style={{ color: "var(--color-text-muted)", transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)" }}>
                  <p className="pt-4">{item.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
