"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import Link from "next/link";

const fetcher = (url: string) => api.get(url).then((r) => r.data.results ?? r.data);

interface Ebook {
  id: number;
  slug: string;
  translations: Record<string, Record<string, string>>;
  cover_image: string;
  category: number;
  author_translations: Record<string, Record<string, string>>;
  pages_count: number;
  file_size: string;
  file_format: string;
  is_featured: boolean;
  access_level: string;
  access_level_display: string;
  download_count: number;
  tags: string;
  published_at: string;
}

interface EbookCategory {
  id: number;
  slug: string;
  translations: Record<string, Record<string, string>>;
  icon: string;
}

export default function EbooksPage() {
  const t = useTranslations("ebooks");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: categories } = useSWR<EbookCategory[]>("/ebooks/categories/", fetcher);
  const { data: ebooks, isLoading } = useSWR<Ebook[]>("/ebooks/", fetcher);

  const filteredEbooks = selectedCategory
    ? ebooks?.filter((e) => {
        const cat = categories?.find((c) => c.id === e.category);
        return cat?.slug === selectedCategory;
      })
    : ebooks;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Hero */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h1
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
          >
            {t("title")}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Category Filter */}
      {categories && categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory("")}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: !selectedCategory ? "var(--color-primary)" : "var(--color-surface)",
                color: !selectedCategory ? "var(--btn-primary-color, white)" : "var(--color-text)",
                border: `1px solid var(--color-border)`,
              }}
            >
              {tCommon("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: selectedCategory === cat.slug ? "var(--color-primary)" : "var(--color-surface)",
                  color: selectedCategory === cat.slug ? "var(--btn-primary-color, white)" : "var(--color-text)",
                  border: `1px solid var(--color-border)`,
                }}
              >
                {cat.icon} {localized(cat.translations, locale, "name")}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
          {t("loading")}
        </div>
      )}

      {/* Ebook Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEbooks?.map((ebook) => (
            <Link
              key={ebook.id}
              href={`/${locale}/ebooks/${ebook.slug}`}
              className="block rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              {ebook.cover_image ? (
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={ebook.cover_image} alt={localized(ebook.translations, locale, "title")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-[3/4] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white" }}>
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                  <span className="text-5xl mb-3 drop-shadow-md">📖</span>
                  <h4 className="font-bold text-sm line-clamp-3 drop-shadow" style={{ fontFamily: "var(--font-heading)" }}>
                    {localized(ebook.translations, locale, "title")}
                  </h4>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {ebook.is_featured && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {t("featured")}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    background: ebook.access_level === 'free' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                    color: ebook.access_level === 'free' ? 'var(--color-success)' : 'var(--color-warning)'
                  }}>
                    {ebook.access_level === 'free' ? '✓ ' + t("free") : ebook.access_level === 'basic' ? '⭐ ' + t("basic") : ebook.access_level === 'pro' ? '👑 ' + t("pro") : '🏢 ' + t("enterprise")}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {ebook.file_format} · {ebook.pages_count} {t("pages")}
                  </span>
                </div>
                <h3 className="font-bold mb-1" style={{ color: "var(--color-text)" }}>
                  {localized(ebook.translations, locale, "title")}
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                  {localized(ebook.translations, locale, "description")}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {ebook.download_count} {t("downloads")}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                    {t("viewDetails")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && filteredEbooks?.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            <div className="text-4xl mb-4">📚</div>
            {t("noEbooks")}
          </div>
        )}
      </section>
    </div>
  );
}
