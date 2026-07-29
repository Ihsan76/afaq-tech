"use client";

import { localizedContent } from "@/lib/i18n";

export default function TableSection({ content }: { content?: Record<string, any> }) {
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultHeaders = [
    { ar: "الميزة", en: "Feature" },
    { ar: "الأساسي", en: "Basic" },
    { ar: "المتقدّم", en: "Advanced" },
    { ar: "الاحترافي", en: "Professional" },
  ];

  const defaultRows = [
    ["5 صفحات", "25 صفحة", "100 صفحة", "∞"],
    ["1 مستخدم", "5 مستخدمين", "25 مستخدم", "∞"],
    ["دعم بريد", "دعم أولوية", "دعم 24/7", "مدير مخصص"],
  ];

  const headers = c.headers?.map((h: any) => localizedContent(h, "", locale) || (typeof h === "object" ? (h[locale] || h.en || h.ar || "") : h)) || defaultHeaders.map(h => h[locale as keyof typeof h] || h.en || h.ar);
  const rows = c.rows || defaultRows;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-surface-alt)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {(localizedContent(c, "title", locale)) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--color-border)" }}>
          <table className="w-full text-sm" style={{ minWidth: "500px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-primary)" }}>
                {headers.map((h: string, i: number) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-white">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: string[], i: number) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "var(--color-surface)" : "var(--color-surface-alt)" }}>
                  {row.map((cell: string, j: number) => (
                    <td key={j} className="px-4 py-3" style={{ color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
