import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import NavbarWrapper from "@/components/NavbarWrapper";
import Footer from "@/components/Footer";
import HtmlAttrs from "@/components/HtmlAttrs";
import ChatWidget from "@/components/ChatWidget";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <>
      <HtmlAttrs locale={locale} />
      <NextIntlClientProvider messages={messages}>
        <NavbarWrapper />
        {children}
        {/* Footer */}
        <Footer />
        <ChatWidget />
      </NextIntlClientProvider>
    </>
  );
}
