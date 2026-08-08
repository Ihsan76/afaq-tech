import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import {
  SITE_URL,
  buildMetadata,
  getCmsPageSeo,
  localizedValue,
} from "@/lib/metadata";
import ServicePageClient from "./page-client";

const FALLBACK_TITLES: Record<string, Record<string, string>> = {
  "web-design": { ar: "تصميم مواقع احترافية", en: "Professional Web Design" },
  "social-media": { ar: "إدارة وسائل التواصل", en: "Social Media Management" },
  "landing-pages": { ar: "صفحات هبوط", en: "Landing Pages" },
  forms: { ar: "نماذج واستبيانات", en: "Forms & Surveys" },
  ebooks: { ar: "كتب إلكترونية", en: "E-books" },
  "ad-campaigns": { ar: "حملات إعلانية", en: "Ad Campaigns" },
  "brand-identity": { ar: "هوية بصرية", en: "Brand Identity" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seo = await getCmsPageSeo(locale, `services/${slug}`);
  const fallbackTitle = localizedValue(FALLBACK_TITLES[slug], locale);
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: seo?.title || fallbackTitle || slug,
    description: seo?.description,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const seo = await getCmsPageSeo(locale, `services/${slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: seo?.title || localizedValue(FALLBACK_TITLES[slug], locale) || slug,
    description: seo?.description || "",
    url: `${SITE_URL}/${locale}/services/${slug}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ServicePageClient />
    </>
  );
}
