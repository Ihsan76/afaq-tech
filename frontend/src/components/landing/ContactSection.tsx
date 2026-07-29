"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";
import { api } from "@/lib/api";

interface ContactSectionProps {
  content?: Record<string, any>;
  styles?: Record<string, any>;
}

export default function ContactSection({ content, styles }: ContactSectionProps) {
  const t = useTranslations("contact");
  const tLanding = useTranslations("landing");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const heading = localizedContent(c, "heading", locale);
  const subtitle = localizedContent(c, "subtitle", locale);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    service_interest: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      await api.post("/contact/submit/", form);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "", service_interest: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border focus:ring-2 transition-all outline-none";
  const inputStyle = {
    background: "var(--color-surface)",
    color: "var(--color-text)",
    borderColor: "var(--color-border)",
  };
  const focusCls = "focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]";

  return (
    <section
      className="py-16 sm:py-20"
      style={{
        background: styles?.background || "var(--color-background)",
        padding: styles?.padding || undefined,
      }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {heading && (
          <h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
          >
            {heading}
          </h2>
        )}
        {subtitle && (
          <p className="text-center mb-10" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>
        )}

        {status === "success" && (
          <div
            className="p-4 rounded-xl mb-6 text-center font-medium"
            style={{ background: "var(--color-success-light, #d4edda)", color: "var(--color-success, #155724)" }}
          >
            ✓ {t("success")}
          </div>
        )}

        {status === "error" && (
          <div
            className="p-4 rounded-xl mb-6 text-center font-medium"
            style={{ background: "var(--color-error-light, #fee)", color: "var(--color-error, #d00)" }}
          >
            {t("error")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("name")} *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`${inputCls} ${focusCls}`}
                style={inputStyle}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("email")} *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} ${focusCls}`}
                style={inputStyle}
                placeholder={t("emailPlaceholder")}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("phone")}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${inputCls} ${focusCls}`}
                style={inputStyle}
                placeholder={t("phonePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("serviceInterest")}
              </label>
              <select
                value={form.service_interest}
                onChange={(e) => setForm({ ...form, service_interest: e.target.value })}
                className={`${inputCls} ${focusCls}`}
                style={inputStyle}
              >
                <option value="">{tCommon("none")}</option>
                <option value="web_design">{tLanding("serviceWebDesign")}</option>
                <option value="social_media">{tLanding("serviceSocialMedia")}</option>
                <option value="landing_pages">{tLanding("serviceLandingPages")}</option>
                <option value="forms">{tLanding("serviceForms")}</option>
                <option value="ebooks">{tLanding("serviceEbooks")}</option>
                <option value="academy">{tLanding("serviceAcademy")}</option>
                <option value="ads">{tLanding("serviceAds")}</option>
                <option value="branding">{tLanding("serviceBranding")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {t("subject")}
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={`${inputCls} ${focusCls}`}
              style={inputStyle}
              placeholder={t("subjectPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {t("message")} *
            </label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`${inputCls} resize-none ${focusCls}`}
              style={inputStyle}
              placeholder={t("messagePlaceholder")}
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--btn-primary-bg, var(--color-primary))",
              color: "var(--btn-primary-color, white)",
              boxShadow: "var(--btn-shadow)",
            }}
          >
            {status === "sending" ? t("sending") : t("send")}
          </button>
        </form>
      </div>
    </section>
  );
}
