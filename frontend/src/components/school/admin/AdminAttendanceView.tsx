"use client";

import { useTranslations } from "next-intl";
import { surfaceCls, surfaceStyle } from "@/components/school/admin/adminUi";

interface Props {
  attendances: any[];
}

export default function AdminAttendanceView({ attendances }: Props) {
  const t = useTranslations("school");

  const statusLabel = (status: string) =>
    status === "present" ? t("statusPresent") : status === "absent" ? t("statusAbsent") : status === "late" ? t("statusLate") : status;

  return (
    <div className={surfaceCls} style={surfaceStyle}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {t("attendanceHeading")}
        </h3>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
          {t("attendanceCount", { count: attendances.length })}
        </span>
      </div>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--color-text-secondary)" }}>
        {t("attendanceSubtitle")}
      </p>

      {attendances.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
          {t("attendanceEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="p-3 text-start">{t("colStudent")}</th>
                <th className="p-3 text-start">{t("colSection")}</th>
                <th className="p-3 text-start">{t("colDate")}</th>
                <th className="p-3 text-start">{t("colStatus")}</th>
                <th className="p-3 text-start">{t("colNotes")}</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map((att: any) => (
                <tr key={att.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                  <td className="p-3 font-bold">{att.student_name || att.student_email}</td>
                  <td className="p-3">{att.section_name || att.section}</td>
                  <td className="p-3">{att.date}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${att.status === "present" ? "bg-emerald-500/10 text-emerald-600" : att.status === "absent" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {statusLabel(att.status)}
                    </span>
                  </td>
                  <td className="p-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{att.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
