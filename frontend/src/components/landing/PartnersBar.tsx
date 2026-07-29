"use client";

import { useTranslations } from "next-intl";
import { localizedContent } from "@/lib/i18n";

export default function PartnersBar({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultPartners = [
    { name: t("partner1"), icon: "🏫" },
    { name: t("partner2"), icon: "🎓" },
    { name: t("partner3"), icon: "🏛️" },
    { name: t("partner4"), icon: "📚" },
  ];

  const partners = c.partners?.map((p: any) => ({
    name: localizedContent(p, "name", locale),
    icon: "🏛️",
  })) || defaultPartners;

  return (
    <section id="partners" className="py-16" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-sm font-semibold mb-8 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {localizedContent(c, "title", locale) || t("partnersTitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {partners.map((partner: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <span className="text-2xl">{partner.icon}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
