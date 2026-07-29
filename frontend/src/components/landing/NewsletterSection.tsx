"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";
import { api } from "@/lib/api";

interface NewsletterSectionProps {
  content?: Record<string, any>;
}

export default function NewsletterSection({ content }: NewsletterSectionProps) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await api.post("/newsletter/subscribe/", { email, locale });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-surface-alt)" }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}
        >
          {localizedContent(c, "title", locale) || t("newsletterTitle")}
        </h2>
        <p className="text-base mb-8" style={{ color: "var(--color-text-muted)" }}>
          {localizedContent(c, "subtitle", locale) || t("newsletterSubtitle")}
        </p>

        {status === "success" && (
          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-success)" }}
          >
            <p className="font-semibold" style={{ color: "var(--color-success)" }}>
              {localizedContent(c, "success", locale) || t("newsletterSuccess")}
            </p>
          </div>
        )}

        {status === "error" && (
          <div
            className="p-4 rounded-xl mb-4 text-center font-medium"
            style={{ background: "var(--color-error-light, #fee)", color: "var(--color-error, #d00)" }}
          >
            {t("newsletterError")}
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={localizedContent(c, "placeholder", locale) || t("newsletterPlaceholder")}
              required
              disabled={status === "sending"}
              className="flex-1 px-5 py-3 rounded-xl text-sm border transition-all outline-none disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              {status === "sending" ? "..." : localizedContent(c, "button", locale) || t("newsletterButton")}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
