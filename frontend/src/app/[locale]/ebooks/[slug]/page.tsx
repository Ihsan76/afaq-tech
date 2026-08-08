import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getEbookSeo } from "@/lib/metadata";
import EbookDetailPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seo = await getEbookSeo(locale, slug);
  if (!seo) {
    return buildMetadata({
      locale,
      path: `/ebooks/${slug}`,
      title: "404",
      description: "E-book not found",
    });
  }
  return buildMetadata({
    locale,
    path: `/ebooks/${slug}`,
    title: seo.title,
    description: seo.description,
    image: seo.image,
    type: "book",
    publishedTime: seo.publishedTime,
    authors: seo.authors,
    tags: seo.tags,
  });
}

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const seo = await getEbookSeo(locale, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: seo?.title || "",
    description: seo?.description || "",
    ...(seo?.image ? { image: seo.image } : {}),
    ...(seo?.authors?.[0] ? { author: { "@type": "Person", name: seo.authors[0] } } : {}),
    ...(seo?.publishedTime ? { datePublished: seo.publishedTime } : {}),
    inLanguage: locale,
    url: `${SITE_URL}/${locale}/ebooks/${slug}`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <EbookDetailPageClient />
    </>
  );
}
