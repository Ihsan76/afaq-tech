"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { localizedContent } from "@/lib/i18n";

export default function FAQSection({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultFaqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  const faqs = c.items?.map((item: any) => ({
    q: localizedContent(item, "q", locale),
    a: localizedContent(item, "a", locale),
  })) || defaultFaqs;

  return (
    <section id="faq" className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 animate-fade-in-up" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("faqTitle"))}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq: any, i: number) => (
            <div key={i} className={`rounded-2xl overflow-hidden transition-all animate-fade-in-up delay-${(i + 1) * 100}`} style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                <span className="font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{faq.q}</span>
                <span className="text-xl flex-shrink-0 transition-transform" style={{ color: "var(--color-text-muted)", transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)" }}>
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
