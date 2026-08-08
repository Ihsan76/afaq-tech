"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent, resolveLink } from "@/lib/i18n";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface SiteSettings {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
}

export default function FeaturesSection({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user } = useAuthStore();
  const c = content || {};
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollReveal();
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal();
  const { data: settings } = useSWR<SiteSettings>("/pages/settings/", fetcher);

  const defaultFeatures = [
    { icon: "🎓", title: t("feature1Title"), desc: t("feature1Desc"), color: "var(--color-primary-light)", points: [t("feature1Point1"), t("feature1Point2"), t("feature1Point3")], href: `/${locale}/academy` },
    { icon: "📝", title: t("feature2Title"), desc: t("feature2Desc"), color: "var(--color-success-light)", points: [t("feature2Point1"), t("feature2Point2"), t("feature2Point3")], href: `/${locale}/lesson-plans/new` },
    { icon: "🤖", title: t("feature3Title"), desc: t("feature3Desc"), color: "var(--color-accent-light)", points: [t("feature3Point1"), t("feature3Point2"), t("feature3Point3")], href: user ? `/${locale}/dashboard` : `/${locale}/register` },
  ];

  const features = c.items?.map((item: any, i: number) => {
    let desc = localizedContent(item, "desc", locale);

    if (settings) {
      const icon = item.icon || "";
      if (icon === "📧" && settings.email) {
        desc = locale === "ar" ? `${settings.email} — نرد خلال 24 ساعة` : settings.email;
      } else if (icon === "📱" && (settings.whatsapp || settings.phone)) {
        const contact = settings.whatsapp || settings.phone;
        desc = locale === "ar" ? `${contact} — تواصل فوري` : contact;
      } else if (icon === "📍" && settings.address) {
        desc = settings.address;
      }
    }

    return {
      icon: item.icon || defaultFeatures[i]?.icon,
      title: localizedContent(item, "title", locale),
      desc,
      color: defaultFeatures[i]?.color || "var(--color-primary-light)",
      points: item.points
        ? item.points.map((p: any) => {
            if (typeof p === "string") return p;
            return localizedContent(p, "text", locale) || localizedContent(p, "ar", locale) || p?.ar || p?.en || p?.translations?.ar?.text || "";
          })
        : [],
      link: item.link ? resolveLink(locale, item.link) : null,
    };
  }) || defaultFeatures.map((f: any) => ({ ...f, link: f.href }));

  return (
    <section id="features" ref={sectionRef} className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div ref={titleRef} className={`text-center mb-10 sm:mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("featuresTitle"))}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale, t("featuresSubtitle"))}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 stagger-children">
          {features.map((feat: any, i: number) =>
            feat.link ? (
              <Link key={i} href={feat.link} className="group p-6 sm:p-8 rounded-3xl hover-lift transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" style={{ background: feat.color }}>
                  <span className="text-3xl">{feat.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{feat.title}</h3>
                <p className="mb-5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{feat.desc}</p>
                <ul className="space-y-2 mb-6">
                  {(feat.points || []).map((point: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="text-[var(--color-success)] transition-transform group-hover:scale-125">✓</span>{point}
                    </li>
                  ))}
                </ul>
                <span className="text-sm font-semibold transition-all group-hover:translate-x-1 rtl:group-hover:-translate-x-1" style={{ color: "var(--color-primary)" }}>{t("learnMore")} →</span>
              </Link>
            ) : (
              <div key={i} className="p-6 sm:p-8 rounded-3xl transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm" style={{ background: feat.color }}>
                  <span className="text-3xl">{feat.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{feat.title}</h3>
                <p className="mb-5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{feat.desc}</p>
                <ul className="space-y-2 mb-6">
                  {(feat.points || []).map((point: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="text-[var(--color-success)]">✓</span>{point}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
