"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

interface RoleGuardProps {
  allowed: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowed, children }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("school");
  const { user, accessToken, hydrated } = useAuthStore();
  const locale = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace(`/${locale}/school`);
    }
  }, [hydrated, accessToken, locale, router]);

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-lg font-bold animate-pulse">
        {t("checkingAccess")}
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl p-8 text-center border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-2">{t("signInRequired")}</h1>
          <Link href={`/${locale}/school`} className="inline-block px-6 py-2.5 rounded-2xl font-bold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            {t("backToSchool")}
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-lg font-bold animate-pulse">
        {t("checkingAccess")}
      </div>
    );
  }

  const isStaff = user.is_staff || user.role === "admin" || user.role === "developer" || (user.roles && user.roles.includes("admin"));
  const isAllowed = isStaff || allowed.includes(user.role) || (user.roles && allowed.some(r => user.roles.includes(r)));

  if (!isAllowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl p-8 text-center border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">{t("accessDeniedTitle")}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>{t("accessDeniedBody")}</p>
          <Link href={`/${locale}/school`} className="inline-block px-6 py-2.5 rounded-2xl font-bold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            {t("backToSchool")}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
