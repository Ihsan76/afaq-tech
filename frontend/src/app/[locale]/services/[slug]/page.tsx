"use client";

import { useTranslations } from "next-intl";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ServiceMeta {
  slug: string;
  icon: string;
  color: string;
  titleKey: string;
  descKey: string;
}

const SERVICES: ServiceMeta[] = [
  { slug: "web-design", icon: "🌐", color: "var(--color-primary-light)", titleKey: "landing.serviceWebDesign", descKey: "landing.serviceWebDesignDesc" },
  { slug: "social-media", icon: "📱", color: "var(--color-success-light)", titleKey: "landing.serviceSocialMedia", descKey: "landing.serviceSocialMediaDesc" },
  { slug: "landing-pages", icon: "📄", color: "var(--color-accent-light)", titleKey: "landing.serviceLandingPages", descKey: "landing.serviceLandingPagesDesc" },
  { slug: "forms", icon: "📋", color: "var(--color-warning-light)", titleKey: "landing.serviceForms", descKey: "landing.serviceFormsDesc" },
  { slug: "ebooks", icon: "📚", color: "var(--color-error-light)", titleKey: "landing.serviceEbooks", descKey: "landing.serviceEbooksDesc" },
  { slug: "ad-campaigns", icon: "📢", color: "var(--color-success-light)", titleKey: "landing.serviceAds", descKey: "landing.serviceAdsDesc" },
  { slug: "brand-identity", icon: "🎨", color: "var(--color-secondary-light, var(--color-primary-light))", titleKey: "landing.serviceBranding", descKey: "landing.serviceBrandingDesc" },
];

const STEPS = ["step1", "step2", "step3", "step4"] as const;

export default function ServicePage() {
  const params = useParams();
  const slug = params.slug as string;
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const tLanding = useTranslations("landing");
  const t = useTranslations("services");

  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const features = (t.raw(`${service.slug}.features`) as string[] | undefined) || [];
  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28 text-center"
        style={{ background: "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))" }}>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl" style={{ background: "rgba(255,255,255,0.95)" }}>
            <span className="text-4xl">{service.icon}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {tLanding(service.titleKey)}
          </h1>
          <p className="text-lg sm:text-xl mb-8 opacity-90 text-white max-w-2xl mx-auto">
            {tLanding(service.descKey)}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/register`}
              className="px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              style={{ background: "white", color: "var(--color-primary)" }}>
              {t("ctaButton")}
            </Link>
            <Link href={`/${locale}`}
              className="px-8 py-3.5 rounded-2xl font-bold text-base border-2 border-white text-white hover:bg-white/10 transition-all">
              {t("backToHome")}
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "50px 50px, 30px 30px",
        }} />
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("featuresTitle")}
            </h2>
            <p style={{ color: "var(--color-text-muted)" }}>{t("featuresSubtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="p-5 rounded-3xl flex items-start gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold" style={{ background: service.color, color: "var(--color-primary)" }}>
                  {i + 1}
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: "var(--color-text)" }}>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16" style={{ background: "var(--color-surface-alt)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("processTitle")}
            </h2>
            <p style={{ color: "var(--color-text-muted)" }}>{t("processSubtitle")}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <div key={step} className="p-6 rounded-3xl text-center"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center font-bold text-white" style={{ background: "var(--color-primary)" }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1" style={{ color: "var(--color-text)" }}>{t(step)}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t(`${step}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {t("ctaTitle")}
          </h2>
          <p className="mb-8 opacity-90 text-white">{t("ctaSubtitle")}</p>
          <Link href={`/${locale}/register`}
            className="inline-block px-10 py-3.5 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            style={{ background: "white", color: "var(--color-primary)" }}>
            {t("ctaButton")}
          </Link>
        </div>
      </section>

      {/* Other services */}
      {others.length > 0 && (
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {t("otherServicesTitle")}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {others.map((s) => (
                <Link key={s.slug} href={`/${locale}/services/${s.slug}`}
                  className="group p-6 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300" style={{ background: s.color }}>
                    <span className="text-xl">{s.icon}</span>
                  </div>
                  <h3 className="font-bold mb-1" style={{ color: "var(--color-text)" }}>{tLanding(s.titleKey)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{tLanding(s.descKey)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
