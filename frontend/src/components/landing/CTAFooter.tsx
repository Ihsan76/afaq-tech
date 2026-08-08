"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent, resolveLink } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth";

export default function CTAFooter({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user } = useAuthStore();
  const c = content || {};
  const { ref, isVisible } = useScrollReveal();

  const title = localizedContent(c, "title", locale, t("ctaTitle"));
  const subtitle = localizedContent(c, "subtitle", locale, t("ctaSubtitle"));
  const ctaText = user ? (locale === "ar" ? "الانتقال لساحة العمل" : "Go to Workspace") : localizedContent(c, "cta_text", locale, t("ctaButton"));
  const ctaLink = user ? `/${locale}/dashboard` : resolveLink(locale, localizedContent(c, "cta_link", locale, "/register"));

  const scrollToSection = (hash: string) => {
    const el = document.getElementById(hash.replace("#", ""));
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `/${locale}${hash}`);
    }
  };

  const isHash = ctaLink.startsWith("#");

  return (
    <section id="cta" ref={ref} className="py-20 px-4">
      <div className={`max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 lg:p-16 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ background: "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))", boxShadow: "0 20px 60px -15px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-heading)" }}>{title}</h2>
        <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.85)" }}>{subtitle}</p>
        {isHash ? (
          <button onClick={() => scrollToSection(ctaLink)} className="group inline-block px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl" style={{ backgroundColor: "white", color: "var(--color-primary)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <span className="flex items-center gap-2">
              {ctaText}
              <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">←</span>
            </span>
          </button>
        ) : (
          <Link href={ctaLink} className="group inline-block px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl" style={{ backgroundColor: "white", color: "var(--color-primary)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
            <span className="flex items-center gap-2">
              {ctaText}
              <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">←</span>
            </span>
          </Link>
        )}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
          <span>⭐ 4.8/5</span><span>•</span><span>{t("ctaTrusted")}</span>
        </div>
      </div>
    </section>
  );
}
