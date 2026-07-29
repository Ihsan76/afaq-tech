"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames } from "@/i18n/config";

const FLAG: Record<string, string> = {
  ar: "🇸🇦", en: "🇬🇧", fr: "🇫🇷", tr: "🇹🇷", ur: "🇵🇰",
  es: "🇪🇸", de: "🇩🇪", id: "🇮🇩", bn: "🇧🇩",
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = pathname.split("/")[1] || "en";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5"
        style={{
          backgroundColor: open ? "var(--color-primary-light)" : "transparent",
          color: "var(--color-text-secondary)",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "var(--color-muted)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span className="text-base">{FLAG[currentLocale] || "🌐"}</span>
        <span>{currentLocale}</span>
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden z-50 py-1"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
            right: 0,
          }}
        >
          <div className="p-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold px-2" style={{ color: "var(--color-text-muted)" }}>Language</p>
          </div>
          <div className="p-1 max-h-72 overflow-y-auto">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleChange(locale)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: locale === currentLocale ? "var(--color-primary-light)" : "transparent",
                  color: locale === currentLocale ? "var(--color-primary)" : "var(--color-text)",
                }}
                onMouseEnter={(e) => {
                  if (locale !== currentLocale) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  if (locale !== currentLocale) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span className="text-lg">{FLAG[locale] || "🌐"}</span>
                <span className="flex-1 text-start">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <svg className="w-4 h-4" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
