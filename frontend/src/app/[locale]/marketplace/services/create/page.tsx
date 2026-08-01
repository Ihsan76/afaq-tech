"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface Category { id: number; name: Record<string, string>; icon: string; }
interface ServiceData {
  id?: number; title: Record<string, string>; description: Record<string, string>;
  service_type: string; price: string; currency: string;
  duration_minutes: number; is_online: boolean; location: string;
  max_students: number; category: number | null;
}

const LANGUAGES = [
  { code: "ar", label: "العربية" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "tr", label: "Türkçe" },
  { code: "ur", label: "اردو" }, { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" }, { code: "id", label: "Bahasa Indonesia" },
  { code: "bn", label: "বাংলা" },
];

const SERVICE_TYPES = ["tutoring", "course", "consultation", "other"];

export default function CreateServicePage() {
  const t = useTranslations("servicesMarketplace");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";

  const [categories, setCategories] = useState<Category[]>([]);
  const [titleTr, setTitleTr] = useState<Record<string, string>>({});
  const [descTr, setDescTr] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("ar");
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [serviceType, setServiceType] = useState("tutoring");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [duration, setDuration] = useState(60);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState("");
  const [maxStudents, setMaxStudents] = useState(1);
  const [category, setCategory] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/marketplace/categories/").then(r => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setTitleInput(titleTr[selectedLang] || "");
    setDescInput(descTr[selectedLang] || "");
  }, [selectedLang, titleTr, descTr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleTr["ar"]?.trim()) { setError("العنوان بالعربية مطلوب"); return; }
    setSaving(true); setError("");
    try {
      const payload: ServiceData = {
        title: titleTr, description: descTr,
        service_type: serviceType, price, currency,
        duration_minutes: duration, is_online: isOnline,
        location: isOnline ? "" : location,
        max_students: maxStudents, category,
      };
      await api.post("/marketplace/services/", payload);
      router.push(`/${locale}/marketplace`);
    } catch (e: any) {
      setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-4 py-3 rounded-2xl border focus:ring-2 transition-all text-sm";
  const fieldStyle = { borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" };
  const surfaceStyle = { background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" };
  const titleFilled = LANGUAGES.filter(l => titleTr[l.code]?.trim()).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="text-sm font-medium mb-4 transition-colors" style={{ color: "var(--color-primary)" }}>
          ← {locale === "ar" ? "العودة" : "Back"}
        </button>

        <FadeIn direction="up">
          <div className="rounded-3xl shadow-xl p-6 lg:p-8" style={surfaceStyle}>
            <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("createService")}</h1>

            {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{typeof error === "string" ? error : JSON.stringify(error)}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Basic Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("serviceType")}</label>
                  <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={inputCls} style={fieldStyle}>
                    {SERVICE_TYPES.map(st => <option key={st} value={st}>{t(st)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("categories")}</label>
                  <select value={category || 0} onChange={(e) => setCategory(Number(e.target.value) || null)} className={inputCls} style={fieldStyle}>
                    <option value={0}>{t("allCategories")}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name?.[locale] || c.name?.ar || c.name?.en || ""}</option>)}
                  </select>
                </div>
              </div>

              {/* Title Translations */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("title")}</label>
                <div className="flex gap-3 items-end mb-2">
                  <div className="flex-1">
                    <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className={inputCls} style={fieldStyle}>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label} {titleTr[l.code]?.trim() ? "✅" : ""}</option>)}
                    </select>
                  </div>
                  <div className="flex-[2]">
                    <input type="text" value={titleInput} onChange={(e) => { setTitleInput(e.target.value); setTitleTr(prev => ({ ...prev, [selectedLang]: e.target.value })); }}
                      className={inputCls} style={fieldStyle} dir={selectedLang === "ar" || selectedLang === "ur" ? "rtl" : "ltr"} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {LANGUAGES.map(l => (
                    <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${titleTr[l.code]?.trim() ? "" : "opacity-40"}`}
                      style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                      onClick={() => setSelectedLang(l.code)}>{l.code} {titleTr[l.code]?.trim() ? "✓" : ""}</span>
                  ))}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{titleFilled}/{LANGUAGES.length}</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("description")} ({LANGUAGES.find(l => l.code === selectedLang)?.label})</label>
                <textarea value={descInput} onChange={(e) => { setDescInput(e.target.value); setDescTr(prev => ({ ...prev, [selectedLang]: e.target.value })); }}
                  className={inputCls + " resize-none"} style={fieldStyle} rows={4}
                  dir={selectedLang === "ar" || selectedLang === "ur" ? "rtl" : "ltr"} />
              </div>

              {/* Pricing & Duration */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("price")}</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} style={fieldStyle} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{"العملة"}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} style={fieldStyle}>
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("duration")} ({t("minutes")})</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} style={fieldStyle} required />
                </div>
              </div>

              {/* Online / Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("online")}</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsOnline(true)}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isOnline ? "text-white" : ""}`}
                      style={{ background: isOnline ? "var(--color-primary)" : "var(--color-surface-alt)", color: isOnline ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                      🌐 {t("online")}
                    </button>
                    <button type="button" onClick={() => setIsOnline(false)}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!isOnline ? "text-white" : ""}`}
                      style={{ background: !isOnline ? "var(--color-primary)" : "var(--color-surface-alt)", color: !isOnline ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                      📍 {t("inPerson")}
                    </button>
                  </div>
                </div>
                {!isOnline && (
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{"الموقع"}</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} style={fieldStyle} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("sales")} (max)</label>
                  <input type="number" value={maxStudents} onChange={(e) => setMaxStudents(Number(e.target.value))} className={inputCls} style={fieldStyle} min={1} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                  style={{ background: "var(--btn-primary-bg)" }}>
                  {saving ? "جاري..." : t("createService")}
                </button>
                <button type="button" onClick={() => router.back()}
                  className="px-6 py-2.5 rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
