"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import Link from "next/link";
import { useParams } from "next/navigation";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const ACCESS_BADGES: Record<string, { icon: string; bg: string; color: string }> = {
  free: { icon: "✓", bg: "var(--color-success-light)", color: "var(--color-success)" },
  basic: { icon: "⭐", bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)" },
  pro: { icon: "👑", bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  enterprise: { icon: "🏢", bg: "#fef3c7", color: "#d97706" },
};

export default function EbookDetailPage() {
  const t = useTranslations("ebooks");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const params = useParams();
  const slug = params.slug as string;

  const { data: ebook, isLoading } = useSWR(`/ebooks/${slug}/`, fetcher);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div style={{ color: "var(--color-text-muted)" }}>{t("loading")}</div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div style={{ color: "var(--color-text-muted)" }}>{t("notFound")}</div>
          <Link href={`/${locale}/ebooks`} className="mt-4 inline-block px-4 py-2 rounded-xl" style={{ color: "var(--color-primary)" }}>
            {t("backToEbooks")}
          </Link>
        </div>
      </div>
    );
  }

  const badge = ACCESS_BADGES[ebook.access_level] || ACCESS_BADGES.free;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href={`/${locale}/ebooks`} className="inline-flex items-center gap-2 mb-8 text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            ← {t("backToEbooks")}
          </Link>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cover */}
            <div className="md:col-span-1">
              {ebook.cover_image ? (
                <img src={ebook.cover_image} alt={localized(ebook.translations, locale, "title")} className="w-full rounded-2xl shadow-lg" />
              ) : (
                <div className="aspect-[3/4] flex items-center justify-center text-6xl rounded-2xl" style={{ background: "var(--color-surface)" }}>
                  📚
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {ebook.is_featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    {t("featured")}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: badge.bg, color: badge.color }}>
                  {badge.icon} {t(ebook.access_level as "free" | "basic" | "pro" | "enterprise")}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                  {ebook.file_format}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {localized(ebook.translations, locale, "title")}
              </h1>

              <p className="text-lg mb-6" style={{ color: "var(--color-text-muted)" }}>
                {localized(ebook.translations, locale, "description")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface)" }}>
                  <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{ebook.pages_count}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("pages")}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface)" }}>
                  <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{ebook.file_size}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("fileSize")}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: "var(--color-surface)" }}>
                  <div className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{ebook.download_count}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("downloads")}</div>
                </div>
              </div>

              {/* Download Section */}
              {ebook.can_download ? (
                ebook.file_url ? (
                  <a
                    href={ebook.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 rounded-xl font-semibold transition-all"
                    style={{
                      background: "var(--btn-primary-bg, var(--color-primary))",
                      color: "var(--btn-primary-color, white)",
                      boxShadow: "var(--btn-shadow)",
                    }}
                  >
                    {t("download")}
                  </a>
                ) : (
                  <div className="p-4 rounded-xl" style={{ background: "var(--color-success-light)" }}>
                    <p className="text-sm font-medium" style={{ color: "var(--color-success)" }}>
                      ✓ {t("free")}
                    </p>
                  </div>
                )
              ) : (
                <div className="p-5 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                        {t("requiresPlan")}
                      </p>
                      <p className="text-lg font-bold" style={{ color: badge.color }}>
                        {t(ebook.access_level as "free" | "basic" | "pro" | "enterprise")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/register`}
                    className="inline-block mt-3 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "var(--btn-primary-bg, var(--color-primary))", color: "var(--btn-primary-color, white)" }}
                  >
                    {t("subscribeNow")} →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
