"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent } from "@/lib/i18n";

export default function ServicesShowcase({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();

  const defaultServices = [
    { icon: "🌐", title: t("serviceWebDesign"), desc: t("serviceWebDesignDesc"), color: "var(--color-primary-light)", href: `/${locale}/services/web-design` },
    { icon: "📱", title: t("serviceSocialMedia"), desc: t("serviceSocialMediaDesc"), color: "var(--color-success-light)", href: `/${locale}/services/social-media` },
    { icon: "📄", title: t("serviceLandingPages"), desc: t("serviceLandingPagesDesc"), color: "var(--color-accent-light)", href: `/${locale}/services/landing-pages` },
    { icon: "📋", title: t("serviceForms"), desc: t("serviceFormsDesc"), color: "var(--color-warning-light)", href: `/${locale}/services/forms` },
    { icon: "📚", title: t("serviceEbooks"), desc: t("serviceEbooksDesc"), color: "var(--color-error-light)", href: `/${locale}/services/ebooks` },
    { icon: "🎓", title: t("serviceAcademy"), desc: t("serviceAcademyDesc"), color: "var(--color-primary-light)", href: `/${locale}/academy`, badge: t("academyBadge") },
    { icon: "📢", title: t("serviceAds"), desc: t("serviceAdsDesc"), color: "var(--color-success-light)", href: `/${locale}/services/ad-campaigns` },
    { icon: "🎨", title: t("serviceBranding"), desc: t("serviceBrandingDesc"), color: "var(--color-secondary-light, var(--color-primary-light))", href: `/${locale}/services/brand-identity` },
  ];

  const services = c.services?.map((s: any, i: number) => {
    const rawUrl = s.url || defaultServices[i]?.href || "#";
    const href = rawUrl.startsWith(`/${locale}`) ? rawUrl : rawUrl.startsWith("/") ? `/${locale}${rawUrl}` : rawUrl;
    return {
      icon: s.icon || defaultServices[i]?.icon,
      title: localizedContent(s, "title", locale),
      desc: localizedContent(s, "desc", locale),
      color: defaultServices[i]?.color || "var(--color-primary-light)",
      href,
      badge: s.badge || defaultServices[i]?.badge,
    };
  }) || defaultServices;

  return (
    <section id="services" className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("servicesTitle"))}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale) || t("servicesSubtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {services.map((service: any, i: number) => (
            <Link key={i} href={service.href} className="group p-6 rounded-3xl hover-lift relative transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              {service.badge && (
                <span className="absolute top-4 left-4 px-2 py-1 text-xs font-semibold rounded-full animate-pulse" style={{ background: "var(--color-primary)", color: "#FFFFFF" }}>{service.badge}</span>
              )}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" style={{ background: service.color }}>
                <span className="text-2xl">{service.icon}</span>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{service.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{service.desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold transition-all group-hover:translate-x-1 rtl:group-hover:-translate-x-1" style={{ color: "var(--color-primary)" }}>{t("learnMore")} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
