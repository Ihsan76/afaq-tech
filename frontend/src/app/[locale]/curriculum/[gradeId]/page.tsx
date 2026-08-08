import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getCurriculumSeo } from "@/lib/metadata";
import CurriculumGradePageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; gradeId: string }>;
}): Promise<Metadata> {
  const { locale, gradeId } = await params;
  const seo = await getCurriculumSeo(locale, gradeId);
  return buildMetadata({
    locale,
    path: `/curriculum/${gradeId}`,
    title: seo?.title || "المناهج",
    description: seo?.description,
  });
}

export default async function CurriculumGradePage({
  params,
}: {
  params: Promise<{ locale: string; gradeId: string }>;
}) {
  const { locale, gradeId } = await params;
  const seo = await getCurriculumSeo(locale, gradeId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo?.title || "",
    description: seo?.description || "",
    url: `${SITE_URL}/${locale}/curriculum/${gradeId}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <CurriculumGradePageClient />
    </>
  );
}
