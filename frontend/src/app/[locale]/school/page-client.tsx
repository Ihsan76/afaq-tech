"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";
import { useAuthStore } from "@/store/auth";
import SchoolAdminWorkspace from "@/components/school/SchoolAdminWorkspace";

const FALLBACK_BLOCKS: BlockData[] = [
  { id: 0, block_type: "hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "stats", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "features", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
  { id: 3, block_type: "how_it_works", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 3 },
  { id: 4, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 4 },
];

export default function SchoolPageClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { user, accessToken } = useAuthStore();
  const [viewMode, setViewMode] = useState<"landing" | "workspace">(accessToken ? "workspace" : "landing");

  return (
    <div>
      {accessToken && (
        <div className="bg-[var(--color-surface)] border-b py-3 px-4 flex justify-center items-center gap-4 sticky top-0 z-50 shadow-sm" style={{ borderColor: "var(--color-border)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ar" ? "👋 أهلاً بك في آفاق مدرستي" : "👋 Welcome to Afaq Madrasti"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("workspace")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "workspace" ? "bg-[var(--color-primary)] text-white shadow" : "bg-[var(--color-background)] border"}`}
            >
              {locale === "ar" ? "🏢 مساحة عمل الإدارة (Workspace)" : "🏢 Admin Workspace"}
            </button>
            <button
              onClick={() => setViewMode("landing")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "landing" ? "bg-[var(--color-primary)] text-white shadow" : "bg-[var(--color-background)] border"}`}
            >
              {locale === "ar" ? "🌐 صفحة الهبوط التسويقية" : "🌐 Marketing Landing"}
            </button>
          </div>
        </div>
      )}

      {accessToken && viewMode === "workspace" ? (
        <SchoolAdminWorkspace />
      ) : (
        <DynamicPage slug="school" fallbackBlocks={FALLBACK_BLOCKS} />
      )}
    </div>
  );
}
