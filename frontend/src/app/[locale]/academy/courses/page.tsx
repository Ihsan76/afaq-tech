import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import AcademyCoursesPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/academy/courses",
    title: localizedValue({ ar: "الدورات التعليمية", en: "Courses" }, locale),
    description: localizedValue(
      { ar: "دورات تعليمية تفاعلية عبر الإنترنت", en: "Interactive online educational courses" },
      locale
    ),
    type: "website",
  });
}

export default async function AcademyCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: localizedValue({ ar: "الدورات التعليمية", en: "Courses" }, locale),
    url: `${SITE_URL}/${locale}/academy/courses`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <AcademyCoursesPageClient />
    </>
  );
}
