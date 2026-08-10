"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { useSchoolApi } from "@/components/school/admin/useSchoolApi";

interface SchoolAdminShellProps {
  endpoints: Record<string, string>;
  children: (api: {
    data: Record<string, any[]>;
    schoolId: string | null;
    loading: boolean;
    refresh: () => void;
  }) => React.ReactNode;
}

export default function SchoolAdminShell({ endpoints, children }: SchoolAdminShellProps) {
  const t = useTranslations("school");
  const { user } = useAuthStore();
  const { data, schoolId, initialLoading, refreshing, refresh } = useSchoolApi(endpoints);
  const hasData = Object.keys(data).length > 0;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("adminTitle")}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {user?.name_ar || user?.email} — {t("adminSubtitle")}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center gap-2"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {refreshing && (
            <span
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
            />
          )}
          {t("refresh")}
        </button>
      </div>

      {refreshing && hasData && (
        <div
          className="fixed bottom-4 end-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl border text-sm font-bold animate-pulse"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          <span
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
          />
          {t("refreshing")}
        </div>
      )}

      {initialLoading && !hasData ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">{t("loading")}</div>
      ) : (
        children({ data, schoolId, loading: initialLoading, refresh })
      )}
    </div>
  );
}
