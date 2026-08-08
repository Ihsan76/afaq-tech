import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import PrivacyPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "سياسة الخصوصية",
  en: "Privacy Policy",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/privacy",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "سياسة الخصوصية لمنصة آفاق تكنولوجي", en: "Privacy policy of the Afaq Tech platform" },
      locale
    ),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/privacy"
      title={localizedValue(TITLES, locale)}
    >
      <PrivacyPageClient />
    </StaticPageWrapper>
  );
}
