import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getServiceSeo } from "@/lib/metadata";
import MarketplaceServicePageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const numericId = Number(id);
  const seo = Number.isFinite(numericId) ? await getServiceSeo(locale, numericId) : null;
  if (!seo) {
    return buildMetadata({
      locale,
      path: `/marketplace/services/${id}`,
      title: "404",
      description: "Service not found",
    });
  }
  return buildMetadata({
    locale,
    path: `/marketplace/services/${id}`,
    title: seo.title,
    description: seo.description,
    image: seo.image,
  });
}

export default async function MarketplaceServicePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const numericId = Number(id);
  const seo = Number.isFinite(numericId) ? await getServiceSeo(locale, numericId) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: seo?.title || "",
    description: seo?.description || "",
    ...(seo?.image ? { image: seo.image } : {}),
    url: `${SITE_URL}/${locale}/marketplace/services/${id}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <MarketplaceServicePageClient />
    </>
  );
}
