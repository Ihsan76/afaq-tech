"use client";

import { useState, useEffect, useRef } from "react";
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
  const [activeTab, setActiveTab] = useState<"all" | "courses" | "blog" | "ebooks">("all");
  const [suggestions, setSuggestions] = useState<{ courses: any[]; blog: any[]; ebooks: any[] }>({ courses: [], blog: [], ebooks: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch autocomplete suggestions on typing
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions({ courses: [], blog: [], ebooks: [] });
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/core/search/autocomplete/?q=${encodeURIComponent(query.trim())}&locale=${locale}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch {
        setSuggestions({ courses: [], blog: [], ebooks: [] });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, locale]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: coursesData } = useSWR(
    initialQuery ? `/courses/?search=${encodeURIComponent(initialQuery)}` : null,
    fetcher
  );
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
    setShowSuggestions(false);
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const coursesList = (coursesData?.results || coursesData || []).map((c: any) => ({
    type: "course",
    title: localized(c.translations, locale, "title"),
    desc: localized(c.translations, locale, "description"),
    href: `/${locale}/academy/courses/${c.slug}`,
    icon: "🎓",
    badge: t("courses"),
  }));

  const blogList = (blogPosts?.results || blogPosts || []).map((p: any) => ({
    type: "blog",
    title: localized(p.translations, locale, "title"),
    desc: localized(p.translations, locale, "excerpt") || localized(p.translations, locale, "description"),
    href: `/${locale}/blog/${p.slug}`,
    icon: "📝",
    badge: t("blog"),
  }));

  const ebooksList = (ebooks || []).map((e: any) => ({
    type: "ebook",
    title: localized(e.translations, locale, "title"),
    desc: localized(e.translations, locale, "description"),
    href: `/${locale}/ebooks/${e.slug}`,
    icon: "📚",
    badge: t("ebooks"),
  }));

  const allResults = [...coursesList, ...blogList, ...ebooksList];

  const filteredResults = activeTab === "all"
    ? allResults
    : activeTab === "courses"
    ? coursesList
    : activeTab === "blog"
    ? blogList
    : ebooksList;

  return (
    <div className="min-h-screen py-16 sm:py-20" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1
          className="text-3xl sm:text-4xl font-bold text-center mb-8"
          style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}
        >
          {t("title")}
        </h1>

        {/* Search Bar + Autocomplete */}
        <div ref={searchRef} className="relative mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.trim().length >= 2) setShowSuggestions(true); }}
                placeholder={t("placeholder")}
                className="w-full px-4 py-3.5 rounded-2xl border outline-none focus:ring-2 text-base transition-all"
                style={{
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  borderColor: "var(--color-border)",
                }}
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-lg opacity-50">🔍</span>
            </div>
            <button
              type="submit"
              className="shrink-0 px-7 py-3.5 rounded-2xl font-semibold transition-all shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                color: "white",
              }}
            >
              {t("button")}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (suggestions.courses.length > 0 || suggestions.blog.length > 0 || suggestions.ebooks.length > 0) && (
            <div
              className="absolute top-full mt-2 w-full rounded-2xl shadow-2xl z-50 overflow-hidden border py-2"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                boxShadow: "0 20px 40px -10px rgb(0 0 0 / 0.2)",
              }}
            >
              {suggestions.courses.length > 0 && (
                <div className="px-3 py-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)" }}>{t("courses")}</p>
                  {suggestions.courses.map((c: any, i: number) => (
                    <Link
                      key={i}
                      href={c.url}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--color-muted)]"
                      style={{ color: "var(--color-text)" }}
                    >
                      <span>🎓</span>
                      <span className="truncate font-medium">{c.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {suggestions.blog.length > 0 && (
                <div className="px-3 py-1.5 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)" }}>{t("blog")}</p>
                  {suggestions.blog.map((p: any, i: number) => (
                    <Link
                      key={i}
                      href={p.url}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--color-muted)]"
                      style={{ color: "var(--color-text)" }}
                    >
                      <span>📝</span>
                      <span className="truncate font-medium">{p.title}</span>
                    </Link>
                  ))}
                </div>
              )}
              {suggestions.ebooks.length > 0 && (
                <div className="px-3 py-1.5 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-primary)" }}>{t("ebooks")}</p>
                  {suggestions.ebooks.map((e: any, i: number) => (
                    <Link
                      key={i}
                      href={e.url}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--color-muted)]"
                      style={{ color: "var(--color-text)" }}
                    >
                      <span>📚</span>
                      <span className="truncate font-medium">{e.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {initialQuery && (
          <div>
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              {[
                { id: "all", label: t("all"), count: allResults.length },
                { id: "courses", label: t("courses"), count: coursesList.length },
                { id: "blog", label: t("blog"), count: blogList.length },
                { id: "ebooks", label: t("ebooks"), count: ebooksList.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{
                    backgroundColor: activeTab === tab.id ? "var(--color-primary)" : "var(--color-surface)",
                    color: activeTab === tab.id ? "white" : "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "var(--color-muted)",
                      color: activeTab === tab.id ? "white" : "var(--color-text-muted)",
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <p className="mb-6 text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
              {t("resultsFor")} &quot;{initialQuery}&quot; — {filteredResults.length} {t("found")}
            </p>

            <div className="space-y-4">
              {filteredResults.map((r: any, i: number) => (
                <Link
                  key={i}
                  href={r.href}
                  className="block p-5 rounded-2xl transition-all hover:scale-[1.01] border"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    boxShadow: "var(--card-shadow)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl shrink-0 p-2 rounded-xl" style={{ backgroundColor: "var(--color-primary-light)" }}>
                      {r.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                          {r.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold truncate" style={{ color: "var(--color-text)" }}>{r.title}</h3>
                      {r.desc && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{r.desc}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
                <p className="text-lg font-medium">{t("noResults")}</p>
                <p className="text-sm mt-1">{t("noResultsHint")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
