import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getCurriculumSeo } from "@/lib/metadata";
import CurriculumSubjectPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; gradeId: string; subjectId: string }>;
}): Promise<Metadata> {
  const { locale, gradeId, subjectId } = await params;
  const seo = await getCurriculumSeo(locale, gradeId, subjectId);
  return buildMetadata({
    locale,
    path: `/curriculum/${gradeId}/${subjectId}`,
    title: seo?.title || "المناهج",
    description: seo?.description,
  });
}

export default async function CurriculumSubjectPage({
  params,
}: {
  params: Promise<{ locale: string; gradeId: string; subjectId: string }>;
}) {
  const { locale, gradeId, subjectId } = await params;
  const seo = await getCurriculumSeo(locale, gradeId, subjectId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo?.title || "",
    description: seo?.description || "",
    url: `${SITE_URL}/${locale}/curriculum/${gradeId}/${subjectId}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <CurriculumSubjectPageClient />
    </>
  );
}
