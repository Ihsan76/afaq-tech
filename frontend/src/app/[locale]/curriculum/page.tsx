import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import CurriculumPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/curriculum",
    title: localizedValue({ ar: "المناهج", en: "Curriculum" }, locale),
    description: localizedValue(
      { ar: "المناهج الرسمية بالصفوف والمواد", en: "Official curricula by grade and subject" },
      locale
    ),
    type: "website",
  });
}

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "المناهج", en: "Curriculum" }, locale),
    url: `${SITE_URL}/${locale}/curriculum`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <CurriculumPageClient />
    </>
  );
}
