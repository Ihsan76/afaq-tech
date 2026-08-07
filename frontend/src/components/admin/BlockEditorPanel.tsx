"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { locales, localeNames } from "@/i18n/config";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false });

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
  features: "features",
  pricing: "pricing",
  testimonials: "testimonials",
  faq: "faq",
  contact: "contact",
  how_it_works: "how_it_works", platform_how_it_works: "how_it_works",
  stats: "stats", platform_stats: "stats",
  portfolio: "portfolio",
  cta: "cta",
  partners: "partners",
  demo: "demo",
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
  { value: "/dashboard", label_ar: "لوحة التحكم", label_en: "Dashboard" },
  { value: "/profile", label_ar: "الملف الشخصي", label_en: "Profile" },
  { value: "/lesson-plans", label_ar: "خطط الدروس", label_en: "Lesson Plans" },
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

  const availableSections = (pageBlocks || [])
    .map((b: any) => BLOCK_TO_SECTION[b.block_type])
    .filter(Boolean)
    .filter((id: string, i: number, arr: string[]) => arr.indexOf(id) === i)
    .map((id: string) => ALL_SECTIONS.find((s) => s.id === id)!)
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{label}</label>
      {/* Type Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface-alt)" }}>
        <button type="button" onClick={() => { const first = availableSections[0]; if (first) onChange(`#${first.id}`); }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isSection ? 'text-white' : ''}`}
          style={{ background: isSection ? "var(--color-primary)" : "transparent", color: isSection ? "white" : "var(--color-text-muted)" }}>
          {ar ? "قسم داخلي" : "Page Section"}
        </button>
        <button type="button" onClick={() => { if (isSection || isCustom) onChange("/academy"); }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isPage ? 'text-white' : ''}`}
          style={{ background: isPage ? "var(--color-primary)" : "transparent", color: isPage ? "white" : "var(--color-text-muted)" }}>
          {ar ? "صفحة" : "Page"}
        </button>
        <button type="button" onClick={() => onChange("https://")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${isCustom || (!isSection && !isPage && value) ? 'text-white' : ''}`}
          style={{ background: isCustom ? "var(--color-primary)" : "transparent", color: isCustom ? "white" : "var(--color-text-muted)" }}>
          {ar ? "رابط خارجي" : "External URL"}
        </button>
      </div>
      {/* Section Selector */}
      {isSection && (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
          {availableSections.length === 0 && <option value="">{ar ? "لا توجد أقسام في الصفحة" : "No sections on this page"}</option>}
          {availableSections.map((s) => (
            <option key={s.id} value={`#${s.id}`}>{ar ? s.label_ar : s.label_en}</option>
          ))}
        </select>
      )}
      {/* Page Selector */}
      {isPage && (
        <select value={value} onChange={(e) => onChange(e.target.value)}
          className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
          {COMMON_PAGES.map((p) => (
            <option key={p.value} value={p.value}>{ar ? p.label_ar : p.label_en}</option>
          ))}
        </select>
      )}
      {/* Custom URL Input */}
      {(isCustom || (!isSection && !isPage && value)) && (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://..."}
          className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
      )}
      {/* Hidden input for when nothing is selected */}
      {!isSection && !isPage && !value && (
        <div className="flex gap-2">
          {availableSections.length > 0 && (
            <button type="button" onClick={() => { const first = availableSections[0]; if (first) onChange(`#${first.id}`); }}
              className="flex-1 py-2 rounded-xl border border-dashed text-xs font-bold transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
              {ar ? "اختر قسم" : "Choose Section"}
            </button>
          )}
          <button type="button" onClick={() => onChange("/academy")}
            className="flex-1 py-2 rounded-xl border border-dashed text-xs font-bold transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            {ar ? "اختر صفحة" : "Choose Page"}
          </button>
          <button type="button" onClick={() => onChange("https://")}
            className="flex-1 py-2 rounded-xl border border-dashed text-xs font-bold transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            {ar ? "رابط خارجي" : "External"}
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
        style={{ background: checked ? "var(--color-primary)" : "var(--color-surface-alt)" }}>
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
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold" style={{ color: "var(--color-text)" }}>
        {title}
        <span className="transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function BlockEditorPanel({
  block, onUpdate, onSave, onFetch, saving, saveSuccess, onClose, pageBlocks = [],
}: {
  block: Block;
  onUpdate: (field: string, value: any) => void;
  onSave: () => void;
  onFetch: () => void;
  saving: boolean;
  saveSuccess: boolean;
  onClose: () => void;
  pageBlocks?: any[];
}) {
  const locale = useLocale();
  const ar = locale === "ar";
  const [tab, setTab] = useState<"content" | "style">("content");
  const [contentLocale, setContentLocale] = useState<string>(locale);
  const c = block.content || {};
  const s = block.styles || {};

  const updateContent = (key: string, value: any) => {
    onUpdate("content", { ...c, [key]: value });
  };

  const updateStyle = (key: string, value: any) => {
    onUpdate("styles", { ...s, [key]: value });
  };

  const inputStyle = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const t = (arText: string, enText: string) => ar ? arText : enText;

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

  const renderContentFields = () => {
    switch (block.block_type) {
      case "platform_hero":
      case "hero":
        return (
          <>
            <Section title={t("العنوان الرئيسي", "Main Heading")}>
              <Field label={t("العنوان", "Heading")} value={lf("heading")} onChange={(v) => updateLocaleField("heading", contentLocale, v)} />
            </Section>
            <Section title={t("النص الفرعي", "Subtitle")}>
              <Field label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v) => updateLocaleField("subtitle", contentLocale, v)} />
            </Section>
            <Section title={t("الزر الرئيسي", "Primary Button")}>
              <Field label={t("نص الزر", "Button Text")} value={lf("cta_text")} onChange={(v) => updateLocaleField("cta_text", contentLocale, v)} placeholder={t("ابدأ رحلتك", "Get Started")} />
              <LinkField label={t("رابط الزر", "Button URL")} value={lf("cta_link")} onChange={(v) => updateLocaleField("cta_link", contentLocale, v)} placeholder="/register" ar={ar} pageBlocks={pageBlocks} />
            </Section>
            <Section title={t("الزر الثانوي", "Secondary Button")}>
              <Field label={t("نص الزر", "Button Text")} value={lf("secondary_cta")} onChange={(v) => updateLocaleField("secondary_cta", contentLocale, v)} placeholder={t("استكشف الخدمات", "Explore Services")} />
              <LinkField label={t("رابط الزر", "Button URL")} value={lf("secondary_cta_link")} onChange={(v) => updateLocaleField("secondary_cta_link", contentLocale, v)} placeholder="#services" ar={ar} pageBlocks={pageBlocks} />
            </Section>
            <Section title={t("الشارات والخيارات", "Badges & Options")}>
              <Toggle label={t("إظهار الجسيمات", "Show Particles")} checked={c.show_particles !== false} onChange={(v) => updateContent("show_particles", v)} />
              <Toggle label={t("إظهار الشارة", "Show Badge")} checked={c.show_badge !== false} onChange={(v) => updateContent("show_badge", v)} />
              {c.badges?.map((_: any, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <Field label={`${t("شارة", "Badge")} ${i + 1}`} value={lfItem("badges", i, "text")} onChange={(v) => updateListItemLocale("badges", i, "text", contentLocale, v)} />
                </div>
              ))}
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
                  <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
                <Field label={t("القيمة", "Value")} value={item.value || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], value: v }; updateContent("items", it); }} placeholder="10,000+" />
                <Field label={t("التسمية", "Label")} value={lfItem("items", i, "label")} onChange={(v) => updateListItemLocale("items", i, "label", contentLocale, v)} />
              </div>
            ))}
            <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
              + {t("إضافة إحصائية", "Add Stat")}
            </button>
          </Section>
        );

      case "platform_how_it_works":
      case "how_it_works":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الخطوات", "Steps")} defaultOpen>
              {(c.steps || [{}, {}, {}]).map((step: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: "var(--color-primary)" }}>{t("الخطوة", "Step")} {i + 1}</p>
                  <Field label={t("الأيقونة", "Icon")} value={step.icon || ""} onChange={(v) => { const st = [...(c.steps || [])]; st[i] = { ...st[i], icon: v }; updateContent("steps", st); }} placeholder="💬" />
                  <Field label={t("العنوان", "Title")} value={lfItem("steps", i, "title")} onChange={(v) => updateListItemLocale("steps", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("steps", i, "desc")} onChange={(v) => updateListItemLocale("steps", i, "desc", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("steps", [...(c.steps || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة خطوة", "Add Step")}
              </button>
            </Section>
          </>
        );

      case "services_showcase":
      case "services":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الخدمات", "Services")} defaultOpen>
              {(c.services || [{}, {}, {}, {}]).map((svc: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الخدمة", "Service")} {i + 1}</p>
                    <button onClick={() => { const sv = [...(c.services || [])]; sv.splice(i, 1); updateContent("services", sv); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الأيقونة", "Icon")} value={svc.icon || ""} onChange={(v) => { const sv = [...(c.services || [])]; sv[i] = { ...sv[i], icon: v }; updateContent("services", sv); }} placeholder="🌐" />
                  <Field label={t("العنوان", "Title")} value={lfItem("services", i, "title")} onChange={(v) => updateListItemLocale("services", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("services", i, "desc")} onChange={(v) => updateListItemLocale("services", i, "desc", contentLocale, v)} type="textarea" />
                  <Field label={t("الرابط", "URL")} value={svc.url || ""} onChange={(v) => { const sv = [...(c.services || [])]; sv[i] = { ...sv[i], url: v }; updateContent("services", sv); }} placeholder="/services/web-design" />
                </div>
              ))}
              <button onClick={() => updateContent("services", [...(c.services || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة خدمة", "Add Service")}
              </button>
            </Section>
          </>
        );

      case "features":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الميزات", "Features")} defaultOpen>
              {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الميزة", "Feature")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="⭐" />
                  <Field label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة ميزة", "Add Feature")}
              </button>
            </Section>
          </>
        );

      case "faq":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الأسئلة والأجوبة", "Q&A")} defaultOpen>
              {(c.items || [{}, {}, {}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("السؤال", "Q")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("السؤال", "Question")} value={lfItem("items", i, "q")} onChange={(v) => updateListItemLocale("items", i, "q", contentLocale, v)} />
                  <Field label={t("الجواب", "Answer")} value={lfItem("items", i, "a")} onChange={(v) => updateListItemLocale("items", i, "a", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة سؤال", "Add Question")}
              </button>
            </Section>
          </>
        );

      case "cta":
        return (
          <Section title={t("دعوة للعمل", "Call to Action")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v) => updateLocaleField("subtitle", contentLocale, v)} type="textarea" />
            <Field label={t("نص الزر", "Button Text")} value={lf("cta_button") || lf("button")} onChange={(v) => updateLocaleField("cta_button", contentLocale, v)} />
            <LinkField label={t("رابط الزر", "Button URL")} value={lf("cta_button_url") || lf("button_url")} onChange={(v) => updateLocaleField("cta_button_url", contentLocale, v)} placeholder="/register" ar={ar} pageBlocks={pageBlocks} />
          </Section>
        );

      case "testimonials":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الشهادات", "Testimonials")} defaultOpen>
              {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الشهادة", "Testimonial")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الاسم", "Name")} value={lfItem("items", i, "name")} onChange={(v) => updateListItemLocale("items", i, "name", contentLocale, v)} />
                  <Field label={t("الدور", "Role")} value={lfItem("items", i, "role")} onChange={(v) => updateListItemLocale("items", i, "role", contentLocale, v)} />
                  <Field label={t("النص", "Text")} value={lfItem("items", i, "text")} onChange={(v) => updateListItemLocale("items", i, "text", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة شهادة", "Add Testimonial")}
              </button>
            </Section>
          </>
        );

      case "pricing":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الباقات", "Plans")} defaultOpen>
              {(c.plans || [{}, {}, {}]).map((plan: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الباقة", "Plan")} {i + 1}</p>
                    <button onClick={() => { const p = [...(c.plans || [])]; p.splice(i, 1); updateContent("plans", p); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الاسم", "Name")} value={lfItem("plans", i, "name")} onChange={(v) => updateListItemLocale("plans", i, "name", contentLocale, v)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={t("السعر", "Price")} value={plan.price || ""} onChange={(v) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], price: v }; updateContent("plans", p); }} placeholder="9.99" />
                    <Field label={t("الفترة", "Period")} value={plan.period || ""} onChange={(v) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], period: v }; updateContent("plans", p); }} placeholder={t("شهرياً", "monthly")} />
                  </div>
                  <Field label={t("العلامة", "Badge")} value={lfItem("plans", i, "badge")} onChange={(v) => updateListItemLocale("plans", i, "badge", contentLocale, v)} placeholder={t("الأكثر شيوعاً", "Popular")} />
                  <Toggle label={t("مميز", "Highlighted")} checked={plan.highlighted || false} onChange={(v) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], highlighted: v }; updateContent("plans", p); }} />
                  <Field label={t("المميزات (سطر لكل ميزة)", "Features (one per line)")} value={(plan.features || []).join("\n")} onChange={(v) => { const p = [...(c.plans || [])]; p[i] = { ...p[i], features: v.split("\n").filter(Boolean) }; updateContent("plans", p); }} type="textarea" rows={4} />
                </div>
              ))}
              <button onClick={() => updateContent("plans", [...(c.plans || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة باقة", "Add Plan")}
              </button>
            </Section>
          </>
        );

      case "portfolio":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("المشاريع", "Projects")} defaultOpen>
              {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("المشروع", "Project")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة مشروع", "Add Project")}
              </button>
            </Section>
          </>
        );

      case "demo":
        return (
          <Section title={t("العرض التوضيحي", "Demo")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v) => updateLocaleField("subtitle", contentLocale, v)} />
          </Section>
        );

      case "grade_showcase":
      case "subjects_grid":
      case "partners":
        return (
          <Section title={t("العنوان", "Title")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              {t("يتم تحميل البيانات تلقائياً من قاعدة البيانات", "Data is loaded automatically from the database")}
            </p>
          </Section>
        );

      case "text":
        return (
          <Section title={t("النص", "Text Content")} defaultOpen>
            <Field label={t("المحتوى", "Content")} value={lf("content")} onChange={(v) => updateLocaleField("content", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
          </Section>
        );

      case "image":
        return (
          <Section title={t("الصورة", "Image")} defaultOpen>
            <Field label={t("رابط الصورة", "Image URL")} value={c.image_url || ""} onChange={(v) => updateContent("image_url", v)} placeholder="https://..." />
            <Field label={t("النص البديل", "Alt Text")} value={lf("alt")} onChange={(v) => updateLocaleField("alt", contentLocale, v)} />
            <Field label={t("الرابط", "Link URL")} value={c.link_url || ""} onChange={(v) => updateContent("link_url", v)} />
          </Section>
        );

      case "video":
        return (
          <Section title={t("الفيديو", "Video")} defaultOpen>
            <Field label={t("رابط الفيديو", "Video URL")} value={c.video_url || ""} onChange={(v) => updateContent("video_url", v)} placeholder="https://youtube.com/..." />
            <Field label={t("صورة مصغرة", "Thumbnail URL")} value={c.thumbnail_url || ""} onChange={(v) => updateContent("thumbnail_url", v)} />
          </Section>
        );

      case "spacer":
        return (
          <Section title={t("المسافة", "Spacer")} defaultOpen>
            <Field label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 60)} onChange={(v) => updateContent("height", parseInt(v) || 60)} />
          </Section>
        );

      case "divider":
        return (
          <Section title={t("الفاصل", "Divider")} defaultOpen>
            <Field label={t("اللون", "Color")} value={c.color || ""} onChange={(v) => updateContent("color", v)} placeholder="var(--color-border)" />
            <Field label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 1)} onChange={(v) => updateContent("height", parseInt(v) || 1)} />
          </Section>
        );

      case "contact":
        return (
          <Section title={t("تواصل معنا", "Contact")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("البريد الإلكتروني", "Email")} value={c.email || ""} onChange={(v) => updateContent("email", v)} />
            <Field label={t("الهاتف", "Phone")} value={c.phone || ""} onChange={(v) => updateContent("phone", v)} />
            <Field label={t("العنوان (الموقع)", "Address")} value={c.address || ""} onChange={(v) => updateContent("address", v)} />
          </Section>
        );

      case "team":
        return (
          <Section title={t("الفريق", "Team")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            {(c.members || [{}, {}]).map((m: any, i: number) => (
              <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                <Field label={t("الاسم", "Name")} value={lfItem("members", i, "name")} onChange={(v) => updateListItemLocale("members", i, "name", contentLocale, v)} />
                <Field label={t("الدور", "Role")} value={lfItem("members", i, "role")} onChange={(v) => updateListItemLocale("members", i, "role", contentLocale, v)} />
                <Field label={t("الصورة", "Photo URL")} value={m.photo || ""} onChange={(v) => { const mb = [...(c.members || [])]; mb[i] = { ...mb[i], photo: v }; updateContent("members", mb); }} />
              </div>
            ))}
            <button onClick={() => updateContent("members", [...(c.members || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
              + {t("إضافة عضو", "Add Member")}
            </button>
          </Section>
        );

      case "custom_html":
        return (
          <Section title={t("HTML مخصص", "Custom HTML")} defaultOpen>
            <Field label="HTML" value={c.html || ""} onChange={(v) => updateContent("html", v)} type="textarea" rows={10} />
          </Section>
        );

      case "accordion":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الأقسام", "Sections")} defaultOpen>
              {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("القسم", "Section")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="🔒" />
                  <Field label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                  <Field label={t("المحتوى", "Content")} value={lfItem("items", i, "desc")} onChange={(v) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة قسم", "Add Section")}
              </button>
            </Section>
          </>
        );

      case "tabs":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("التبويبات", "Tabs")} defaultOpen>
              {(c.tabs || [{}, {}, {}]).map((tabItem: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("التبويب", "Tab")} {i + 1}</p>
                    <button onClick={() => { const tl = [...(c.tabs || [])]; tl.splice(i, 1); updateContent("tabs", tl); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الأيقونة", "Icon")} value={tabItem.icon || ""} onChange={(v) => { const tl = [...(c.tabs || [])]; tl[i] = { ...tl[i], icon: v }; updateContent("tabs", tl); }} placeholder="🎨" />
                  <Field label={t("العنوان", "Title")} value={lfItem("tabs", i, "title")} onChange={(v) => updateListItemLocale("tabs", i, "title", contentLocale, v)} />
                  <Field label={t("المحتوى", "Content")} value={lfItem("tabs", i, "content")} onChange={(v) => updateListItemLocale("tabs", i, "content", contentLocale, v)} type="rich" dir={contentLocale === "ar" ? "rtl" : "ltr"} />
                </div>
              ))}
              <button onClick={() => updateContent("tabs", [...(c.tabs || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة تبويب", "Add Tab")}
              </button>
            </Section>
          </>
        );

      case "timeline":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الحدث", "Events")} defaultOpen>
              {(c.items || [{}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الحدث", "Event")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("التاريخ", "Date")} value={lfItem("items", i, "date")} onChange={(v) => updateListItemLocale("items", i, "date", contentLocale, v)} />
                  <Field label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="🚀" />
                  <Field label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v) => updateListItemLocale("items", i, "desc", contentLocale, v)} type="textarea" />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة حدث", "Add Event")}
              </button>
            </Section>
          </>
        );

      case "countdown":
        return (
          <Section title={t("العداد التنازلي", "Countdown")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v) => updateLocaleField("subtitle", contentLocale, v)} />
            <Field label={t("التاريخ المستهدف", "Target Date")} value={c.target_date || ""} onChange={(v) => updateContent("target_date", v)} placeholder="2026-12-31T00:00:00" />
            <Field label={t("نص الزر", "CTA Text")} value={lf("cta_text") || lf("button")} onChange={(v) => updateLocaleField("cta_text", contentLocale, v)} />
            <LinkField label={t("رابط الزر", "CTA URL")} value={lf("cta_url") || lf("button_url")} onChange={(v) => updateLocaleField("cta_url", contentLocale, v)} ar={ar} pageBlocks={pageBlocks} />
          </Section>
        );

      case "newsletter":
        return (
          <Section title={t("الاشتراك البريدي", "Newsletter")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("النص الفرعي", "Subtitle")} value={lf("subtitle")} onChange={(v) => updateLocaleField("subtitle", contentLocale, v)} type="textarea" />
            <Field label={t("الزر", "Button")} value={lf("button")} onChange={(v) => updateLocaleField("button", contentLocale, v)} />
            <Field label={t("النجاح", "Success Message")} value={lf("success")} onChange={(v) => updateLocaleField("success", contentLocale, v)} />
          </Section>
        );

      case "map":
        return (
          <Section title={t("الخريطة", "Map")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("رابط Google Maps Embed", "Google Maps Embed URL")} value={c.embed_url || ""} onChange={(v) => updateContent("embed_url", v)} placeholder="https://www.google.com/maps/embed?..." />
            <Field label={t("الارتفاع (بكسل)", "Height (px)")} value={String(c.height || 400)} onChange={(v) => updateContent("height", parseInt(v) || 400)} />
          </Section>
        );

      case "table":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("العناوين", "Headers")} defaultOpen>
              {(c.headers || [{}, {}, {}]).map((h: any, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <Field label={`${t("العمود", "Col")} ${i + 1}`} value={lfItem("headers", i, "label")} onChange={(v) => updateListItemLocale("headers", i, "label", contentLocale, v)} />
                  <button onClick={() => { const hd = [...(c.headers || [])]; hd.splice(i, 1); updateContent("headers", hd); }} className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
              ))}
              <button onClick={() => updateContent("headers", [...(c.headers || []), { label: {} }])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة عمود", "Add Column")}
              </button>
            </Section>
            <Section title={t("الصفوف", "Rows")}>
              <Field label={t("البيانات (JSON: [[...], [...]])", "Data (JSON: [[...], [...]])")} value={JSON.stringify(c.rows || [], null, 2)} onChange={(v) => { try { updateContent("rows", JSON.parse(v)); } catch {} }} type="textarea" rows={6} />
            </Section>
          </>
        );

      case "icon_list":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("العناصر", "Items")} defaultOpen>
              {(c.items || [{}, {}, {}]).map((item: any, i: number) => (
                <div key={i} className="flex gap-2 items-end">
                  <Field label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="✅" />
                  <Field label={t("النص", "Text")} value={lfItem("items", i, "text")} onChange={(v) => updateListItemLocale("items", i, "text", contentLocale, v)} />
                  <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), { icon: "✅" }])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة عنصر", "Add Item")}
              </button>
            </Section>
          </>
        );

      case "logo_carousel":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الشعارات", "Logos")} defaultOpen>
              {(c.logos || [{}, {}]).map((logo: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الشعار", "Logo")} {i + 1}</p>
                    <button onClick={() => { const l = [...(c.logos || [])]; l.splice(i, 1); updateContent("logos", l); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الاسم", "Name")} value={logo.name || ""} onChange={(v) => { const l = [...(c.logos || [])]; l[i] = { ...l[i], name: v }; updateContent("logos", l); }} />
                  <Field label={t("رابط الشعار", "Logo URL")} value={logo.url || ""} onChange={(v) => { const l = [...(c.logos || [])]; l[i] = { ...l[i], url: v }; updateContent("logos", l); }} placeholder="https://..." />
                </div>
              ))}
              <button onClick={() => updateContent("logos", [...(c.logos || []), {}])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة شعار", "Add Logo")}
              </button>
            </Section>
          </>
        );

      case "download":
        return (
          <>
            <Section title={t("العنوان", "Title")}>
              <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            </Section>
            <Section title={t("الملفات", "Files")} defaultOpen>
              {(c.items || [{}, {}]).map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border mb-2" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{t("الملف", "File")} {i + 1}</p>
                    <button onClick={() => { const it = [...(c.items || [])]; it.splice(i, 1); updateContent("items", it); }} className="text-xs" style={{ color: "var(--color-error)" }}>✕</button>
                  </div>
                  <Field label={t("الأيقونة", "Icon")} value={item.icon || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], icon: v }; updateContent("items", it); }} placeholder="📄" />
                  <Field label={t("العنوان", "Title")} value={lfItem("items", i, "title")} onChange={(v) => updateListItemLocale("items", i, "title", contentLocale, v)} />
                  <Field label={t("الوصف", "Description")} value={lfItem("items", i, "desc")} onChange={(v) => updateListItemLocale("items", i, "desc", contentLocale, v)} />
                  <Field label={t("رابط التحميل", "Download URL")} value={item.url || ""} onChange={(v) => { const it = [...(c.items || [])]; it[i] = { ...it[i], url: v }; updateContent("items", it); }} placeholder="/downloads/..." />
                </div>
              ))}
              <button onClick={() => updateContent("items", [...(c.items || []), { icon: "📄" }])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                + {t("إضافة ملف", "Add File")}
              </button>
            </Section>
          </>
        );

      case "code":
        return (
          <Section title={t("بلوك كود", "Code Block")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("اللغة", "Language")} value={c.language || ""} onChange={(v) => updateContent("language", v)} placeholder="JavaScript / Python / HTML" />
            <Field label="Code" value={c.code || ""} onChange={(v) => updateContent("code", v)} type="textarea" rows={10} />
          </Section>
        );

      case "gallery":
        return (
          <Section title={t("معرض الصور", "Gallery")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            {(c.images || []).map((img: any, i: number) => (
              <div key={i} className="flex gap-2 items-end">
                <Field label={`${t("صورة", "Image")} ${i + 1}`} value={img.url || ""} onChange={(v) => { const im = [...(c.images || [])]; im[i] = { ...im[i], url: v }; updateContent("images", im); }} />
                <button onClick={() => { const im = [...(c.images || [])]; im.splice(i, 1); updateContent("images", im); }} className="mb-2 text-xs" style={{ color: "var(--color-error)" }}>✕</button>
              </div>
            ))}
            <button onClick={() => updateContent("images", [...(c.images || []), { url: "" }])} className="w-full py-2 rounded-xl border border-dashed text-sm font-bold" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
              + {t("إضافة صورة", "Add Image")}
            </button>
          </Section>
        );

      case "form":
        return (
          <Section title={t("النموذج", "Form")} defaultOpen>
            <Field label={t("العنوان", "Title")} value={lf("title")} onChange={(v) => updateLocaleField("title", contentLocale, v)} />
            <Field label={t("نص الإرسال", "Submit Text")} value={c.submit_text || ""} onChange={(v) => updateContent("submit_text", v)} />
            <Field label={t("الحقول (سطر لكل حقل: label:type)", "Fields (one per line: label:type)")} value={(c.fields || []).map((f: any) => `${f.label || ""}:${f.type || "text"}`).join("\n")} onChange={(v) => updateContent("fields", v.split("\n").filter(Boolean).map((line: string) => { const [label, type] = line.split(":"); return { label, type: type || "text" }; }))} type="textarea" rows={4} />
          </Section>
        );

      default:
        return (
          <Section title={t("البيانات", "Data")} defaultOpen>
            <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{t("محتوى JSON", "Content JSON")}</label>
            <textarea
              value={JSON.stringify(c, null, 2)}
              onChange={(e) => { try { onUpdate("content", JSON.parse(e.target.value)); } catch {} }}
              className={inputCls + " resize-none font-mono text-xs"}
              style={{ ...inputStyle, minHeight: "150px" }}
              rows={8}
            />
          </Section>
        );
    }
  };

  const renderStyleFields = () => (
    <>
      <Section title={t("الخلفية", "Background")} defaultOpen>
        <Field label={t("لون الخلفية", "Background Color")} value={s.background || ""} onChange={(v) => updateStyle("background", v)} placeholder="var(--color-surface)" />
        <Field label={t("صورة الخلفية", "Background Image")} value={s.backgroundImage || ""} onChange={(v) => updateStyle("backgroundImage", v)} placeholder="url(...)" />
        <Field label={t("تدرج الخلفية", "Gradient")} value={s.gradient || ""} onChange={(v) => updateStyle("gradient", v)} placeholder="linear-gradient(...)" />
      </Section>
      <Section title={t("النص", "Text")}>
        <Field label={t("لون النص", "Text Color")} value={s.color || ""} onChange={(v) => updateStyle("color", v)} placeholder="var(--color-text)" />
        <Field label={t("حجم الخط", "Font Size")} value={s.fontSize || ""} onChange={(v) => updateStyle("fontSize", v)} placeholder="16px" />
        <Field label={t("وزن الخط", "Font Weight")} value={s.fontWeight || ""} onChange={(v) => updateStyle("fontWeight", v)} placeholder="400" />
        <Field label={t("محاذاة النص", "Text Align")} value={s.textAlign || ""} onChange={(v) => updateStyle("textAlign", v)} placeholder="center / left / right" />
      </Section>
      <Section title={t("المسافات", "Spacing")}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("حشوة علوية", "Padding Top")} value={s.paddingTop || ""} onChange={(v) => updateStyle("paddingTop", v)} placeholder="40px" />
          <Field label={t("حشوة سفلية", "Padding Bottom")} value={s.paddingBottom || ""} onChange={(v) => updateStyle("paddingBottom", v)} placeholder="40px" />
          <Field label={t("حشوة يسرة", "Padding Left")} value={s.paddingLeft || ""} onChange={(v) => updateStyle("paddingLeft", v)} placeholder="20px" />
          <Field label={t("حشوة يمنى", "Padding Right")} value={s.paddingRight || ""} onChange={(v) => updateStyle("paddingRight", v)} placeholder="20px" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label={t("هامش علوي", "Margin Top")} value={s.marginTop || ""} onChange={(v) => updateStyle("marginTop", v)} placeholder="0" />
          <Field label={t("هامش سفلي", "Margin Bottom")} value={s.marginBottom || ""} onChange={(v) => updateStyle("marginBottom", v)} placeholder="0" />
        </div>
      </Section>
      <Section title={t("الحدود والأحجام", "Border & Sizing")}>
        <Field label={t("نصف قطر الحد", "Border Radius")} value={s.borderRadius || ""} onChange={(v) => updateStyle("borderRadius", v)} placeholder="16px" />
        <Field label={t("حد", "Border")} value={s.border || ""} onChange={(v) => updateStyle("border", v)} placeholder="1px solid var(--color-border)" />
        <Field label={t("الظل", "Box Shadow")} value={s.boxShadow || ""} onChange={(v) => updateStyle("boxShadow", v)} placeholder="var(--card-shadow)" />
        <Field label={t("العرض الأقصى", "Max Width")} value={s.maxWidth || ""} onChange={(v) => updateStyle("maxWidth", v)} placeholder="1200px" />
        <Field label={t("الارتفاع", "Min Height")} value={s.minHeight || ""} onChange={(v) => updateStyle("minHeight", v)} placeholder="400px" />
      </Section>
      <Section title={t("CSS مخصص", "Custom CSS")}>
        <Field label="CSS Variables" value={s.customCss || ""} onChange={(v) => updateStyle("customCss", v)} type="textarea" rows={3} placeholder="--color-primary: #..." />
      </Section>
    </>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{BLOCK_TYPES[block.block_type]?.icon || "📦"}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate" style={{ color: "var(--color-text)" }}>{BLOCK_TYPES[block.block_type]?.label || block.block_type}</h3>
            <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{`#${block.id}`}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-lg px-2 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}>✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => setTab("content")} className="flex-1 px-4 py-2.5 text-sm font-bold transition-all" style={{
          color: tab === "content" ? "var(--color-primary)" : "var(--color-text-muted)",
          borderBottom: tab === "content" ? "2px solid var(--color-primary)" : "2px solid transparent",
        }}>
          📝 {t("المحتوى", "Content")}
        </button>
        <button onClick={() => setTab("style")} className="flex-1 px-4 py-2.5 text-sm font-bold transition-all" style={{
          color: tab === "style" ? "var(--color-primary)" : "var(--color-text-muted)",
          borderBottom: tab === "style" ? "2px solid var(--color-primary)" : "2px solid transparent",
        }}>
          🎨 {t("المظهر", "Style")}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Locale Selector */}
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

          {/* Common title/subtitle field */}
          {tab === "content" && (
            <div className="mb-3">
              <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>{t("العنوان", "Title")} ({contentLocale.toUpperCase()})</label>
              <input value={block.content?.title?.[contentLocale] || ""} onChange={(e) => onUpdate("content", { ...block.content, title: { ...block.content?.title, [contentLocale]: e.target.value } })} className={inputCls} style={inputStyle} />
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
            <button onClick={() => onUpdate("is_active", !block.is_active)}
              className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: block.is_active ? "var(--color-primary)" : "var(--color-surface-alt)" }}>
              <div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all" style={{ left: block.is_active ? "22px" : "2px" }} />
            </button>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{block.is_active ? t("نشط", "Active") : t("مخفي", "Hidden")}</span>
          </div>

          {tab === "content" ? renderContentFields() : renderStyleFields()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all text-sm" style={{ background: saveSuccess ? "var(--color-success)" : "var(--color-primary)" }}>
          {saving ? "..." : saveSuccess ? "✓ " + t("تم الحفظ", "Saved") : t("حفظ", "Save")}
        </button>
      </div>
    </div>
  );
}

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
  grade_showcase: { label: "عرض الصفوف", icon: "📚" },
  subjects_grid: { label: "شبكة المواد", icon: "📐" },
  partners: { label: "الشركاء", icon: "🤝" },
  portfolio: { label: "معرض أعمال", icon: "🖼️" },
  text: { label: "نص", icon: "📝" },
  image: { label: "صورة", icon: "🖼️" },
  video: { label: "فيديو", icon: "🎬" },
  gallery: { label: "معرض صور", icon: "🖼️" },
  contact: { label: "تواصل معنا", icon: "📬" },
  form: { label: "نموذج", icon: "📋" },
  spacer: { label: "مسافة", icon: "↕️" },
  divider: { label: "فاصل", icon: "➖" },
  services: { label: "خدمات", icon: "🔧" },
  team: { label: "الفريق", icon: "👥" },
  accordion: { label: "أقسام قابلة للطي", icon: "🔽" },
  tabs: { label: "تبويبات", icon: "📑" },
  timeline: { label: "خط زمني", icon: "📅" },
  countdown: { label: "عداد تنازلي", icon: "⏰" },
  newsletter: { label: "اشتراك بريد", icon: "✉️" },
  map: { label: "خريطة", icon: "🗺️" },
  table: { label: "جدول بيانات", icon: "📊" },
  icon_list: { label: "قائمة أيقونات", icon: "📋" },
  logo_carousel: { label: "كاروسيل شعارات", icon: "🏢" },
  download: { label: "تحميل ملف", icon: "⬇️" },
  code: { label: "بلوك كود", icon: "💻" },
  custom_html: { label: "HTML مخصص", icon: "💻" },
  blog_list: { label: "قائمة المدونة", icon: "📝" },
};
