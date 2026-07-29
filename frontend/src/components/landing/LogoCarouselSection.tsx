"use client";

import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function LogoCarouselSection({ content }: { content?: Record<string, any> }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const defaultLogos = [
    { name: "Partner 1", url: "" },
    { name: "Partner 2", url: "" },
    { name: "Partner 3", url: "" },
    { name: "Partner 4", url: "" },
    { name: "Partner 5", url: "" },
    { name: "Partner 6", url: "" },
  ];

  const logos = c.logos || defaultLogos;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-surface-alt)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {localizedContent(c, "title", locale) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="overflow-hidden">
          <div className="flex gap-8 sm:gap-12 items-center animate-[scroll_20s_linear_infinite]" style={{ width: "max-content" }}>
            {[...logos, ...logos].map((logo: any, i: number) => (
              <div key={i} className="flex-shrink-0 w-28 sm:w-36 h-16 flex items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                {logo.url ? (
                  <img src={logo.url} alt={logo.name} className="max-h-10 max-w-full object-contain" />
                ) : (
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{logo.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
