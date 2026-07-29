"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function AcademyHero({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden" style={{ background: "var(--color-background)" }}>
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--color-primary) 20%, transparent) 0%, transparent 60%)` }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 25}%`, width: `${5 + i * 2}px`, height: `${5 + i * 2}px`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className={`mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl animate-float" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl sm:text-3xl">🎓</span>
          </div>
        </div>

        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
          <span className="gradient-text">{t("academyHeroTitle")}</span>
        </h1>

        <p className={`text-lg sm:text-xl mb-8 max-w-2xl mx-auto transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ color: "var(--color-text-secondary)" }}>
          {t("academyHeroSubtitle")}
        </p>

        <div className={`flex flex-wrap justify-center gap-6 transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { num: "+6", label: t("academyGrades"), color: "var(--color-primary)" },
            { num: "+12", label: t("academySubjects"), color: "var(--color-success)" },
            { num: "+5", label: t("academyCurricula"), color: "var(--color-accent)" },
          ].map((stat, i) => (
            <div key={i} className="px-6 py-3 rounded-2xl hover-lift transition-all duration-300" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <span className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "var(--font-heading)" }}>{stat.num}</span>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
