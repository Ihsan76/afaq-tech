"use client";

import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function CodeSection({ content }: { content?: Record<string, any> }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {localizedContent(c, "title", locale) && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {localizedContent(c, "title", locale)}
            </h2>
          </div>
        )}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
          {c.language && (
            <div className="px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}>
              {c.language}
            </div>
          )}
          <pre className="p-6 overflow-x-auto text-sm leading-relaxed" style={{ backgroundColor: "#1e1e2e", color: "#cdd6f4", margin: 0 }}>
            <code>{c.code || "// Write your code here\nconsole.log('Hello, World!');"}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
