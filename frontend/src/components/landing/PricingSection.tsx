"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth";

export default function PricingSection({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const user = useAuthStore((s) => s.user);
  const c = content || {};
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();
  const ctaHref = user ? `/${locale}/subscriptions` : `/${locale}/register`;

  const defaultPlans = [
    { key: "free", price: "$0", period: t("pricingMonth"), features: [t("freeFeature1"), t("freeFeature2"), t("freeFeature3"), t("freeFeature4")], cta: t("freeCTA"), featured: false },
    { key: "pro", price: "$9.99", period: t("pricingMonth"), badge: t("pricingPopular"), features: [t("proFeature1"), t("proFeature2"), t("proFeature3"), t("proFeature4"), t("proFeature5")], cta: t("proCTA"), featured: true },
    { key: "school", price: "$49.99", period: t("pricingMonth"), features: [t("schoolFeature1"), t("schoolFeature2"), t("schoolFeature3"), t("schoolFeature4"), t("schoolFeature5")], cta: t("schoolCTA"), featured: false },
  ];

  const plans = c.plans?.map((p: any, i: number) => ({
    key: localizedContent(p, "name", locale).toLowerCase() || `plan${i}`,
    name: localizedContent(p, "name", locale),
    price: p.price ? `$${p.price}` : defaultPlans[i]?.price || "$0",
    period: localizedContent(p, "period", locale) || p.period || defaultPlans[i]?.period,
    badge: p.badge || "",
    features: p.features || defaultPlans[i]?.features || [],
    cta: localizedContent(p, "cta", locale) || p.cta || "",
    featured: p.highlighted || false,
  })) || defaultPlans;

  return (
    <section id="pricing" className="py-16 sm:py-24" style={{ backgroundColor: "var(--color-surface-alt)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale) || t("pricingTitle")}
          </h2>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale) || t("pricingSubtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch stagger-children">
          {plans.map((plan: any, i: number) => (
            <div key={i} className={`relative p-6 sm:p-8 rounded-3xl flex flex-col hover-lift transition-all duration-300 ${plan.featured ? 'ring-2 ring-[var(--color-primary)]' : ''}`} style={{ background: "var(--color-surface)", border: plan.featured ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", boxShadow: plan.featured ? "0 0 0 4px var(--color-primary-light), var(--card-shadow)" : "var(--card-shadow)" }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>{plan.badge}</div>
              )}
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{plan.name || t(`pricing${plan.key}`)}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{plan.price}</span>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>/ {plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat: string, j: number) => (
                  <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="text-[var(--color-success)]">✓</span>{feat}
                  </li>
                ))}
              </ul>
              <Link href={ctaHref} className={`block text-center py-3 rounded-2xl font-semibold transition-all duration-200 ${plan.featured ? 'hover:shadow-lg hover:-translate-y-0.5' : 'hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'}`} style={plan.featured ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white", boxShadow: "var(--btn-shadow)" } : { border: "2px solid var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
