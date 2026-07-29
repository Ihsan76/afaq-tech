"use client";

import { useTranslations } from "next-intl";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent } from "@/lib/i18n";

export default function Testimonials({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();

  const defaultTestimonials = [
    { name: t("testimonial1Name"), role: t("testimonial1Role"), text: t("testimonial1Text"), avatar: "م", color: "var(--color-primary)" },
    { name: t("testimonial2Name"), role: t("testimonial2Role"), text: t("testimonial2Text"), avatar: "ع", color: "var(--color-secondary)" },
    { name: t("testimonial3Name"), role: t("testimonial3Role"), text: t("testimonial3Text"), avatar: "ف", color: "var(--color-accent)" },
  ];

  const items = c.items?.map((item: any, i: number) => ({
    name: localizedContent(item, "name", locale),
    role: localizedContent(item, "role", locale),
    text: localizedContent(item, "text", locale),
    avatar: localizedContent(item, "name", locale).charAt(0) || "?",
    color: defaultTestimonials[i]?.color || "var(--color-primary)",
  })) || defaultTestimonials;

  return (
    <section id="testimonials" className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("testimonialsTitle"))}
          </h2>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale, t("testimonialsSubtitle"))}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 stagger-children">
          {items.map((item: any, i: number) => (
            <div key={i} className="p-6 sm:p-8 rounded-3xl hover-lift transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (<span key={j} className="text-lg">⭐</span>))}
              </div>
              <p className="mb-6 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>&ldquo;{item.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md" style={{ background: `linear-gradient(135deg, ${item.color}, var(--color-secondary))` }}>
                  {item.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
