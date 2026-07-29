"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import Link from "next/link";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface MenuItem {
  id: number;
  title: string;
  url: string;
  icon: string;
  children?: MenuItem[];
}

interface SiteSettings {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
}

export default function Footer() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const { data: footerMenu } = useSWR<MenuItem[]>(
    `/pages/menu/footer/?locale=${locale}`,
    fetcher
  );
  const { data: settings } = useSWR<SiteSettings>(
    "/pages/settings/",
    fetcher
  );

  return (
    <footer style={{ background: "var(--color-background-secondary, var(--color-surface))", borderTop: "1px solid var(--color-border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                آ
              </div>
              <span className="text-xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {t("common.appName")}
              </span>
            </Link>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {locale === "ar"
                ? "منصة رقمية متخصصة في الخدمات الرقمية والتعليم"
                : "A digital platform for digital services and education"}
            </p>
          </div>

          {/* Footer Menu */}
          {footerMenu && footerMenu.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="font-bold mb-4" style={{ color: "var(--color-text)" }}>
                {locale === "ar" ? "روابط سريعة" : "Quick Links"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {footerMenu.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url.startsWith("/") ? `/${locale}${item.url}` : item.url}
                    className="text-sm flex items-center gap-1 transition-colors hover:opacity-80"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.icon} {item.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-4" style={{ color: "var(--color-text)" }}>
              {locale === "ar" ? "تواصل معنا" : "Contact"}
            </h3>
            <div className="space-y-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              {settings?.email && <p>📧 {settings.email}</p>}
              {settings?.phone && <p>📱 {settings.phone}</p>}
              {settings?.address && <p>📍 {settings.address}</p>}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} {t("common.appName")}. {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Link href={`/${locale}/privacy`} className="hover:opacity-80">
              {locale === "ar" ? "الخصوصية" : "Privacy"}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:opacity-80">
              {locale === "ar" ? "الشروط" : "Terms"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
