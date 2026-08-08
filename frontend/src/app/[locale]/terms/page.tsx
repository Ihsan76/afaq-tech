import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import TermsPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "شروط الاستخدام",
  en: "Terms of Service",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/terms",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "شروط استخدام منصة آفاق تكنولوجي", en: "Terms of use of the Afaq Tech platform" },
      locale
    ),
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/terms"
      title={localizedValue(TITLES, locale)}
    >
      <TermsPageClient />
    </StaticPageWrapper>
  );
}
