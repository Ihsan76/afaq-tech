"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";
import TimetableGrid from "./TimetableGrid";

interface Props {
  sections: any[];
  periods: any[];
  rooms: any[];
  slots: any[];
  academicYears?: any[];
  refresh: () => void;
}

export default function AdminTimetableView({ sections, periods, rooms, slots, academicYears = [], refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const currentYear = academicYears[0] || null;
  const roomMode = currentYear?.room_allocation_mode || "fixed";

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
          {currentYear && (
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: roomMode === "fixed" ? "var(--color-primary)/10" : "var(--color-secondary)/10",
                color: roomMode === "fixed" ? "var(--color-primary)" : "var(--color-secondary)",
              }}
            >
              {roomMode === "fixed" ? t("roomModeFixed") : t("roomModeMobility")}
            </span>
          )}
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

      <TimetableGrid
        sections={sections}
        periods={periods}
        rooms={rooms}
        slots={slots}
        academicYears={academicYears}
        refresh={refresh}
      />
    </div>
  );
}
