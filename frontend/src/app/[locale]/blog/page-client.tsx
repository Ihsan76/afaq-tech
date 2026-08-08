"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useApiList } from "@/lib/useApi";

interface BlogPost {
  id: number;
  title: Record<string, string>;
  slug: string;
  excerpt: Record<string, string>;
  featured_image: string;
  category_name: Record<string, string> | null;
  category_slug: string | null;
  tags: string;
  author_name: Record<string, string>;
  read_time: number;
  views: number;
  published_at: string;
  is_featured: boolean;
}

interface BlogCategory {
  id: number;
  name: Record<string, string>;
  slug: string;
  icon: string;
  posts_count: number;
}

export default function BlogPage() {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const t = useTranslations("blog");

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const postParams: Record<string, string> = {};
  if (selectedCategory) postParams.category = selectedCategory;
  if (search) postParams.search = search;

  const { data: posts, loading } = useApiList<BlogPost>("/blog/posts/", Object.keys(postParams).length ? postParams : undefined);
  const { data: categories } = useApiList<BlogCategory>("/blog/categories/");

  const featured = posts.filter((p) => p.is_featured);
  const regular = posts.filter((p) => !p.is_featured);

  return (
    <main style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden" style={{ background: "var(--color-background)" }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full animate-morph" style={{ background: "var(--color-primary)" }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full animate-morph" style={{ background: "var(--color-secondary)", animationDelay: "2s" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>{t("subtitle")}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {/* Search + Categories */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!selectedCategory ? "text-white" : ""}`}
              style={!selectedCategory ? { background: "var(--color-primary)" } : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1`}
                style={selectedCategory === cat.slug
                  ? { background: "var(--color-primary)", color: "white" }
                  : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name?.[locale] || cat.name?.en || cat.name?.ar}</span>
                <span className="text-xs opacity-60">({cat.posts_count})</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full sm:w-64 px-4 py-2 rounded-xl text-sm"
            style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
          />
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center animate-pulse" style={{ background: "var(--color-primary)" }}>
              <span className="text-white text-xl font-bold">آ</span>
            </div>
            {t("loading")}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            <p className="text-xl mb-2">{t("noPosts")}</p>
            <p className="text-sm">{t("noPostsHint")}</p>
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            {featured.length > 0 && !selectedCategory && !search && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-primary)" }} />
                  {t("featured")}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {featured.map((post) => (
                    <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group p-6 rounded-3xl hover-lift transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                      {post.featured_image && (
                        <div className="w-full h-48 rounded-2xl mb-4 overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                          <img src={post.featured_image} alt={post.title?.[locale] || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        {post.category_name && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                            {post.category_name?.[locale] || post.category_name?.en}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{post.read_time} {t("minRead")}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
                        {post.title?.[locale] || post.title?.en}
                      </h3>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-text-muted)" }}>
                        {post.excerpt?.[locale] || post.excerpt?.en}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--color-primary)" }}>
                            {(post.author_name?.[locale] || post.author_name?.en || "?").charAt(0)}
                          </div>
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{post.author_name?.[locale] || post.author_name?.en}</span>
                        </div>
                        <span className="text-sm font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" style={{ color: "var(--color-primary)" }}>
                          {t("readMore")} →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((post) => (
                <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="group p-5 rounded-3xl hover-lift transition-all duration-300" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                  {post.featured_image && (
                    <div className="w-full h-40 rounded-2xl mb-4 overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                      <img src={post.featured_image} alt={post.title?.[locale] || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {post.category_name && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                        {post.category_name?.[locale] || post.category_name?.en}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{post.read_time} {t("minRead")}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
                    {post.title?.[locale] || post.title?.en}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--color-text-muted)" }}>
                    {post.excerpt?.[locale] || post.excerpt?.en}
                  </p>
                  <span className="text-sm font-semibold group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all" style={{ color: "var(--color-primary)" }}>
                    {t("readMore")} →
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
