import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import ResetPasswordPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "إعادة تعيين كلمة المرور",
  en: "Reset Password",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/reset-password",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "إعادة تعيين كلمة مرور حسابك في منصة آفاق", en: "Reset your Afaq platform account password" },
      locale
    ),
  });
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/reset-password"
      title={localizedValue(TITLES, locale)}
    >
      <ResetPasswordPageClient />
    </StaticPageWrapper>
  );
}
