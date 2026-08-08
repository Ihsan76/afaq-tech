import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import VerifyEmailPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "تأكيد البريد الإلكتروني",
  en: "Verify Email",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/verify-email",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "تأكيد بريدك الإلكتروني في منصة آفاق", en: "Verify your email on the Afaq platform" },
      locale
    ),
  });
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/verify-email"
      title={localizedValue(TITLES, locale)}
    >
      <VerifyEmailPageClient />
    </StaticPageWrapper>
  );
}
