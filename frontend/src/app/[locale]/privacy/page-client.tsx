"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isAr = locale === "ar";

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: "var(--color-background)", color: "var(--color-text)", direction: isAr ? "rtl" : "ltr" }}>
      <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-6 sm:p-12 border shadow-xl" style={{ borderColor: "var(--color-border)" }}>
        
        <div className="flex justify-between items-center mb-8 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
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
              {isAr ? "1. مقدمة" : "1. Introduction"}
            </h2>
            <p>
              {isAr
                ? "تلتزم منصة آفاق (Afaq Tech) بحماية خصوصيتك وبياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك عندما تستخدم موقعنا وتطبيقاتنا وخدماتنا."
                : "Afaq Tech platform is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our website, applications, and services."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "2. البيانات التي نجمعها (بما في ذلك Google OAuth)" : "2. Information We Collect (Including Google OAuth)"}
            </h2>
            <p>
              {isAr
                ? "عندما تقوم بالتسجيل أو تسجيل الدخول باستخدام حساب Google الخاص بك، نقوم بجمع بعض معلومات الملف الشخصي الأساسية بموافقتك، وتشمل:"
                : "When you register or sign in using your Google account, we collect basic profile information with your consent, including:"}
            </p>
            <ul className="list-disc ps-6 mt-2 space-y-1">
              <li>{isAr ? "الاسم الكامل (Name)" : "Full Name"}</li>
              <li>{isAr ? "البريد الإلكتروني (Email Address)" : "Email Address"}</li>
              <li>{isAr ? "صورة الملف الشخصي (Profile Picture)" : "Profile Picture"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "3. كيف نستخدم معلوماتك" : "3. How We Use Your Information"}
            </h2>
            <p>
              {isAr
                ? "نستخدم البيانات التي نجمعها للأغراض التالية فقط:"
                : "We use the information we collect solely for the following purposes:"}
            </p>
            <ul className="list-disc ps-6 mt-2 space-y-1">
              <li>{isAr ? "إنشاء وإدارة حسابك على منصة آفاق." : "Creating and managing your Afaq Tech account."}</li>
              <li>{isAr ? "المصادقة وتأمين تسجيل الدخول وتجربة المستخدم." : "Authentication, secure login, and user experience."}</li>
              <li>{isAr ? "التواصل معك بخصوص التحديثات والخدمات والدعم الفني." : "Communicating with you regarding updates, services, and support."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "4. سياسة الاستخدام المحدود لبيانات Google" : "4. Google API Services User Data Policy & Limited Use"}
            </h2>
            <p>
              {isAr
                ? "تلتزم منصة آفاق تماماً بمتطلبات سياسة بيانات مستخدم خدمات واجهة برمجة تطبيقات Google (Google API Services User Data Policy)، بما في ذلك متطلبات الاستخدام المحدود (Limited Use requirements). لا يتم نقل أو مشاركة البيانات التي يتم الحصول عليها من Google مع أي طرف ثالث، ولا يتم استخدامها للإعلانات الموجهة."
                : "Afaq Tech's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "5. أمن البيانات وحمايتها" : "5. Data Security"}
            </h2>
            <p>
              {isAr
                ? "نتخذ إجراءات أمنية وتقنية متقدمة لحماية بياناتك من الوصول غير autorizado أو التغيير أو الإفصاح أو التدمير."
                : "We implement robust security and technical measures to protect your data against unauthorized access, alteration, disclosure, or destruction."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
              {isAr ? "6. التواصل معنا" : "6. Contact Us"}
            </h2>
            <p>
              {isAr
                ? "إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يمكنك التواصل معنا عبر البريد الإلكتروني: support@afaq.app"
                : "If you have any questions or concerns about this Privacy Policy, please contact us at: support@afaq.app"}
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
