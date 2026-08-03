# أفاق التعليمية — Afaq Educational Platform

منصة تعليمية رقمية عربية مدعومة بالذكاء الاصطناعي تخدم المعلمين والطلاب والمدارس والمؤسسات التعليمية، وتشمل نظام اشتراكات وباقات متعدد العملات مع بوابات دفع.

> منصة عربية ثنائية اللغة (عربي + 9 لغات) — تخطيط RTL ولغات إضافية مدعومة بالكامل.

---

## نظرة عامة

- **المستخدم**: معلمون وطلاب ومدارس ومؤسسات.
- **الذكاء الاصطناعي**: توليد خطط الدروس، المساعد الذكي، البرومبتات، ونماذج AI قابلة للإدارة.
- **الاشتراكات**: باقات (مجاني / احترافي / للمدارس / مؤسسي) مع أسعار محلية لكل عملة، واشتراك فعلي عبر Stripe أو MyFatoorah.
- **السوق**: خدمات وطلبات ومراجعات، دفع موحّد عبر واجهة موفّر دفع مشتركة.
- **لوحة إدارة**: `/admin` (داخلية للغة) لإدارة المحتوى والباقات والخدمات والاشتراكات والمستخدمين.

## البنية التقنية

| الطبقة | التقنية |
| --- | --- |
| الواجهة (Frontend) | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS |
| الخادم (Backend) | Django 5 + Django REST Framework + JWT (SimpleJWT) |
| قاعدة البيانات | PostgreSQL عبر Supabase (+ S3/storage من Supabase) |
| الذاكرة المؤقتة | Redis |
| المدفوعات | Stripe + MyFatoorah (واجهة موفّر موحّدة) |
| الترجمة | next-intl — 10 لغات (ar, en, fr, tr, ur, es, de, id, bn, fa) |
| النشر | Render (Backend) + Vercel (Frontend) + Docker |

## هيكل المشروع

```
afaq-tech/
├── backend/          # Django API (ملف README خاص به)
├── frontend/         # Next.js App (ملف README خاص به)
├── docs/             # وثائق النشر والتشغيل
├── docker-compose.yml
├── render.yaml       # إعداد نشر Backend على Render
└── vercel.json       # إعداد نشر Frontend على Vercel
```

- `backend/README.md` — تشغيل الـ API والأوامر والتطبيقات.
- `frontend/README.md` — تشغيل الواجهة والمجلدات والأوامر.
- `docs/DEPLOYMENT.md` — دليل النشر الكامل.
- `docs/DEPLOY-HOSTED.md` — نشر النسخة المستضافة (Render + Vercel + Supabase).

## تشغيل سريع

```bash
# الواجهة
cd frontend
npm install
npm run dev            # http://localhost:3000

# الخادم (يحتاج .env — انظر backend/README.md)
cd backend
./venv/bin/python manage.py migrate
./venv/bin/python manage.py runserver   # http://localhost:8000
```

> تتطلب المنصة `NEXT_PUBLIC_API_URL` في الواجهة و`DATABASE_URL` وقاعدة بيانات Supabase في الخادم. انظر وثائق كل مجلد.

## فروع الميزات الرئيسية

- **اشتراكات متعددة العملات**: عرض السعر بالعملة المحلية (`؟currency=` أو تفضيل المستخدم أو اللغة) والدفع الفعلي بعملة حساب البوابة (SAR). انظر `backend/apps/subscriptions/currencies.py`.
- **حِصص الخدمات**: ربط خدمات بالباقات مع حدّ استخدام وفترة، وحساب فعلي لعدد مرات الاستخدام (مثال: 5 خطط دروس/شهر للخطة المجانية). انظر `backend/apps/subscriptions/services.py`.
- **دفع موحّد**: واجهة `get_provider()` تختار Stripe أو MyFatoorah تلقائياً (متوافقة مع أسواق الشرق الأوسط).

## CI

- GitHub Actions (`.github/workflows/ci.yml`): رف + pytest للخادم، و eslint + build للواجهة، بدون الحاجة إلى `.env`.
