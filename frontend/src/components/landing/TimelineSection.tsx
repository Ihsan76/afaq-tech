"use client";

import { localizedContent } from "@/lib/i18n";

export default function TimelineSection({ content }: { content?: Record<string, any> }) {
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultItems = [
    { date_ar: "يناير 2024", date_en: "Jan 2024", title_ar: "تأسيس المنصة", title_en: "Platform Founded", desc_ar: "بداية رحلة آفاق تكنولوجي لتقديم حلول رقمية مبتكرة.", desc_en: "The beginning of Afaq Tech's journey to deliver innovative digital solutions.", icon: "🚀" },
    { date_ar: "مارس 2024", date_en: "Mar 2024", title_ar: "إطلاق الأكاديمية", title_en: "Academy Launch", desc_ar: "إطلاق الأكاديمية الرقمية لتدريب الطلاب على المهارات التقنية.", desc_en: "Launching the digital academy to train students on technical skills.", icon: "📚" },
    { date_ar: "يونيو 2024", date_en: "Jun 2024", title_ar: "توسعة الخدمات", title_en: "Services Expansion", desc_ar: "إضافة خدمات تصميم المواقع وإدارة وسائل التواصل الاجتماعي.", desc_en: "Adding web design and social media management services.", icon: "📈" },
    { date_ar: "سبتمبر 2024", date_en: "Sep 2024", title_ar: "شراكات استراتيجية", title_en: "Strategic Partnerships", desc_ar: "توقيع اتفاقيات شراكة مع شركات رائدة في المنطقة.", desc_en: "Signing partnership agreements with leading companies in the region.", icon: "🤝" },
  ];

  const items = c.items?.map((item: any) => ({
    date: localizedContent(item, "date", locale),
    title: localizedContent(item, "title", locale),
    desc: localizedContent(item, "desc", locale),
    icon: item.icon || "•",
  })) || defaultItems;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, "مسيرة النجاح")}
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5" style={{ backgroundColor: "var(--color-border)" }} />
          <div className="space-y-8">
            {items.map((item: any, i: number) => (
              <div key={i} className={`relative flex items-start gap-4 sm:gap-8 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"}`}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl z-10" style={{ backgroundColor: "var(--color-surface)", border: "2px solid var(--color-primary)", boxShadow: "0 0 0 4px var(--color-primary-light)" }}>
                  {item.icon}
                </div>
                <div className={`flex-1 sm:w-[calc(50%-2rem)] p-5 rounded-2xl ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`} style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{item.date}</span>
                  <h3 className="text-lg font-bold mt-1 mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
