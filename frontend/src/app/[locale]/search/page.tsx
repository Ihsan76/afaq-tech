"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import Link from "next/link";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function SearchPage() {
  const t = useTranslations("search");
  const tBlog = useTranslations("blog");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const { data: blogPosts } = useSWR(
    initialQuery ? `/blog/posts/?search=${encodeURIComponent(initialQuery)}` : null,
    fetcher
  );
  const { data: ebooks } = useSWR(
    initialQuery ? `/ebooks/?search=${encodeURIComponent(initialQuery)}` : null,
    fetcher
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const results = [
    ...(blogPosts?.results || blogPosts || []).map((p: any) => ({
      type: "blog",
      title: localized(p.translations, locale, "title"),
      desc: localized(p.translations, locale, "excerpt") || localized(p.translations, locale, "description"),
      href: `/${locale}/blog/${p.slug}`,
      icon: "📝",
    })),
    ...(ebooks || []).map((e: any) => ({
      type: "ebook",
      title: localized(e.translations, locale, "title"),
      desc: localized(e.translations, locale, "description"),
      href: `/${locale}/ebooks/${e.slug}`,
      icon: "📚",
    })),
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1
            className="text-3xl font-bold text-center mb-8"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
          >
            {t("title")}
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2 mb-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text)",
                borderColor: "var(--color-border)",
              }}
            />
            <button
              type="submit"
              className="shrink-0 px-6 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: "var(--btn-primary-bg, var(--color-primary))",
                color: "var(--btn-primary-color, white)",
                boxShadow: "var(--btn-shadow)",
              }}
            >
              {t("button")}
            </button>
          </form>

          {initialQuery && (
            <div>
              <p className="mb-4" style={{ color: "var(--color-text-muted)" }}>
                {t("resultsFor")} &quot;{initialQuery}&quot; — {results.length} {t("found")}
              </p>

              <div className="space-y-3">
                {results.map((r, i) => (
                  <Link
                    key={i}
                    href={r.href}
                    className="block p-4 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--card-shadow)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{r.title}</h3>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{r.desc}</p>
                        <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                          {r.type === "blog" ? tBlog("title") : "E-Book"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {results.length === 0 && (
                <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
                  {t("noResults")}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
