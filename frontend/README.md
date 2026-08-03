# Frontend — Next.js

واجهة منصة أفاق التعليمية المبنية بـ **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS**، مع دعم **10 لغات** (عربي RTL أساسي) ونظام ثيمات.

## التشغيل

```bash
npm install
npm run dev        # http://localhost:3000
```

### متغيرات البيئة

| المتغير | الوصف |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | رابط الـ Backend (مثل `http://localhost:8000/api/v1`) |

## الأوامر

```bash
npm run dev          # خادم التطوير
npm run build        # بناء الإنتاج
npm run start        # تشغيل الإنتاج بعد البناء
npm run lint         # فحص الشيفرة (ESLint)
npm run sync:locales # مزامنة اللغات من i18n/config مع الخادم
npx tsc --noEmit     # فحص الأنواع
```

## بنية المجلدات

```
src/
├── app/
│   ├── [locale]/            # الصفحات حسب اللغة (ar/en/fr/...)
│   │   ├── admin/           # لوحة الإدارة (باقات، سوق، محتوى، مستخدمون...)
│   │   └── subscriptions/   # صفحة الاشتراكات (الباقات، العملات، الاستهلاك)
│   └── globals.css          # الثيمات (CSS variables: --color-*)
├── components/              # مكونات مشتركة
├── i18n/
│   ├── config.ts            # اللغات العشر (ar, en, fr, tr, ur, es, de, id, bn, fa)
│   └── messages/            # ملفات الترجمة (en.json/ar.json/...)
├── lib/                     # api، hooks، أدوات مساعدة
├── store/                   # Zustand (auth، chat، ...)
└── proxy.ts                 # وسيط للـ API
```

## الترجمة واللغات

- `next-intl` مع توجيه `[locale]` — كل ملف في `i18n/messages/<lang>.json` يمثل لغة كاملة.
- ملفات `messages/*.json` هي المصدر لجدول الترجمات في الخادم (تُزامَن عبر `npm run sync:locales`).
- إضافة لغة جديدة: أضفها في `src/i18n/config.ts` ثم أنشئ `messages/<code>.json`.

## لوحة الإدارة

- `/[locale]/admin` — محمية بصلاحية المشرف.
- تشمل: المحتوى (صفحات/قوائم/قوالب/ثيمات)، التعليم (مراحل/مواد/مناهج)، المدونة، الكتب، الدورات، السوق، الرسائل، المستخدمون، **الباقات والخدمات**.
- صفحة الباقات (`/admin/subscriptions`): إدارة كاملة للباقات (أسماء متعددة اللغات، أسعار لكل عملة، حِصص الخدمات والحدود) + تنبيه قبل مغادرة النموذج عند وجود تعديلات غير محفوظة.

## الاشتراكات (المستخدم)

- صفحة `/[locale]/subscriptions`: عرض الباقات بسعر العملة المحلية (اختيار عملة + تفضيل المستخدم + تبعاً للغة)، شراء عبر البوابة، وبطاقة "استهلاك خدماتك" لعرض حِصص الاستخدام المتبقية.
