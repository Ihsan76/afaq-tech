"use client";

import { useState } from "react";
import { localizedContent } from "@/lib/i18n";

export default function TabsSection({ content }: { content?: Record<string, any> }) {
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";
  const [activeTab, setActiveTab] = useState(0);

  const defaultTabs = [
    { title_ar: "تصميم المواقع", title_en: "Web Design", content_ar: "نصمّم مواقع عصرية وجذابة تعكس هوية علامتك التجارية وتوفر تجربة مستخدم مميزة.", content_en: "We design modern and attractive websites that reflect your brand identity and provide an exceptional user experience.", icon: "🎨" },
    { title_ar: "تطبيقات الجوال", title_en: "Mobile Apps", content_ar: "نطور تطبيقات جوال متعددة المنصات بأداء عالٍ وواجهات سهلة الاستخدام.", content_en: "We develop multi-platform mobile applications with high performance and easy-to-use interfaces.", icon: "📱" },
    { title_ar: "التسويق الرقمي", title_en: "Digital Marketing", content_ar: "نطلق حملات تسويقية فعّالة تصل لعملائك المستهدفين وتحقق نتائج قابلة للقياس.", content_en: "We launch effective marketing campaigns that reach your target customers and achieve measurable results.", icon: "📈" },
  ];

  const tabs = c.tabs?.map((tab: any) => ({
    title: localizedContent(tab, "title", locale),
    content: localizedContent(tab, "content", locale),
    icon: tab.icon || "•",
  })) || defaultTabs;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-surface-alt)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, "خدماتنا")}
          </h2>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex border-b overflow-x-auto" style={{ borderColor: "var(--color-border)" }}>
            {tabs.map((tab: any, i: number) => (
              <button key={i} onClick={() => setActiveTab(i)} className="px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2" style={{
                color: activeTab === i ? "var(--color-primary)" : "var(--color-text-muted)",
                borderBottom: activeTab === i ? "2px solid var(--color-primary)" : "2px solid transparent",
                background: activeTab === i ? "var(--color-primary-light)" : "transparent",
              }}>
                <span>{tab.icon}</span>
                {tab.title}
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {tabs[activeTab]?.content || ""}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
