"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";

const FALLBACK_BLOCKS: BlockData[] = [
  { id: 0, block_type: "hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "stats", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "features", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
  { id: 3, block_type: "how_it_works", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 3 },
  { id: 4, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 4 },
];

export default function SchoolPageClient() {
  const locale = useLocale();
  const t = useTranslations("school");
  const { user, accessToken } = useAuthStore();
  const [contextData, setContextData] = useState<any>(null);

  useEffect(() => {
    if (!accessToken) return;
    const activeId = typeof window !== "undefined" ? localStorage.getItem("active_school_id") : null;
    api
      .get("/schools/my-context/", { params: activeId ? { school: activeId } : {} })
      .then((res) => setContextData(res.data))
      .catch(() => {});
  }, [accessToken]);

  // Determine dynamic workspace link: prefer backend-provided workspace_url, fallback to role map
  const getWorkspaceLink = () => {
    if (contextData?.workspace_url) return `/${locale}${contextData.workspace_url.startsWith("/") ? "" : "/"}${contextData.workspace_url}`;
    if (!user) return `/${locale}/school/admin`;
    if (user.role === "teacher") return `/${locale}/teacher`;
    if (user.role === "parent") return `/${locale}/parent`;
    if (user.role === "student") return `/${locale}/student`;
    return `/${locale}/school/admin`;
  };

  const schoolName = contextData?.school?.name || contextData?.school_name || (contextData?.schools?.[0]?.name);

  return (
    <div>
      {accessToken && (
        <div className="bg-[var(--color-surface)] border-b py-3 px-4 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-sm gap-2" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
              {t("welcome")}, {user?.name_ar || user?.email}
            </span>
            {schoolName && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                🏫 {schoolName}
              </span>
            )}
          </div>
          <Link
            href={getWorkspaceLink()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("goToWorkspace")}
          </Link>
        </div>
      )}
      <DynamicPage slug="school" fallbackBlocks={FALLBACK_BLOCKS} />
    </div>
  );
}
