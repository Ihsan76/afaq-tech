import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import ForgotPasswordPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "استعادة كلمة المرور",
  en: "Forgot Password",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/forgot-password",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "استعادة كلمة مرور حسابك في منصة آفاق", en: "Recover your Afaq platform account password" },
      locale
    ),
  });
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/forgot-password"
      title={localizedValue(TITLES, locale)}
    >
      <ForgotPasswordPageClient />
    </StaticPageWrapper>
  );
}
