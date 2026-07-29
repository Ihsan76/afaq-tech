import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound({ params }: any) {
  const locale = params?.locale || (await params?.catch(() => {}))?.locale || "ar";
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center" style={{ background: "var(--color-background)" }}>
      <div className="text-8xl font-bold mb-6" style={{ color: "var(--color-primary)", fontFamily: "var(--font-heading)" }}>404</div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)" }}>{t("notFound")}</h1>
      <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>
        {locale === "ar" ? "الصفحة التي تبحث عنها غير موجودة أو تم نقلها." : "The page you're looking for doesn't exist or has been moved."}
      </p>
      <Link href={`/${locale}`} className="px-6 py-3 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg, var(--color-primary))", color: "var(--btn-primary-color, white)", boxShadow: "var(--btn-shadow)" }}>
        {t("backToHome")}
      </Link>
    </div>
  );
}
