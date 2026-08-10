"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

const ACTIONS: Record<string, { href: string; icon: string; labelKey: string }[]> = {
  school_admin: [
    { href: "/school/admin/grades", icon: "📚", labelKey: "quickGrades" },
    { href: "/school/admin/teachers", icon: "👩‍🏫", labelKey: "quickTeachers" },
    { href: "/school/admin/sections", icon: "🏫", labelKey: "quickSections" },
    { href: "/school/admin/rooms", icon: "🚪", labelKey: "quickRooms" },
    { href: "/school/admin/timetable", icon: "⚡", labelKey: "quickSchedule" },
    { href: "/school/admin/announcements", icon: "📢", labelKey: "quickBroadcast" },
  ],
  teacher: [
    { href: "/teacher/timetable", icon: "📅", labelKey: "quickMyTimetable" },
    { href: "/teacher/attendance", icon: "🚨", labelKey: "quickRecordAttendance" },
    { href: "/teacher/tickets", icon: "💬", labelKey: "quickMyTickets" },
  ],
  parent: [
    { href: "/parent/children", icon: "👨‍👩‍👧‍👦", labelKey: "quickViewChildren" },
    { href: "/parent/attendance", icon: "📊", labelKey: "quickMyAttendance" },
    { href: "/parent/reports", icon: "📄", labelKey: "quickMyReports" },
  ],
  student: [
    { href: "/student/timetable", icon: "📅", labelKey: "quickMyTimetable" },
    { href: "/student/attendance", icon: "📊", labelKey: "quickMyAttendance" },
    { href: "/student/record", icon: "🎓", labelKey: "quickMyRecord" },
  ],
};

export default function RoleDashboard() {
  const locale = useLocale();
  const t = useTranslations("school");
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [ctx, setCtx] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = !!(user && (user.is_staff || user.role === "admin" || user.role === "developer"));
  // Staff can preview every role workspace; pick the role from the current route
  // (e.g. /teacher => teacher view) so each workspace shows its own dashboard.
  const routeRole = pathname.split("/")[2];
  const viewRole = routeRole === "teacher" || routeRole === "parent" || routeRole === "student"
    ? routeRole
    : (isStaff ? "school_admin" : (user?.role || "school_admin"));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const schoolId = await resolveActiveSchoolId();
      const schoolParam = schoolId ? `?school=${schoolId}` : "";
      const [ctxRes, slotRes] = await Promise.all([
        api.get(`/schools/my-context/${schoolParam}`).catch(() => ({ data: null })),
        api.get(`/schools/timetable-slots/${schoolParam}`).catch(() => ({ data: [] })),
      ]);
      setCtx(ctxRes.data);
      setSlots(Array.isArray(slotRes.data) ? slotRes.data : slotRes.data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const attendance = Array.isArray(ctx?.attendance) ? ctx.attendance : [];
  const present = attendance.filter((a: any) => a.status === "present").length;
  const total = attendance.length;
  const attendanceRate = total ? Math.round((present / total) * 100) : 0;

  const stats: { label: string; val: number | string; icon: string; color: string }[] = (() => {
    if (viewRole === "teacher") {
      return [
        { label: t("kpiMyClasses"), val: ctx?.sections?.length ?? 0, icon: "📚", color: "from-emerald-500 to-teal-600" },
        { label: t("kpiTodaySlots"), val: slots.length, icon: "📅", color: "from-blue-500 to-indigo-600" },
        { label: t("kpiOpenTickets"), val: (ctx?.tickets || []).filter((tk: any) => !tk.is_resolved).length, icon: "💬", color: "from-amber-500 to-orange-600" },
      ];
    }
    if (viewRole === "parent") {
      return [
        { label: t("kpiMyChildren"), val: ctx?.children?.length ?? 0, icon: "👨‍👩‍👧‍👦", color: "from-amber-500 to-orange-600" },
        { label: t("kpiPresentToday"), val: present, icon: "✅", color: "from-emerald-500 to-teal-600" },
        { label: t("kpiWeeklyReports"), val: ctx?.weekly_reports?.length ?? 0, icon: "📄", color: "from-blue-500 to-indigo-600" },
      ];
    }
    if (viewRole === "student") {
      return [
        { label: t("kpiMySections"), val: ctx?.sections?.length ?? 0, icon: "🏫", color: "from-blue-500 to-indigo-600" },
        { label: t("kpiTodaySlots"), val: slots.length, icon: "📅", color: "from-emerald-500 to-teal-600" },
        { label: t("kpiAttendanceRate"), val: `${attendanceRate}%`, icon: "📊", color: "from-amber-500 to-orange-600" },
      ];
    }
    return [
      { label: t("kpiSchools"), val: ctx?.schools?.length ?? 1, icon: "🏫", color: "from-blue-500 to-indigo-600" },
      { label: t("kpiSections"), val: ctx?.sections?.length ?? 0, icon: "📚", color: "from-emerald-500 to-teal-600" },
      { label: t("kpiPresentToday"), val: present, icon: "✅", color: "from-amber-500 to-orange-600" },
      { label: t("kpiAbsentToday"), val: attendance.filter((a: any) => a.status === "absent").length, icon: "🚨", color: "from-rose-500 to-pink-600" },
    ];
  })();

  const badgeKey =
    viewRole === "teacher" ? "teacherBadge" : viewRole === "parent" ? "parentBadge" : viewRole === "student" ? "studentBadge" : "adminBadge";
  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold text-white inline-block mb-2" style={{ background: "var(--color-primary)" }}>
            {t(badgeKey)}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("myWorkspace")}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {user?.name_ar || user?.email}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {t("refresh")}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">{t("loading")}</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={surfaceCls} style={surfaceStyle}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{stat.label}</p>
                    <h3 className="text-3xl font-extrabold mt-2" style={{ fontFamily: "var(--font-heading)" }}>{stat.val}</h3>
                  </div>
                  <span className={`text-3xl p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={surfaceCls} style={surfaceStyle}>
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              🚀 {t("quickActions")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(ACTIONS[viewRole] || []).map((action, i) => (
                <Link
                  key={i}
                  href={`/${locale}${action.href}`}
                  className="p-5 rounded-2xl font-bold transition-all hover:scale-105 bg-[var(--color-background)] border border-[var(--color-border)]"
                >
                  {action.icon} {t(action.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
