import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

// NOTE: must stay a static literal — Next.js parses `matcher` at compile time.
// Regenerated automatically by `npm run sync:locales`.
export const config = {
  matcher: ["/", "/(ar|en|fr|tr|ur|es|de|id|bn|fa)/:path*"],
};
