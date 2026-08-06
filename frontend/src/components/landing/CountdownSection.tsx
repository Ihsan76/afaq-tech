"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

export default function CountdownSection({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};
  const targetDate = c.target_date || "2026-12-31T00:00:00";
  const time = useCountdown(targetDate);

  const units = [
    { value: time.days, label: localizedContent({ label: { en: "Days", ar: "يوم" } }, "label", locale) },
    { value: time.hours, label: localizedContent({ label: { en: "Hours", ar: "ساعة" } }, "label", locale) },
    { value: time.minutes, label: localizedContent({ label: { en: "Minutes", ar: "دقيقة" } }, "label", locale) },
    { value: time.seconds, label: localizedContent({ label: { en: "Seconds", ar: "ثانية" } }, "label", locale) },
  ];

  return (
    <section className="py-16 sm:py-24" style={{ background: "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-heading)" }}>
          {localizedContent(c, "title", locale) || t("countdownTitle")}
        </h2>
        {localizedContent(c, "subtitle", locale) ? (
          <p className="text-lg text-white/80 mb-10">{localizedContent(c, "subtitle", locale)}</p>
        ) : null}
        <div className="flex justify-center gap-4 sm:gap-8 mb-10">
          {units.map((u, i) => (
            <div key={i} className="w-20 sm:w-28 h-20 sm:h-28 rounded-2xl flex flex-col items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
              <span className="text-3xl sm:text-5xl font-bold text-white">{String(u.value).padStart(2, "0")}</span>
              <span className="text-xs sm:text-sm text-white/70 mt-1">{u.label}</span>
            </div>
          ))}
        </div>
        {(c.cta_text || c.cta_url) && (
          <a href={c.cta_url || "#"} className="inline-block px-8 py-3 rounded-xl font-semibold text-lg transition-all" style={{ backgroundColor: "var(--color-background)", color: "var(--color-primary)" }}>
            {c.cta_text || t("countdownCta")}
          </a>
        )}
      </div>
    </section>
  );
}
