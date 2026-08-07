"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { localizedContent, type Locale } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });
const PageBlockPreview = dynamic(() => import("@/components/landing/PageBlockPreview"), { ssr: false });

interface Block {
  id: number; block_type: string;
  content: any; styles: any; layout: any; animation: any;
  is_active: boolean; order: number;
}

const inputCls = "w-full px-3 py-2 border rounded-xl text-sm transition-all focus:ring-2";
const labelCls = "text-xs font-semibold mb-1 block";
const sectionCls = "p-3 rounded-xl border mb-3";

const BLOCK_TO_SECTION: Record<string, string> = {
  services_showcase: "services", services: "services",
  features: "features", pricing: "pricing",
  testimonials: "testimonials", faq: "faq", contact: "contact",
  how_it_works: "how_it_works", platform_how_it_works: "how_it_works",
  stats: "stats", platform_stats: "stats",
  portfolio: "portfolio", cta: "cta",
  partners: "partners", demo: "demo",
};

const ALL_SECTIONS = [
  { id: "services", label_ar: "قسم الخدمات", label_en: "Services Section" },
  { id: "features", label_ar: "قسم الميزات", label_en: "Features Section" },
  { id: "pricing", label_ar: "قسم التسعير", label_en: "Pricing Section" },
  { id: "testimonials", label_ar: "قسم الشهادات", label_en: "Testimonials Section" },
  { id: "faq", label_ar: "قسم الأسئلة الشائعة", label_en: "FAQ Section" },
  { id: "contact", label_ar: "قسم تواصل معنا", label_en: "Contact Section" },
  { id: "how_it_works", label_ar: "قسم كيف نعمل", label_en: "How It Works Section" },
  { id: "stats", label_ar: "قسم الإحصائيات", label_en: "Stats Section" },
  { id: "portfolio", label_ar: "قسم معرض الأعمال", label_en: "Portfolio Section" },
  { id: "cta", label_ar: "قسم الدعوة للعمل", label_en: "CTA Section" },
  { id: "partners", label_ar: "قسم الشركاء", label_en: "Partners Section" },
  { id: "demo", label_ar: "قسم العرض التوضيحي", label_en: "Demo Section" },
];

const COMMON_PAGES = [
  { value: "", label_ar: "اختر...", label_en: "Select..." },
  { value: "/academy", label_ar: "الأكاديمية", label_en: "Academy" },
  { value: "/curriculum", label_ar: "المناهج الدراسية", label_en: "Curriculum" },
  { value: "/register", label_ar: "إنشاء حساب", label_en: "Register" },
  { value: "/login", label_ar: "تسجيل الدخول", label_en: "Login" },
  { value: "/admin/pages", label_ar: "إدارة الصفحات", label_en: "Admin Pages" },
];

function Field({ label, value, onChange, placeholder, type = "input", rows, dir }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: "input" | "textarea" | "rich"; rows?: number; dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{label}</label>
      {type === "rich" ? (
        <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} dir={dir || "ltr"} />
      ) : type === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows || 2}
          className={inputCls + " resize-none"} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
      )}
    </div>
  );
}

function LinkField({ label, value, onChange, placeholder, ar, pageBlocks }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; ar: boolean; pageBlocks?: any[];
}) {
  const isSection = value?.startsWith("#");
  const isPage = value?.startsWith("/");
  const isCustom = !isSection && !isPage && value !== "";
  const availableSections = (pageBlocks || []).map((b: any) => BLOCK_TO_SECTION[b.block_type]).filter(Boolean).filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i).map((id: string) => ALL_SECTIONS.find((s) => s.id === id)!).filter(Boolean);

  return (
    <div className="space-y-2">
      <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{label}</label>
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface-alt)" }}>
        <button type="button" onClick={() => { const first = availableSections[0]; if (first) onChange(`#${first.id}`); }} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isSection ? 'text-white' : ''}`} style={{ background: isSection ? "var(--color-primary)" : "transparent", color: isSection ? "white" : "var(--color-text-muted)" }}>{ar ? "قسم داخلي" : "Section"}</button>
        <button type="button" onClick={() => { if (isSection || isCustom) onChange("/academy"); }} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isPage ? 'text-white' : ''}`} style={{ background: isPage ? "var(--color-primary)" : "transparent", color: isPage ? "white" : "var(--color-text-muted)" }}>{ar ? "صفحة" : "Page"}</button>
        <button type="button" onClick={() => onChange("https://")} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isCustom ? 'text-white' : ''}`} style={{ background: isCustom ? "var(--color-primary)" : "transparent", color: isCustom ? "white" : "var(--color-text-muted)" }}>{ar ? "رابط خارجي" : "External"}</button>
      </div>
      {isSection && <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>{availableSections.length === 0 && <option value="">{ar ? "لا توجد أقسام" : "No sections"}</option>}{availableSections.map((s) => (<option key={s.id} value={`#${s.id}`}>{ar ? s.label_ar : s.label_en}</option>))}</select>}
      {isPage && <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>{COMMON_PAGES.map((p) => (<option key={p.value} value={p.value}>{ar ? p.label_ar : p.label_en}</option>))}</select>}
      {(isCustom || (!isSection && !isPage && value)) && <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "https://..."} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)} className="w-10 h-5 rounded-full transition-all relative flex-shrink-0" style={{ background: checked ? "var(--color-primary)" : "var(--color-surface-alt)" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all" style={{ left: checked ? "22px" : "2px" }} />
      </button>
      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
    </label>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border mb-3" style={{ borderColor: "var(--color-border)" }}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold" style={{ color: "var(--color-text)" }}>
        {title}
        <span className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

function renderContentFields(block: Block, updateContent: (k: string, v: any) => void, ar: boolean, pageBlocks: any[], contentLocale: string) {
  const c = block.content || {};
  const t = (arText: string, enText: string) => ar ? arText : enText;
  const FieldWrap = (props: any) => <Field {...props} />;
  const LinkWrap = (props: any) => <LinkField {...props} ar={ar} pageBlocks={pageBlocks} />;
  const ToggleWrap = (props: any) => <Toggle {...props} />;

  // Helper: update a nested locale field in content
  // Supports both content.field.en and content.translations.field.en
  const updateLocaleField = (field: string, locale: string, value: any) => {
    if (c.translations && typeof c.translations === "object" && c.translations[field]) {
      const current = c.translations[field] && typeof c.translations[field] === "object" ? c.translations[field] : {};
      const newTranslations = { ...c.translations, [field]: { ...current, [locale]: value } };
      updateContent("translations", newTranslations);
    } else {
      const current = c[field] && typeof c[field] === "object" ? c[field] : {};
      updateContent(field, { ...current, [locale]: value });
    }
  };

  // Helper: get value from nested locale field
  // Supports both content.field.en and content.translations.field.en
  const lf = (field: string, loc?: string) => {
    const l = loc || contentLocale;
    return c.translations?.[field]?.[l] || c[field]?.[l] || "";
  };

  // Helper: update a nested locale field inside an array item
  // Supports both item.field.en and item.translations.field.en
  const updateListItemLocale = (listKey: string, index: number, itemField: string, locale: string, value: any) => {
    const list = [...(c[listKey] || [])];
    const item = { ...(list[index] || {}) };
    if (item.translations && typeof item.translations === "object" && item.translations[itemField]) {
      const current = item.translations[itemField] && typeof item.translations[itemField] === "object" ? item.translations[itemField] : {};
      item.translations = { ...item.translations, [itemField]: { ...current, [locale]: value } };
    } else {
      const current = item[itemField] && typeof item[itemField] === "object" ? item[itemField] : {};
      item[itemField] = { ...current, [locale]: value };
    }
    list[index] = item;
    updateContent(listKey, list);
  };

  // Helper: get value from nested locale field in array item
  // Supports both item.field.en and item.translations.field.en
  const lfItem = (listKey: string, index: number, itemField: string, loc?: string) => {
    const l = loc || contentLocale;
    const item = c[listKey]?.[index];
    return item?.translations?.[itemField]?.[l] || item?.[itemField]?.[l] || "";
  };

  switch (block.block_type) {
    case "platform_hero":
    case "hero":
      return (
        <>
          <Section title={t("العنوان الرئيسي", "Main Heading")}>
            <FieldWrap label={t("العنوان", "Heading")} value={lf("heading")} onChange={(v: string) => updateLocaleField("heading", contentLocale, v)} />
          </Section>
          <Section title={t("النص الفرعي", "Subtitle")}>
            <FieldWrap label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v: string) => updateLocaleField("subtitle", contentLocale, v)} />
          </Section>
          <Section title={t("الزر الرئيسي", "Primary Button")}>
            <FieldWrap label={t("نص الزر", "Button Text")} value={lf("cta_text")} onChange={(v: string) => updateLocaleField("cta_text", contentLocale, v)} placeholder={t("ابدأ رحلتك", "Get Started")} />
            <LinkWrap label={t("رابط الزر", "Button URL")} value={lf("cta_link")} onChange={(v: string) => updateLocaleField("cta_link", contentLocale, v)} placeholder="/register" />
          </Section>
          <Section title={t("الزر الثانوي", "Secondary Button")}>
            <FieldWrap label={t("نص الزر", "Button Text")} value={lf("secondary_cta")} onChange={(v: string) => updateLocaleField("secondary_cta", contentLocale, v)} placeholder={t("استكشف الخدمات", "Explore Services")} />
            <LinkWrap label={t("رابط الزر", "Button URL")} value={lf("secondary_cta_link")} onChange={(v: string) => updateLocaleField("secondary_cta_link", contentLocale, v)} placeholder="#services" />
          </Section>
          <Section title={t("الشارات والخيارات", "Badges & Options")}>
            <ToggleWrap label={t("إظهار الجسيمات", "Show Particles")} checked={c.show_particles !== false} onChange={(v: boolean) => updateContent("show_particles", v)} />
            <ToggleWrap label={t("إظهار الشارة", "Show Badge")} checked={c.show_badge !== false} onChange={(v: boolean) => updateContent("show_badge", v)} />
          </Section>
        </>
      );

    case "platform_stats":
    case "stats":
      return (
        <Section title={t("الإحصائيات", "Statistics")} defaultOpen>
          {(c.items || [{}, {}, {}, {}]).map((item: any, i: number) => (
            <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الإحصائية", "Stat")} {i + 1}</p>
                <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
              </div>
              <FieldWrap label={t("القيمة", "Value")} value={item.value || ""} onChange={(v: string) => { const it = [...(c.items || [])]; it[i] = { ...it[i], value: v }; updateContent("items", it); }} placeholder="10,000+" />
              <FieldWrap label={t("التسمية", "Label")} value={lfItem("items", i, "label")} onChange={(v: string) => updateListItemLocale("items", i, "label", contentLocale, v)} />
            </div>
          ))}
          <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة إحصائية", "Add Stat")}</button>
        </Section>
      );

    case "platform_how_it_works":
    case "how_it_works":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الخطوات", "Steps")} defaultOpen>
            {(c.steps || [{}, {}, {}]).map((step: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--color-primary)" }}>{t("الخطوة", "Step")} {i + 1}</p>
                <FieldWrap label={t("الأيقونة", "Icon")} value={step.icon || ""} onChange={(v: string) => { const st = [...(c.steps || [])]; st[i] = { ...st[i], icon: v }; updateContent("steps", st); }} placeholder="💬" />
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("steps", i, "title")} onChange={(v: string) => updateListItemLocale("steps", i, "title", contentLocale, v)} />
                <FieldWrap label={t("الوصف", "Description")} value={lfItem("steps", i, "desc")} onChange={(v: string) => updateListItemLocale("steps", i, "desc", contentLocale, v)} type="textarea" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("steps", [...(c.steps || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة خطوة", "Add Step")}</button>
          </Section>
        </>
      );

    case "services_showcase":
    case "services":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الخدمات", "Services")} defaultOpen>
            {(c.services || [{}, {}, {}, {}]).map((svc: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الخدمة", "Service")} {i + 1}</p>
                  <button type="button" onClick={() => { const sv = [...(c.services || [])]; sv.splice(i, 1); updateContent("services", sv); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الأيقونة", "Icon")} value={svc.icon || ""} onChange={(v: string) => { const sv = [...(c.services || [])]; sv[i] = { ...sv[i], icon: v }; updateContent("services", sv); }} placeholder="🌐" />
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("services", i, "title")} onChange={(v: string) => updateListItemLocale("services", i, "title", contentLocale, v)} />
                <FieldWrap label={t("الوصف", "Description")} value={lfItem("services", i, "desc")} onChange={(v: string) => updateListItemLocale("services", i, "desc", contentLocale, v)} type="textarea" />
                <FieldWrap label={t("الرابط", "URL")} value={svc.url || ""} onChange={(v: string) => { const sv = [...(c.services || [])]; sv[i] = { ...sv[i], url: v }; updateContent("services", sv); }} placeholder="/services/web-design" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("services", [...(c.services || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة خدمة", "Add Service")}</button>
          </Section>
        </>
      );

    case "features":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الميزات", "Features")} defaultOpen>
            {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الميزة", "Feature")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v: string) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="⭐" />
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v: string) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                <FieldWrap label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v: string) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="textarea" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة ميزة", "Add Feature")}</button>
          </Section>
        </>
      );

    case "faq":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الأسئلة والأجوبة", "Q&A")} defaultOpen>
            {(c.items || [{}, {}, {}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("السؤال", "Q")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("السؤال", "Question")} value={lfItem("items", i, "q")} onChange={(v: string) => updateListItemLocale("items", i, "q", contentLocale, v)} />
                <FieldWrap label={t("الجواب", "Answer")} value={lfItem("items", i, "a")} onChange={(v: string) => updateListItemLocale("items", i, "a", contentLocale, v)} type="textarea" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة سؤال", "Add Question")}</button>
          </Section>
        </>
      );

    case "cta":
      return (
        <Section title={t("دعوة للعمل", "Call to Action")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v: string) => updateLocaleField("subtitle", contentLocale, v)} type="textarea" />
          <FieldWrap label={t("نص الزر", "Button Text")} value={lf("cta_button") || lf("button")} onChange={(v: string) => updateLocaleField("cta_button", contentLocale, v)} />
          <LinkWrap label={t("رابط الزر", "Button URL")} value={lf("cta_button_url") || lf("button_url")} onChange={(v: string) => updateLocaleField("cta_button_url", contentLocale, v)} placeholder="/register" />
        </Section>
      );

    case "testimonials":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الشهادات", "Testimonials")} defaultOpen>
            {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الشهادة", "Testimonial")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الاسم", "Name")} value={lfItem("items", i, "name")} onChange={(v: string) => updateListItemLocale("items", i, "name", contentLocale, v)} />
                <FieldWrap label={t("الدور", "Role")} value={lfItem("items", i, "role")} onChange={(v: string) => updateListItemLocale("items", i, "role", contentLocale, v)} />
                <FieldWrap label={t("النص", "Text")} value={lfItem("items", i, "text")} onChange={(v: string) => updateListItemLocale("items", i, "text", contentLocale, v)} type="textarea" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة شهادة", "Add Testimonial")}</button>
          </Section>
        </>
      );

    case "pricing":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الباقات", "Plans")} defaultOpen>
            {(c.plans || [{}, {}, {}]).map((plan: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الباقة", "Plan")} {i + 1}</p>
                  <button type="button" onClick={() => { const p = [...(c.plans || [])]; p.splice(i, 1); updateContent("plans", p); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الاسم", "Name")} value={lfItem("plans", i, "name")} onChange={(v: string) => updateListItemLocale("plans", i, "name", contentLocale, v)} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldWrap label={t("السعر", "Price")} value={plan.price || ""} onChange={(v: string) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], price: v }; updateContent("plans", p); }} placeholder="9.99" />
                  <FieldWrap label={t("الفترة", "Period")} value={plan.period || ""} onChange={(v: string) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], period: v }; updateContent("plans", p); }} placeholder={t("شهرياً", "monthly")} />
                </div>
                <FieldWrap label={t("العلامة", "Badge")} value={lfItem("plans", i, "badge")} onChange={(v: string) => updateListItemLocale("plans", i, "badge", contentLocale, v)} placeholder={t("الأكثر شيوعاً", "Popular")} />
                <ToggleWrap label={t("مميز", "Highlighted")} checked={plan.highlighted || false} onChange={(v: boolean) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], highlighted: v }; updateContent("plans", p); }} />
                <FieldWrap label={t("المميزات (سطر لكل ميزة)", "Features (one per line)")} value={(plan.features || []).join("\n")} onChange={(v: string) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], features: v.split("\n").filter(Boolean) }; updateContent("plans", p); }} type="textarea" rows={4} />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("plans", [...(c.plans || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة باقة", "Add Plan")}</button>
          </Section>
        </>
      );

    case "portfolio":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("المشاريع", "Projects")} defaultOpen>
            {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("المشروع", "Project")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v: string) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                <FieldWrap label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v: string) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="textarea" />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة مشروع", "Add Project")}</button>
          </Section>
        </>
      );

    case "text":
      return (
        <Section title={t("النص", "Text Content")} defaultOpen>
          <FieldWrap label={t("المحتوى", "Content")} value={lf("content")} onChange={(v: string) => updateLocaleField("content", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
        </Section>
      );

    case "accordion":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("الأقسام", "Sections")} defaultOpen>
            {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("القسم", "Section")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v: string) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="🔒" />
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v: string) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                <FieldWrap label={t("المحتوى", "Content")} value={lfItem("items", i, "desc")} onChange={(v: string) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة قسم", "Add Section")}</button>
          </Section>
        </>
      );

    case "tabs":
      return (
        <>
          <Section title={t("العنوان", "Title")}>
            <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          </Section>
          <Section title={t("التبويبات", "Tabs")} defaultOpen>
            {(c.tabs || [{}, {}, {}]).map((tab: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("التبويب", "Tab")} {i + 1}</p>
                  <button type="button" onClick={() => { const t2 = [...(c.tabs || [])]; t2.splice(i, 1); updateContent("tabs", t2); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("الأيقونة", "Icon")} value={tab.icon || ""} onChange={(v: string) => { const t2 = [...(c.tabs || [])]; t2[i] = { ...t2[i], icon: v }; updateContent("tabs", t2); }} placeholder="🎨" />
                <FieldWrap label={t("العنوان", "Title")} value={lfItem("tabs", i, "title")} onChange={(v: string) => updateListItemLocale("tabs", i, "title", contentLocale, v)} />
                <FieldWrap label={t("المحتوى", "Content")} value={lfItem("tabs", i, "content")} onChange={(v: string) => updateListItemLocale("tabs", i, "content", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("tabs", [...(c.tabs || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة تبويب", "Add Tab")}</button>
          </Section>
        </>
      );

    case "demo":
      return (
        <Section title={t("العرض التوضيحي", "Demo")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v: string) => updateLocaleField("subtitle", contentLocale, v)} />
        </Section>
      );

    case "grade_showcase":
    case "subjects_grid":
    case "partners":
      return (
        <Section title={t("العنوان", "Title")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>{t("يتم تحميل البيانات تلقائياً", "Data is loaded automatically from the database")}</p>
        </Section>
      );

    case "contact":
      return (
        <Section title={t("تواصل معنا", "Contact")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("البريد الإلكتروني", "Email")} value={c.email || ""} onChange={(v: string) => updateContent("email", v)} />
          <FieldWrap label={t("الهاتف", "Phone")} value={c.phone || ""} onChange={(v: string) => updateContent("phone", v)} />
          <FieldWrap label={t("العنوان (الموقع)", "Address")} value={c.address || ""} onChange={(v: string) => updateContent("address", v)} />
        </Section>
      );

    case "spacer":
      return (
        <Section title={t("المسافة", "Spacer")} defaultOpen>
          <FieldWrap label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 60)} onChange={(v: string) => updateContent("height", parseInt(v) || 60)} />
        </Section>
      );

    case "divider":
      return (
        <Section title={t("الفاصل", "Divider")} defaultOpen>
          <FieldWrap label={t("اللون", "Color")} value={c.color || ""} onChange={(v: string) => updateContent("color", v)} placeholder="var(--color-border)" />
          <FieldWrap label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 1)} onChange={(v: string) => updateContent("height", parseInt(v) || 1)} />
        </Section>
      );

    case "image":
      return (
        <Section title={t("الصورة", "Image")} defaultOpen>
          <FieldWrap label={t("رابط الصورة", "Image URL")} value={c.image_url || ""} onChange={(v: string) => updateContent("image_url", v)} placeholder="https://..." />
          <FieldWrap label={t("النص البديل", "Alt Text")} value={lf("alt")} onChange={(v: string) => updateLocaleField("alt", contentLocale, v)} />
          <FieldWrap label={t("الرابط", "Link URL")} value={c.link_url || ""} onChange={(v: string) => updateContent("link_url", v)} />
        </Section>
      );

    case "video":
      return (
        <Section title={t("الفيديو", "Video")} defaultOpen>
          <FieldWrap label={t("رابط الفيديو", "Video URL")} value={c.video_url || ""} onChange={(v: string) => updateContent("video_url", v)} placeholder="https://youtube.com/..." />
          <FieldWrap label={t("صورة مصغرة", "Thumbnail URL")} value={c.thumbnail_url || ""} onChange={(v: string) => updateContent("thumbnail_url", v)} />
        </Section>
      );

    case "custom_html":
      return (
        <Section title={t("HTML مخصص", "Custom HTML")} defaultOpen>
          <FieldWrap label="HTML" value={c.html || ""} onChange={(v: string) => updateContent("html", v)} type="textarea" rows={10} />
        </Section>
      );

    case "team":
      return (
        <Section title={t("الفريق", "Team")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          {(c.members || [{}, {}]).map((m: any, i: number) => (
            <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
              <FieldWrap label={t("الاسم", "Name")} value={lfItem("members", i, "name")} onChange={(v: string) => updateListItemLocale("members", i, "name", contentLocale, v)} />
              <FieldWrap label={t("الدور", "Role")} value={lfItem("members", i, "role")} onChange={(v: string) => updateListItemLocale("members", i, "role", contentLocale, v)} />
              <FieldWrap label={t("الصورة", "Photo URL")} value={m.photo || ""} onChange={(v: string) => { const mb = [...(c.members || [])]; mb[i] = { ...mb[i], photo: v }; updateContent("members", mb); }} />
            </div>
          ))}
          <button type="button" onClick={() => updateContent("members", [...(c.members || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة عضو", "Add Member")}</button>
        </Section>
      );

    case "newsletter":
      return (
        <Section title={t("الاشتراك البريدي", "Newsletter")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v: string) => updateLocaleField("subtitle", contentLocale, v)} type="textarea" />
          <FieldWrap label={t("الزر", "Button")} value={lf("button")} onChange={(v: string) => updateLocaleField("button", contentLocale, v)} />
          <FieldWrap label={t("النجاح", "Success Message")} value={lf("success")} onChange={(v: string) => updateLocaleField("success", contentLocale, v)} />
        </Section>
      );

    case "map":
      return (
        <Section title={t("الخريطة", "Map")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("رابط Google Maps", "Google Maps Embed URL")} value={c.embed_url || ""} onChange={(v: string) => updateContent("embed_url", v)} placeholder="https://www.google.com/maps/embed?..." />
          <FieldWrap label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 400)} onChange={(v: string) => updateContent("height", parseInt(v) || 400)} />
        </Section>
      );

    case "blog_list":
      return (
        <Section title={t("قائمة المدونة", "Blog List")} defaultOpen>
          <FieldWrap label={t("العنوان", "Title")} value={lf("title")} onChange={(v: string) => updateLocaleField("title", contentLocale, v)} />
          <FieldWrap label={t("عدد المقالات", "Posts Limit")} value={String(c.limit || 6)} onChange={(v: string) => updateContent("limit", parseInt(v) || 6)} />
        </Section>
      );

    case "chat_greeting":
      return (
        <>
          <Section title={t("العنوان الرئيسي", "Main Heading")}>
            <FieldWrap label={t("العنوان", "Heading")} value={lf("heading")} onChange={(v: string) => updateLocaleField("heading", contentLocale, v)} />
          </Section>
          <Section title={t("النص الفرعي", "Subtitle")}>
            <FieldWrap label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v: string) => updateLocaleField("subtitle", contentLocale, v)} />
          </Section>
          <Section title={t("الاقتراحات", "Suggestions")} defaultOpen>
            {(c.items || [{}, {}, {}, {}]).map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("اقتراح", "Suggestion")} {i + 1}</p>
                  <button type="button" onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <FieldWrap label={t("النص", "Text")} value={lfItem("items", i, "text")} onChange={(v: string) => updateListItemLocale("items", i, "text", contentLocale, v)} />
              </div>
            ))}
            <button type="button" onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>+ {t("إضافة اقتراح", "Add Suggestion")}</button>
          </Section>
        </>
      );

    default:
      return (
        <Section title={t("البيانات", "Data")} defaultOpen>
          <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{t("محتوى JSON", "Content JSON")}</label>
          <textarea
            value={JSON.stringify(c, null, 2)}
            onChange={(e) => { try { /* will be handled by parent */ } catch {} }}
            className={inputCls + " resize-none font-mono text-xs"}
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)", minHeight: "150px" }}
            rows={8}
          />
        </Section>
      );
  }
}

function renderStyleFields(block: Block, updateStyle: (k: string, v: any) => void, ar: boolean) {
  const s = block.styles || {};
  const t = (arText: string, enText: string) => ar ? arText : enText;
  const FieldWrap = (props: any) => <Field {...props} />;

  return (
    <>
      <Section title={t("الخلفية", "Background")} defaultOpen>
        <FieldWrap label={t("لون الخلفية", "Background Color")} value={s.background || ""} onChange={(v: string) => updateStyle("background", v)} placeholder="var(--color-surface)" />
        <FieldWrap label={t("صورة الخلفية", "Background Image")} value={s.backgroundImage || ""} onChange={(v: string) => updateStyle("backgroundImage", v)} placeholder="url(...)" />
        <FieldWrap label={t("تدرج الخلفية", "Gradient")} value={s.gradient || ""} onChange={(v: string) => updateStyle("gradient", v)} placeholder="linear-gradient(...)" />
      </Section>
      <Section title={t("النص", "Text")}>
        <FieldWrap label={t("لون النص", "Text Color")} value={s.color || ""} onChange={(v: string) => updateStyle("color", v)} placeholder="var(--color-text)" />
        <FieldWrap label={t("حجم الخط", "Font Size")} value={s.fontSize || ""} onChange={(v: string) => updateStyle("fontSize", v)} placeholder="16px" />
        <FieldWrap label={t("محاذاة النص", "Text Align")} value={s.textAlign || ""} onChange={(v: string) => updateStyle("textAlign", v)} placeholder="center / left / right" />
      </Section>
      <Section title={t("المسافات", "Spacing")}>
        <div className="grid grid-cols-2 gap-2">
          <FieldWrap label={t("حشوة علوية", "Padding Top")} value={s.paddingTop || ""} onChange={(v: string) => updateStyle("paddingTop", v)} placeholder="40px" />
          <FieldWrap label={t("حشوة سفلية", "Padding Bottom")} value={s.paddingBottom || ""} onChange={(v: string) => updateStyle("paddingBottom", v)} placeholder="40px" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <FieldWrap label={t("هامش علوي", "Margin Top")} value={s.marginTop || ""} onChange={(v: string) => updateStyle("marginTop", v)} placeholder="0" />
          <FieldWrap label={t("هامش سفلي", "Margin Bottom")} value={s.marginBottom || ""} onChange={(v: string) => updateStyle("marginBottom", v)} placeholder="0" />
        </div>
      </Section>
      <Section title={t("الحدود والأحجام", "Border & Sizing")}>
        <FieldWrap label={t("نصف قطر الحد", "Border Radius")} value={s.borderRadius || ""} onChange={(v: string) => updateStyle("borderRadius", v)} placeholder="16px" />
        <FieldWrap label={t("الظل", "Box Shadow")} value={s.boxShadow || ""} onChange={(v: string) => updateStyle("boxShadow", v)} placeholder="var(--card-shadow)" />
        <FieldWrap label={t("العرض الأقصى", "Max Width")} value={s.maxWidth || ""} onChange={(v: string) => updateStyle("maxWidth", v)} placeholder="1200px" />
      </Section>
      <Section title={t("CSS مخصص", "Custom CSS")}>
        <FieldWrap label="CSS Variables" value={s.customCss || ""} onChange={(v: string) => updateStyle("customCss", v)} type="textarea" rows={3} placeholder="--color-primary: #..." />
      </Section>
    </>
  );
}

export default function BlockEditorModal({
  block, pageBlocks, onSave, onClose,
}: {
  block: Block; pageBlocks: any[]; onSave: (updated: Block) => void; onClose: () => void;
}) {
  const locale = useLocale();
  const ar = locale === "ar";
  const ti = useTranslations();
  const t = (arText: string, enText: string) => ar ? arText : enText;
  const [form, setForm] = useState<Block>({ ...block });
  const [tab, setTab] = useState<"content" | "style">("content");
  const [contentLocale, setContentLocale] = useState<string>(locale);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateContent = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, content: { ...prev.content, [key]: value } }));
  };

  const updateStyle = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, styles: { ...prev.styles, [key]: value } }));
  };

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => {
      onSave(form);
      setSaveSuccess(false);
    }, 600);
  };

  const BLOCK_TYPES: Record<string, { label: string; icon: string }> = {
    platform_hero: { label: "بطل الصفحة (المنصة)", icon: "🏢" },
    platform_stats: { label: "إحصائيات (المنصة)", icon: "📈" },
    platform_how_it_works: { label: "كيف تعمل (المنصة)", icon: "🔄" },
    services_showcase: { label: "عرض الخدمات", icon: "🔧" },
    hero: { label: "بطل الصفحة", icon: "🎯" },
    stats: { label: "إحصائيات", icon: "📊" },
    features: { label: "الميزات", icon: "⭐" },
    how_it_works: { label: "كيف يعمل", icon: "🔄" },
    demo: { label: "عرض توضيحي", icon: "🖥️" },
    testimonials: { label: "شهادات", icon: "💬" },
    pricing: { label: "التسعير", icon: "💰" },
    faq: { label: "أسئلة شائعة", icon: "❓" },
    cta: { label: "دعوة للعمل", icon: "📢" },
    text: { label: "نص", icon: "📝" },
    image: { label: "صورة", icon: "🖼️" },
    accordion: { label: "أقسام قابلة للطي", icon: "🔽" },
    tabs: { label: "تبويبات", icon: "📑" },
    blog_list: { label: "قائمة المدونة", icon: "📝" },
    chat_greeting: { label: "ترحيب المساعد الذكي", icon: "🤖" },
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.6)" }}>
      {/* Left: Form */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--color-surface)" }}>
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{BLOCK_TYPES[block.block_type]?.icon || "📦"}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text)" }}>{BLOCK_TYPES[block.block_type]?.label || block.block_type}</h3>
               <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{`#${block.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-xl px-2" style={{ color: "var(--color-text-muted)" }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={() => setTab("content")} className="flex-1 px-4 py-2.5 text-sm font-bold transition-all" style={{ color: tab === "content" ? "var(--color-primary)" : "var(--color-text-muted)", borderBottom: tab === "content" ? "2px solid var(--color-primary)" : "2px solid transparent" }}>
            📝 {t("المحتوى", "Content")}
          </button>
          <button onClick={() => setTab("style")} className="flex-1 px-4 py-2.5 text-sm font-bold transition-all" style={{ color: tab === "style" ? "var(--color-primary)" : "var(--color-text-muted)", borderBottom: tab === "style" ? "2px solid var(--color-primary)" : "2px solid transparent" }}>
            🎨 {t("المظهر", "Style")}
          </button>
        </div>

        {/* Scrollable Fields */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {tab === "content" && (
              <div className="mb-3">
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{t("اللغة", "Language")}</label>
                <select value={contentLocale} onChange={(e) => setContentLocale(e.target.value)}
                  className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
                  {locales.map((loc) => (
                    <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{t("العنوان", "Title")} ({contentLocale.toUpperCase()})</label>
              <input value={form.content?.title?.[contentLocale] || ""} onChange={(e) => updateContent("title", { ...form.content?.title, [contentLocale]: e.target.value })} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
            </div>

            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => updateField("is_active", !form.is_active)} className="w-11 h-6 rounded-full transition-all relative flex-shrink-0" style={{ background: form.is_active ? "var(--color-primary)" : "var(--color-surface-alt)" }}>
                <div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all" style={{ left: form.is_active ? "22px" : "2px" }} />
              </button>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{form.is_active ? t("نشط", "Active") : t("مخفي", "Hidden")}</span>
            </div>

            {tab === "content"
              ? renderContentFields(form, updateContent, ar, pageBlocks, contentLocale)
              : renderStyleFields(form, updateStyle, ar)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex gap-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all text-sm" style={{ background: saveSuccess ? "var(--color-success)" : "var(--color-primary)" }}>
            {saving ? "..." : saveSuccess ? "✓ " + t("تم الحفظ", "Saved") : t("💾 حفظ التعديلات", "Save Changes")}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-semibold border text-sm" style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}>
            {t("إلغاء", "Cancel")}
          </button>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="hidden lg:flex w-[420px] flex-col flex-shrink-0 border-l" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
        <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>👁️ {t("المعاينة المباشرة", "Live Preview")}</span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{BLOCK_TYPES[block.block_type]?.icon} {BLOCK_TYPES[block.block_type]?.label}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--card-shadow)" }}>
            <PageBlockPreview blocks={[form]} />
          </div>
        </div>
      </div>
    </div>
  );
}
