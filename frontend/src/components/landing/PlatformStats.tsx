"use client";

import { useTranslations } from "next-intl";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function PlatformStats({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};
  const { ref, isVisible } = useScrollReveal();

  const defaultStats = [
    { value: "150+", label: t("platformStatsProjects") },
    { value: "500+", label: t("platformStatsUsers") },
    { value: "8", label: t("platformStatsServices") },
    { value: "5+", label: t("platformStatsExperience") },
  ];

  const stats = c.items?.length ? c.items.map((item: any) => ({
    value: item.value,
    label: localizedContent(item, "label", locale) || "",
  })) : [
    { value: c.stat1_value || "150+", label: c.stat1_label || t("platformStatsProjects") },
    { value: c.stat2_value || "500+", label: c.stat2_label || t("platformStatsUsers") },
    { value: c.stat3_value || "8", label: c.stat3_label || t("platformStatsServices") },
    { value: c.stat4_value || "5+", label: c.stat4_label || t("platformStatsExperience") },
  ];

  return (
    <section id="stats" ref={ref} className="py-16" style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 stagger-children">
          {stats.map((stat: any, i: number) => (
            <div key={i} className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="text-4xl sm:text-5xl font-bold mb-2 gradient-text">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base" style={{ color: "var(--color-text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
