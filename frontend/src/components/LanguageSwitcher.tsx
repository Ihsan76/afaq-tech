"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, localeFlags } from "@/i18n/config";
import { useLanguages } from "@/lib/useLanguages";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { languages } = useLanguages();
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

  const routable = languages.filter((l) => locales.includes(l.code as (typeof locales)[number]));
  const fallback = locales.filter((l) => !languages.some((lang) => lang.code === l));

  const displayList = [
    ...routable.map((l) => ({ code: l.code, label: l.native_name || l.name, flag: l.flag || "🌐" })),
    ...fallback.map((l) => ({ code: l, label: localeNames[l] || l, flag: localeFlags[l] || "🌐" })),
  ];

  const current = displayList.find((l) => l.code === currentLocale);
  const currentFlag = current?.flag || "🌐";
  const currentLabel = current?.label || currentLocale;

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
        <span className="text-base">{currentFlag}</span>
        <span>{currentLabel}</span>
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden z-50 py-1"
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
            {displayList.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleChange(locale.code)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: locale.code === currentLocale ? "var(--color-primary-light)" : "transparent",
                  color: locale.code === currentLocale ? "var(--color-primary)" : "var(--color-text)",
                }}
                onMouseEnter={(e) => {
                  if (locale.code !== currentLocale) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  if (locale.code !== currentLocale) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span className="text-lg">{locale.flag}</span>
                <span className="flex-1 text-start">{locale.label}</span>
                {locale.code === currentLocale && (
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
