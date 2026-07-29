"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

export default function DemoShowcase({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [host, setHost] = useState("afaq.app");
  useEffect(() => { setHost(window.location.host); }, []);
  const c = content || {};

  return (
    <section id="demo" className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 animate-fade-in-up" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale) || t("demoTitle")}
          </h2>
          <p className="text-lg animate-fade-in-up delay-100" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale) || t("demoSubtitle")}
          </p>
        </div>

        <div className="animate-scale-in delay-200 rounded-3xl overflow-hidden" style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px var(--color-border)" }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-surface-alt)", borderBottom: "1px solid var(--color-border)" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28CA41" }} />
            </div>
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-lg text-xs" style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-success)" }}>🔒</span>
                {host}/lesson-plans/new
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8" style={{ backgroundColor: "var(--color-surface)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                <span className="text-white text-sm font-bold">آ</span>
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{t("demoNewPlan")}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("demoSubjectLabel")}</label>
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>📐 الرياضيات — الصف السادس</div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("demoTopicLabel")}</label>
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>{t("demoTopicValue")}</div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("demoDescLabel")}</label>
              <div className="px-4 py-3 rounded-2xl text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", backgroundColor: "var(--color-background)" }}>{t("demoDescValue")}</div>
            </div>

            <div className="mt-6 p-5 rounded-2xl" style={{ backgroundColor: "var(--color-primary-light)", border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>{t("demoAIOutput")}</span>
              </div>
              <div className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {[t("demoOutput1"), t("demoOutput2"), t("demoOutput3"), t("demoOutput4")].map((out: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color: "var(--color-success)" }}>✓</span>
                    <span>{out}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
