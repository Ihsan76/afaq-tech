/**
 * مزامنة قوائم اللغات من الواجهة الخلفية إلى إعدادات الواجهة الأمامية.
 *
 * يجلب /api/v1/core/languages/ ويعيد توليد src/i18n/config.ts (المصدر الوحيد
 * لقوائم اللغات)، ويتحقق من وجود ملف messages/{code}.json لكل لغة.
 *
 * الاستخدام: npm run sync:locales
 */
import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function main() {
  const res = await fetch(`${apiBase}/core/languages/`);
  if (!res.ok) {
    console.error(`فشل جلب اللغات من ${apiBase}/core/languages/ (HTTP ${res.status})`);
    process.exit(1);
  }
  const data = await res.json();
  const langs = Array.isArray(data) ? data : data.results || data;
  if (!langs || langs.length === 0) {
    console.error("لا توجد لغات في الواجهة الخلفية.");
    process.exit(1);
  }

  const defaultLang = (langs.find((l) => l.is_default) || langs[0]).code;
  const ordered = [...langs].sort((a, b) => (a.order || 0) - (b.order || 0));

  const codes = ordered.map((l) => l.code);
  const lines = [];
  lines.push(`export const locales = [${codes.map((c) => `"${c}"`).join(", ")}] as const;`);
  lines.push(`export const defaultLocale = "${defaultLang}" as const;`);
  lines.push("export const localeNames: Record<string, string> = {");
  for (const l of ordered) lines.push(`  ${l.code}: "${esc(l.native_name || l.name)}",`);
  lines.push("};");
  lines.push("export const localeFlags: Record<string, string> = {");
  for (const l of ordered) lines.push(`  ${l.code}: "${esc(l.flag || "")}",`);
  lines.push("};");
  lines.push("export const localeRtl: Record<string, boolean> = {");
  for (const l of ordered) lines.push(`  ${l.code}: ${l.is_rtl ? "true" : "false"},`);
  lines.push("};");

  const configPath = join(root, "i18n", "config.ts");
  writeFileSync(configPath, lines.join("\n") + "\n", "utf8");

  // Regenerate proxy matcher (static literal required by Next.js).
  const proxyPath = join(root, "proxy.ts");
  const matcher = `/(${codes.join("|")})/:path*`;
  const proxySrc = [
    `import createMiddleware from "next-intl/middleware";`,
    `import { locales, defaultLocale } from "./i18n/config";`,
    ``,
    `export default createMiddleware({`,
    `  locales,`,
    `  defaultLocale,`,
    `  localePrefix: "always",`,
    `});`,
    ``,
    `// NOTE: must stay a static literal — Next.js parses \`matcher\` at compile time.`,
    `// Regenerated automatically by \`npm run sync:locales\`.`,
    `export const config = {`,
    `  matcher: ["/", "${matcher}"],`,
    `};`,
    ``,
  ].join("\n");
  writeFileSync(proxyPath, proxySrc, "utf8");

  const messagesDir = join(root, "i18n", "messages");
  const missing = codes.filter((c) => !existsSync(join(messagesDir, `${c}.json`)));

  console.log(`تمت مزامنة ${codes.length} لغة → src/i18n/config.ts`);
  console.log(`اللغات: ${codes.join(", ")}`);
  console.log(`الافتراضية: ${defaultLang}`);
  if (missing.length) {
    console.warn(`تحذير: لا توجد ملفات رسائل للغات: ${missing.join(", ")}`);
  } else {
    console.log("جميع اللغات لها ملف messages/<code>.json");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
