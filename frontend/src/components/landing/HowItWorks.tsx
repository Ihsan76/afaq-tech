"use client";

import { useTranslations } from "next-intl";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent } from "@/lib/i18n";

export default function HowItWorks({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultSteps = [
    { num: 1, icon: "📚", title: t("step1Title"), desc: t("step1Desc"), color: "var(--color-primary)" },
    { num: 2, icon: "✍️", title: t("step2Title"), desc: t("step2Desc"), color: "var(--color-secondary)" },
    { num: 3, icon: "🎯", title: t("step3Title"), desc: t("step3Desc"), color: "var(--color-accent)" },
  ];

  const steps = c.steps?.map((s: any, i: number) => ({
    num: i + 1,
    icon: s.icon || defaultSteps[i]?.icon,
    title: localizedContent(s, "title", locale) || defaultSteps[i]?.title,
    desc: localizedContent(s, "desc", locale) || defaultSteps[i]?.desc,
    color: defaultSteps[i]?.color || "var(--color-primary)",
  })) || defaultSteps;

  return (
    <section id="how_it_works" className="py-16 sm:py-24" style={{ backgroundColor: "var(--color-surface-alt)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("howItWorksTitle"))}
          </h2>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale, t("howItWorksSubtitle"))}
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5" style={{ backgroundColor: "var(--color-border)" }} />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 stagger-children">
            {steps.map((step: any, i: number) => (
              <div key={step.num} className="relative text-center hover-lift transition-all duration-300">
                <div className="relative mx-auto mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full flex items-center justify-center text-3xl sm:text-4xl relative z-10 transition-transform hover:scale-110" style={{ backgroundColor: "var(--color-surface)", border: "2px solid var(--color-primary)", boxShadow: "0 0 0 4px var(--color-primary-light)" }}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold z-20 shadow-lg" style={{ background: `linear-gradient(135deg, ${step.color}, var(--color-secondary))` }}>
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
