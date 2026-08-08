import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import AcademyPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/academy",
    title: localizedValue({ ar: "الأكاديمية", en: "Academy" }, locale),
    description: localizedValue(
      { ar: "الأكاديمية التعليمية: دورات، مناهج، وكتب", en: "Education academy: courses, curricula, and books" },
      locale
    ),
    type: "website",
  });
}

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "الأكاديمية", en: "Academy" }, locale),
    url: `${SITE_URL}/${locale}/academy`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <AcademyPageClient />
    </>
  );
}
