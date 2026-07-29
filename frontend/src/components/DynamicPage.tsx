"use client";

import { useTranslations } from "next-intl";
import { useApi } from "@/lib/useApi";
import BlockRenderer, { BlockData } from "@/components/landing/BlockRenderer";

interface PageData {
  id: number;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  layout_config: Record<string, any>;
  theme_overrides: Record<string, any>;
  blocks: BlockData[];
}

export default function DynamicPage({
  slug,
  fallbackBlocks,
}: {
  slug: string;
  fallbackBlocks?: BlockData[];
}) {
  const t = useTranslations("common");
  const { data: page, error, loading } = useApi<PageData>(`/pages/${slug}/`);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (page && page.blocks.length > 0) {
    return (
      <main>
        <BlockRenderer blocks={page.blocks} />
      </main>
    );
  }

  if (fallbackBlocks && fallbackBlocks.length > 0) {
    return (
      <main>
        <BlockRenderer blocks={fallbackBlocks} />
      </main>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--color-text)" }}>404</h1>
          <p className="text-xl mb-6" style={{ color: "var(--color-text-muted)" }}>{t("notFound")}</p>
          <a href={`/${slug.split("/")[0]}`} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: "var(--color-primary)" }}>
            {t("backToHome")}
          </a>
        </div>
      </div>
    );
  }

  return null;
}
