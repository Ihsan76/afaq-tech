import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  SITE_URL,
  buildMetadata,
  getBlogPostSeo,
  localizedValue,
} from "@/lib/metadata";
import BlogDetailPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seo = await getBlogPostSeo(locale, slug);
  if (!seo) {
    return buildMetadata({
      locale,
      path: `/blog/${slug}`,
      title: "404",
      description: "Post not found",
    });
  }
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: seo.title,
    description: seo.description,
    image: seo.image,
    type: "article",
    publishedTime: seo.publishedTime,
    authors: seo.authors,
    tags: seo.tags,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const seo = await getBlogPostSeo(locale, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: seo?.title || "",
    description: seo?.description || "",
    ...(seo?.image ? { image: [seo.image] } : {}),
    ...(seo?.publishedTime ? { datePublished: seo.publishedTime } : {}),
    author: {
      "@type": "Person",
      name: seo?.authors?.[0] || localizedValue({ ar: "آفاق تكنولوجي", en: "Afaq Tech" }, locale),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${locale}/blog/${slug}`,
    },
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogDetailPageClient />
    </>
  );
}
