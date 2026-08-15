"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  school: any;
  refresh: () => void;
}

const DAYS = [
  { id: 1, labelKey: "dayMon" },
  { id: 2, labelKey: "dayTue" },
  { id: 3, labelKey: "dayWed" },
  { id: 4, labelKey: "dayThu" },
  { id: 5, labelKey: "dayFri" },
  { id: 6, labelKey: "daySat" },
  { id: 7, labelKey: "daySun" },
];

export default function AdminCalendarSettingsView({ school, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [weekStart, setWeekStart] = useState<number>(school?.week_start || 7);
  const [workingDays, setWorkingDays] = useState<number[]>(
    school?.working_days || [7, 1, 2, 3, 4]
  );
  const [saving, setSaving] = useState(false);

  const toggleDay = (dayId: number) => {
    if (workingDays.includes(dayId)) {
      if (workingDays.length <= 1) {
        setBanner({ type: "error", text: t("errMinWorkingDays") });
        return;
      }
      const next = workingDays.filter((d) => d !== dayId);
      setWorkingDays(next);
      if (weekStart === dayId) {
        setWeekStart(next[0]);
      }
    } else {
      setWorkingDays([...workingDays, dayId].sort((a, b) => a - b));
    }
  };

  const handleSave = async () => {
    if (!school?.id) return;
    setSaving(true);
    try {
      await api.patch(`/schools/schools/${school.id}/calendar/`, {
        week_start: weekStart,
        working_days: workingDays,
      });
      setBanner({ type: "success", text: t("bannerCalendarSaved") });
      refresh();
    } catch (err: any) {
      setBanner({ type: "error", text: err?.response?.data?.error || t("bannerSaveError") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={surfaceCls} style={surfaceStyle}>
      <div className="mb-6">
        <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {t("calendarSettingsHeading")}
        </h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          {t("calendarSettingsSubtitle")}
        </p>
      </div>

      <Banner banner={banner} />

      <div className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-bold mb-2">{t("weekStartLabel")}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DAYS.map((d) => {
              const isWorking = workingDays.includes(d.id);
              const isSelected = weekStart === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!isWorking}
                  onClick={() => setWeekStart(d.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-white shadow-md scale-105"
                      : isWorking
                      ? "bg-[var(--color-background)] hover:border-[var(--color-primary)]"
                      : "opacity-40 cursor-not-allowed bg-[var(--color-background)]"
                  }`}
                  style={{ borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)" }}
                >
                  {t(d.labelKey)}
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
            {t("weekStartHelp")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">{t("workingDaysLabel")}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DAYS.map((d) => {
              const isChecked = workingDays.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all flex items-center justify-between ${
                    isChecked
                      ? "bg-[var(--color-primary)] text-white shadow-md"
                      : "bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"
                  }`}
                  style={{ borderColor: isChecked ? "var(--color-primary)" : "var(--color-border)" }}
                >
                  <span>{t(d.labelKey)}</span>
                  <span>{isChecked ? "✓" : "○"}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--color-text-secondary)" }}>
            {t("workingDaysHelp")}
          </p>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
