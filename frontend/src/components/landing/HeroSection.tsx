"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { localizedContent, resolveLink } from "@/lib/i18n";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function HeroSection({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user } = useAuthStore();
  const c = content || {};

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { data: settings } = useSWR<{ email: string }>("/pages/settings/", fetcher);

  const heading = localizedContent(c, "heading", locale, t("heroTitle"));
  const subtitle = localizedContent(c, "subtitle", locale, t("heroSubtitle"));
  const isSmart = c.is_smart_cta !== false;
  const ctaText = (isSmart && user) ? (locale === "ar" ? "الانتقال لساحة العمل" : "Go to Workspace") : localizedContent(c, "cta_text", locale, t("heroCTA"));
  let ctaLink = (isSmart && user) ? `/${locale}/school/dashboard` : localizedContent(c, "cta_link", locale, "/register");
  if (ctaLink.startsWith("mailto:") && settings?.email) {
    ctaLink = `mailto:${settings.email}`;
  }
  ctaLink = resolveLink(locale, ctaLink);
  const secText = localizedContent(c, "secondary_cta", locale, t("heroDemo"));
  const secLink = resolveLink(locale, localizedContent(c, "secondary_cta_link", locale, "#services"));
  const defaultBadges = [
    { text: { en: "Free forever", ar: "مجاني تماماً" } },
    { text: { en: "No credit card required", ar: "بدون بطاقة ائتمان" } },
    { text: { en: "Cancel anytime", ar: "يمكنك الإلغاء في أي وقت" } },
  ];
  const badges = (c.badges || defaultBadges).map((b: any) => ({
    ...b,
    text_display: localizedContent(b, "text", locale),
  }));

  const scrollToSection = (hash: string) => {
    const el = document.getElementById(hash.replace("#", ""));
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `${pathname}${hash}`);
    }
  };

  const isHash = (link: string) => link.startsWith("#");

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--color-background)" }}>
      {/* Animated background blobs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full animate-morph opacity-20" style={{ background: "var(--color-primary)" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full animate-morph opacity-15" style={{ background: "var(--color-secondary)", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-morph opacity-10" style={{ background: "var(--color-accent)", animationDelay: "4s" }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${10 + i * 11}%`, top: `${15 + (i % 4) * 22}%`, width: `${6 + i * 2}px`, height: `${6 + i * 2}px`, animationDelay: `${i * 0.7}s`, animationDuration: `${4 + i * 0.6}s` }} />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Logo */}
        <div className={`mb-6 sm:mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 rounded-3xl flex items-center justify-center shadow-2xl animate-float" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-3xl sm:text-4xl font-bold">آ</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
          <span className="gradient-text">
            {heading}
          </span>
        </h1>

        {/* Subtitle */}
        <p className={`text-base sm:text-xl md:text-2xl mb-6 sm:mb-10 leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>

        {/* CTAs */}
        <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {isHash(ctaLink) ? (
            <button onClick={() => scrollToSection(ctaLink)} className="group px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow), 0 0 40px color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
              <span className="flex items-center gap-2">
                {ctaText}
                <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">←</span>
              </span>
            </button>
          ) : (
            <Link href={ctaLink} className="group px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow), 0 0 40px color-mix(in srgb, var(--color-primary) 25%, transparent)" }}>
              <span className="flex items-center gap-2">
                {ctaText}
                <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">←</span>
              </span>
            </Link>
          )}
          {isHash(secLink) ? (
            <button onClick={() => scrollToSection(secLink)} className="group px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]" style={{ border: "2px solid var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
              {secText}
            </button>
          ) : (
            <Link href={secLink} className="group px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]" style={{ border: "2px solid var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
              {secText}
            </Link>
          )}
        </div>

        {/* Badges */}
        <div className={`mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ color: "var(--color-text-muted)" }}>
          {badges.map((b: any, i: number) => (
            <span key={i} className="flex items-center gap-1.5 sm:gap-2 bg-[var(--color-surface)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
              <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: "var(--color-success)" }} />
              {b.text_display}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to top, var(--color-background), transparent)" }} />
    </section>
  );
}
