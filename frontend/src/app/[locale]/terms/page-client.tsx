"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function TermsOfServicePage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: "var(--color-background)", color: "var(--color-text)", direction: isAr ? "rtl" : "ltr" }}>
      <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-6 sm:p-12 border shadow-xl" style={{ borderColor: "var(--color-border)" }}>
        
        <div className="flex justify-between items-center mb-8 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {isAr ? "شروط الخدمة" : "Terms of Service"}
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {isAr ? "آخر تحديث: 4 أغسطس 2026" : "Last updated: August 4, 2026"}
            </p>
          </div>
          <Link href={`/${locale}/login`} className="text-sm font-medium px-4 py-2 rounded-xl transition-all" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)", border: "1px solid var(--color-border)" }}>
            {isAr ? "العودة لتسجيل الدخول" : "Back to Login"}
          </Link>
        </div>

        <div className="space-y-6 text-sm sm:text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "1. القبول بالشروط" : "1. Acceptance of Terms"}
            </h2>
            <p>
              {isAr
                ? "باستخدامك لمنصة آفاق (Afaq Tech)، فإنك توافق على الالتزام بشروط الخدمة هذه وجميع القوانين واللوائح المعمول بها."
                : "By accessing or using Afaq Tech, you agree to be bound by these Terms of Service and all applicable laws and regulations."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "2. حسابات المستخدمين والمصادقة" : "2. User Accounts & Authentication"}
            </h2>
            <p>
              {isAr
                ? "أنت مسؤول عن الحفاظ على سرية حسابك كلمة المرور أو بيانات الاعتماد الخاصة بك (بما في ذلك المصادقة عبر Google). أنت تتحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم تحت حسابك."
                : "You are responsible for maintaining the confidentiality of your account credentials (including Google OAuth login). You accept full responsibility for all activities that occur under your account."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "3. استخدام الخدمات" : "3. Use of Services"}
            </h2>
            <p>
              {isAr
                ? "تُقدم خدمات منصة آفاق (التعليمية، الذكاء الاصطناعي، خطط الدروس، والخدمات الرقمية) للأغراض التعليمية والمهنية المشروعة فقط."
                : "Afaq Tech services (educational tools, AI lesson plans, marketplace, and courses) are provided for lawful educational and professional purposes only."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "4. التعديلات والتوقف" : "4. Modifications & Termination"}
            </h2>
            <p>
              {isAr
                ? "نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي جزء من الخدمات في أي وقت دون إشعار مسبق."
                : "We reserve the right to modify, suspend, or terminate any part of the services at any time without prior notice."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "5. تواصل معنا" : "5. Contact Us"}
            </h2>
            <p>
              {isAr
                ? "لأي استفسارات حول شروط الخدمة، يرجى التواصل معنا عبر: support@afaq.app"
                : "For any questions regarding these Terms of Service, please contact us at: support@afaq.app"}
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
