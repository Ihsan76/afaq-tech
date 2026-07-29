"use client";

import { useTranslations } from "next-intl";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function PlatformHowItWorks({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();

  const defaultSteps = [
    { num: "01", title: t("platformStep1Title"), desc: t("platformStep1Desc"), icon: "💬", color: "var(--color-primary)" },
    { num: "02", title: t("platformStep2Title"), desc: t("platformStep2Desc"), icon: "🎨", color: "var(--color-secondary)" },
    { num: "03", title: t("platformStep3Title"), desc: t("platformStep3Desc"), icon: "🚀", color: "var(--color-accent)" },
  ];

  const steps = c.steps?.map((s: any, i: number) => ({
    num: s.number || String(i + 1).padStart(2, "0"),
    title: localizedContent(s, "title", locale) || defaultSteps[i]?.title,
    desc: localizedContent(s, "desc", locale) || defaultSteps[i]?.desc,
    icon: s.icon || defaultSteps[i]?.icon,
    color: defaultSteps[i]?.color || "var(--color-primary)",
  })) || defaultSteps;

  return (
    <section id="how_it_works" className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale) || t("platformHowItWorksTitle")}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale) || t("platformHowItWorksSubtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 stagger-children">
          {steps.map((step: any, i: number) => (
            <div key={i} className="text-center p-6 sm:p-8 rounded-3xl hover-lift transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110" style={{ background: `linear-gradient(135deg, ${step.color}, var(--color-secondary))` }}>
                <span className="text-3xl">{step.icon}</span>
              </div>
              <div className="text-sm font-bold mb-2" style={{ color: step.color }}>{step.num}</div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{step.title}</h3>
              <p className="leading-relaxed text-sm" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
