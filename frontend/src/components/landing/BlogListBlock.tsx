"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { localizedContent, localized } from "@/lib/i18n";
import { useApiList, usePrefetch } from "@/lib/useApi";

interface BlogPost {
  id: number;
  translations: Record<string, Record<string, string>>;
  slug: string;
  category_name: Record<string, Record<string, string>> | null;
  read_time: number;
  published_at: string;
}

export default function BlogListBlock({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const tBlog = useTranslations("blog");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const { ref: sectionRef, isVisible } = useScrollReveal();
  const { data: allPosts } = useApiList<BlogPost>("/blog/posts/");
  const prefetch = usePrefetch(allPosts.slice(0, c.limit || 3).map((p) => `/blog/posts/${p.slug}/`));

  useEffect(() => {
    if (allPosts.length === 0) return;
    const timer = setTimeout(prefetch, 700);
    return () => clearTimeout(timer);
  }, [allPosts, prefetch, c.limit]);

  const posts = allPosts.slice(0, c.limit || 3);

  const title = localizedContent(c, "title", locale) || tBlog("latestTitle");
  const subtitle = localizedContent(c, "subtitle", locale);
  const viewAll = tBlog("readMore");

  return (
    <section ref={sectionRef} className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {title && (
          <div className={`text-center mb-12 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {title}
            </h2>
            {subtitle && <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-center" style={{ color: "var(--color-text-muted)" }}>{tBlog("noPosts")}</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className={`group p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", animationDelay: `${i * 0.1}s` }}
              >
                {post.category_name && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    {localized(post.category_name, locale, "name")}
                  </span>
                )}
                <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                  {localized(post.translations, locale, "title")}
                </h3>
                <p className="text-sm mb-4 line-clamp-3" style={{ color: "var(--color-text-muted)" }}>
                  {localized(post.translations, locale, "excerpt")}
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>{localized(post.translations, locale, "author_name")}</span>
                  <span>{post.read_time} {tBlog("minRead")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className={`text-center mt-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.4s" }}>
            <Link href={`/${locale}/blog`} className="inline-block px-8 py-3 rounded-2xl font-semibold transition-all duration-300 hover:-translate-y-0.5" style={{ border: "2px solid var(--color-primary)", color: "var(--color-primary)" }}>
              {viewAll} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
