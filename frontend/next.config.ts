import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    const localeRedirects = ["ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn"].flatMap((locale) => [
      { source: `/${locale}/courses`, destination: `/${locale}/academy/courses`, permanent: true },
      { source: `/${locale}/courses/:path*`, destination: `/${locale}/academy/courses/:path*`, permanent: true },
    ]);
    return localeRedirects;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default withNextIntl(nextConfig);
