"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { useTranslations } from "next-intl";

interface BlogPost {
  id: number;
  title: Record<string, string>;
  slug: string;
  excerpt: Record<string, string>;
  content: Record<string, string>;
  featured_image: string;
  category_name: Record<string, string> | null;
  category_slug: string | null;
  tags: string;
  related_service: string;
  author_name: Record<string, string>;
  author_avatar: string;
  read_time: number;
  views: number;
  published_at: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const slug = params.slug as string;
  const isAr = locale === "ar";
  const t = useTranslations("blog");

  const { data: post, error, loading } = useApi<BlogPost>(`/blog/posts/${slug}/`);

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

  if (!post || error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--color-text)" }}>404</h1>
          <p className="text-xl mb-6" style={{ color: "var(--color-text-muted)" }}>{t("postNotFound")}</p>
          <Link href={`/${locale}/blog`} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: "var(--color-primary)" }}>
            {t("backToBlog")}
          </Link>
        </div>
      </div>
    );
  }

  const tags = post.tags ? post.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];
  const content = post.content?.[locale] || post.content?.en || "";
  const minRead = t("minRead");
  const backToBlog = t("backToBlog");
  const serviceLabel = t("relatedService");
  const viewsLabel = t("views");

  return (
    <main style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative py-12 sm:py-20 overflow-hidden" style={{ background: "var(--color-background)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition-all hover:translate-x-1 rtl:hover:-translate-x-1" style={{ color: "var(--color-primary)" }}>
            ← {backToBlog}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {post.category_name && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                {post.category_name?.[locale] || post.category_name?.en}
              </span>
            )}
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{post.read_time} {minRead}</span>
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>• {post.views} {viewsLabel}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {post.title?.[locale] || post.title?.en}
          </h1>

          <p className="text-lg sm:text-xl mb-8 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {post.excerpt?.[locale] || post.excerpt?.en}
          </p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "var(--color-primary)" }}>
              {post.author_avatar ? (
                <img src={post.author_avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (post.author_name?.[locale] || post.author_name?.en || "?").charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{post.author_name?.[locale] || post.author_name?.en}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {post.published_at ? new Date(post.published_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-10">
          <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
            <img src={post.featured_image} alt={post.title?.[locale] || ""} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <article className="prose prose-lg max-w-none" style={{ color: "var(--color-text)" }}>
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <p style={{ color: "var(--color-text-muted)" }}>{t("contentComingSoon")}</p>
          )}
        </article>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Service Link */}
        {post.related_service && (
          <div className="mt-8 p-6 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-sm mb-2" style={{ color: "var(--color-text-muted)" }}>{serviceLabel}</p>
            <Link href={`/${locale}${post.related_service}`} className="text-lg font-bold hover:underline" style={{ color: "var(--color-primary)" }}>
              {t("exploreService")} →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
