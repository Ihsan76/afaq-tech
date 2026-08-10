"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  announcements: any[];
  sections: any[];
  schoolId: string | null;
  refresh: () => void;
}

export default function AdminAnnouncementsView({ announcements, sections, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annEmergency, setAnnEmergency] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    try {
      await api.post("/schools/announcements/", {
        title: annTitle,
        content: annBody,
        is_emergency: annEmergency,
        school: sections[0]?.school || Number(schoolId) || 1,
      });
      setAnnTitle("");
      setAnnBody("");
      setAnnEmergency(false);
      setBanner({ type: "success", text: t("bannerAnnPublished") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerAnnFailed") });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${surfaceCls} lg:col-span-1`} style={surfaceStyle}>
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          {t("annHeading")}
        </h3>
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">{t("annTitleLabel")}</label>
            <input
              type="text"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
              style={{ borderColor: "var(--color-border)" }}
              placeholder={t("annTitlePlaceholder")}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">{t("annBodyLabel")}</label>
            <textarea
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
              style={{ borderColor: "var(--color-border)" }}
              placeholder={t("annBodyPlaceholder")}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emergency"
              checked={annEmergency}
              onChange={(e) => setAnnEmergency(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="emergency" className="text-xs font-bold text-rose-600">
              {t("annEmergencyLabel")}
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: annEmergency ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("annPublish")}
          </button>
        </form>
      </div>

      <div className={`${surfaceCls} lg:col-span-2`} style={surfaceStyle}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("annListHeading")}
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("announcementsCount", { count: announcements.length })}
          </span>
        </div>
        <Banner banner={banner} />
        {announcements.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("annEmpty")}
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann: any) => (
              <div key={ann.id} className={`p-4 rounded-2xl border bg-[var(--color-background)] ${ann.is_emergency ? "border-rose-500/50 bg-rose-500/5" : ""}`} style={{ borderColor: ann.is_emergency ? undefined : "var(--color-border)" }}>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    {ann.is_emergency && <span className="px-2 py-0.5 rounded text-xs bg-rose-500 text-white">{t("emergencyBadge")}</span>}
                    {ann.title}
                  </h4>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{ann.created_at?.split("T")[0]}</span>
                </div>
                <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{ann.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
