"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  sections: any[];
  refresh: () => void;
}

export default function AdminSectionsView({ sections, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const updateCapacity = async (id: number, capacity: number) => {
    if (capacity < 1) return;
    try {
      await api.patch(`/schools/sections/${id}/`, { capacity });
      setBanner({ type: "success", text: t("bannerCapacityUpdated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerCapacityError") });
    }
  };

  return (
    <div className={surfaceCls} style={surfaceStyle}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {t("sectionsHeading")}
        </h3>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
          {t("sectionsCount", { count: sections.length })}
        </span>
      </div>

      <Banner banner={banner} />

      {sections.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
          {t("sectionsEmpty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec: any) => (
            <div key={sec.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
              <h4 className="font-bold text-lg">{sec.name}</h4>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("gradeLabel")} {sec.grade_name || sec.grade}
              </p>
              <div className="mt-4 flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                  {t("studentsCount", { count: sec.students_count || 0 })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {t("capacityLabel")}:
                  </span>
                  <button
                    onClick={() => updateCapacity(sec.id, (sec.capacity || 30) - 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    −
                  </button>
                  <span className="text-sm font-extrabold w-8 text-center">{sec.capacity ?? 30}</span>
                  <button
                    onClick={() => updateCapacity(sec.id, (sec.capacity || 30) + 1)}
                    className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
