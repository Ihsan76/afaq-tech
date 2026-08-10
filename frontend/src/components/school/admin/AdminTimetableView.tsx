"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  sections: any[];
  periods: any[];
  rooms: any[];
  slots: any[];
  refresh: () => void;
}

export default function AdminTimetableView({ sections, periods, rooms, slots, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const autoSchedule = async () => {
    if (sections.length === 0) {
      setBanner({ type: "error", text: t("bannerNoSections") });
      return;
    }
    try {
      const res = await api.post("/schools/timetable-slots/auto_schedule/", {
        school_id: sections[0]?.school,
        academic_year_id: sections[0]?.academic_year,
      });
      setBanner({ type: "success", text: t("bannerScheduled", { count: res.data.created_count }) });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerScheduleError") });
    }
  };

  return (
    <div className={surfaceCls} style={surfaceStyle}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("timetableHeading")}
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {t("timetableSubtitle")}
          </p>
        </div>
        <button
          onClick={autoSchedule}
          className="px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          {t("runAutoScheduler")}
        </button>
      </div>

      <Banner banner={banner} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statPeriods")}</p>
          <p className="text-2xl font-extrabold mt-1">{periods.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statRooms")}</p>
          <p className="text-2xl font-extrabold mt-1">{rooms.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
          <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statSlots")}</p>
          <p className="text-2xl font-extrabold mt-1">{slots.length}</p>
        </div>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
          {t("timetableEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="p-3 text-start">{t("colSection")}</th>
                <th className="p-3 text-start">{t("colDay")}</th>
                <th className="p-3 text-start">{t("colPeriod")}</th>
                <th className="p-3 text-start">{t("colSubject")}</th>
                <th className="p-3 text-start">{t("colTeacher")}</th>
                <th className="p-3 text-start">{t("colRoom")}</th>
              </tr>
            </thead>
            <tbody>
              {slots.slice(0, 15).map((slot: any) => (
                <tr key={slot.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-3 font-bold">{slot.section_name}</td>
                  <td className="p-3">{slot.day_display}</td>
                  <td className="p-3">{slot.period_name}</td>
                  <td className="p-3 font-bold text-[var(--color-primary)]">{slot.subject_name}</td>
                  <td className="p-3">{slot.teacher_name || slot.teacher_email}</td>
                  <td className="p-3">{slot.room_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
