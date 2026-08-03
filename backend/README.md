# Backend — Django REST API

واجهة برمجية (API) لمنصة أفاق التعليمية مبنية بـ **Django 5 + Django REST Framework**.

## المتطلبات والتشغيل

```bash
# 1. إنشاء بيئة افتراضية وتثبيت المتطلبات (مرة واحدة)
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

# 2. تهيئة البيئة
cp .env.example .env        # إن وجد، وإلا أنشئ .env بالإعدادات التالية

# 3. الترحيلات والتشغيل
./venv/bin/python manage.py migrate
./venv/bin/python manage.py runserver     # http://localhost:8000

# 4. تجربة سريعة
./venv/bin/python manage.py check
```

## إعدادات البيئة (.env) الأساسية

| المتغير | الوصف |
| --- | --- |
| `DJANGO_SETTINGS_MODULE` | `config.settings.development` (أو `production` / `testing`) |
| `SECRET_KEY` | مفتاح Django السري |
| `DATABASE_URL` | `postgres://...` (PostgreSQL عبر Supabase) |
| `SUPABASE_URL` / `SUPABASE_KEY` | الاتصال بمشروع Supabase (قاعدة بيانات + تخزين) |
| `JWT_PRIVATE_KEY_B64` / `JWT_PUBLIC_KEY_B64` | مفتاحا RSA (Base64) لتوقيع JWT |
| `OPENAI_API_KEY` / `GOOGLE_API_KEY` | مفاتيح موفّري الذكاء الاصطناعي |
| `STRIPE_SECRET_KEY` / `MYFATOORAH_API_TOKEN` / `MYFATOORAH_WEBHOOK_SECRET` | إعدادات الدفع (اتركها فارغة لتعطيل الدفع) |
| `SENTRY_DSN_BACKEND` | أداة تتبع الأخطاء Sentry |

> عند غياب `JWT_PRIVATE_KEY_B64`/`JWT_PUBLIC_KEY_B64` يولّد النظام زوج مفاتيح مؤقتاً (وضع الاختبار/CI فقط).
> في CI لا يوجد `.env` — تستخدم `config.settings.testing` قيماً افتراضية آمنة.

## الأوامر الشائعة

```bash
./venv/bin/python manage.py migrate            # تطبيق الترحيلات
./venv/bin/python manage.py makemigrations     # إنشاء ترحيلات جديدة
./venv/bin/python manage.py check              # فحص النظام
./venv/bin/python -m pytest tests/             # تشغيل الاختبارات (49+ اختباراً)
./venv/bin/ruff check apps tests config --exclude "*migrations*"   # فحص الشيفرة
./venv/bin/python manage.py createsuperuser    # حساب مشرف (لـ /admin)
```

## البذر (Seeding)

نصوص تجهّز البيانات الأولية عند الحاجة:

```bash
./venv/bin/python seed_languages.py    # اللغات المدعومة
./venv/bin/python seed_academics.py    # المراحل والمواد والمناهج
./venv/bin/python seed_plans.py        # الباقات + كتالوج الخدمات + حصص الخطة المجانية
./venv/bin/python seed_feature_flags.py
```

> بعض التهيئات تُنفَّذ أيضاً عبر ترحيلات بيانات (مثل `0002_seed_plans`, `0004_seed_plan_prices`, `0006_seed_services_and_free_limits`) لتُطبَّق تلقائياً مع `migrate`.

## بنية التطبيقات

كل وحدة في `apps/` هي تطبيق Django مستقل بنموذج `appname/apps.py`. الفهرس الكامل:

| التطبيق | الغرض |
| --- | --- |
| `apps/academics` | المراحل والمواد والمناهج والوحدات |
| `apps/ai` | نماذج الذكاء الاصطناعي، التوليد، البرومبتات، سجلات التشغيل |
| `apps/blog` | المقالات |
| `apps/core` | اللغات والترجمات ونواة النظام |
| `apps/courses` | الدورات |
| `apps/ebooks` | الكتب الإلكترونية |
| `apps/gamification` | النقاط والشارات والتحديات |
| `apps/lessonplans` | خطط الدروس (التوليد/التصدير/السوق) |
| `apps/marketplace` | خدمات السوق والطلبات والمراجعات والمدفوعات |
| `apps/pages` | الصفحات الثابتة والقوائم والقوالب والثيمات |
| `apps/subscriptions` | الباقات والاشتراكات والخدمات وحِصص الاستخدام والدفع |
| `apps/themes` | التصميمات (المظهر) |
| `apps/users` | المستخدمون والمصادقة والملف الشخصي |

## نظام الاشتراكات والخدمات

- **الباقات** `Plan`: سعر أساسي (`price`/`currency` = عملة الدفع) + `prices` (أسعار عرض لكل عملة).
- **الخدمات** `PlanService` + **الحصص** `PlanServiceLimit`: ربط الخدمة بالباقة مع حد استخدام وفترة (يومي/شهري/سنوي/مدى الحياة).
- **الاستخدام** `ServiceUsage`: عدّاد فعلي بالحجم الزمني (`period_key`)؛ الدوال في `services.py`:
  - `usage_allowed(user, code)` — فحص الصلاحية
  - `record_usage(user, code)` — زيادة العداد (تُستدعى بعد نجاح توليد خطة درس)
  - `user_usage_summary(user)` — ملخص الاستهلاك للمستخدم

نقاط النهاية الرئيسية للاشتراكات (`/api/v1/subscriptions/`):

| المسار | الصلاحية | الوصف |
| --- | --- | --- |
| `plans/` | عام | قائمة الباقات (مرتبة حسب اللغة/العملة) |
| `purchase/` | مستخدم | إنشاء اشتراك وإرجاع `checkout_url` |
| `current/` | مستخدم | اشتراك المستخدم الحالي |
| `usage/` | مستخدم | ملخص استهلاك خدمات المستخدم |
| `admin/plans/` | مشرف | إنشاء/قائمة الباقات |
| `admin/plans/<id>/` | مشرف | تعديل/حذف باقة |
| `admin/plans/<id>/services/` | مشرف | إدارة حِصص خدمات الباقة |
| `admin/services/` | مشرف | إدارة كتالوج الخدمات |

## المدفوعات

- واجهة موحّدة في `apps/marketplace/payments.py` (`get_provider()`): تختار Stripe أو MyFatoorah حسب البيئة.
- بوابات الدفع تدمج Webhook لتأكيد الدفع وتفعيل الاشتراك (`activate_subscription` في `apps/subscriptions/services.py`).
- سكربت اختبار مسار شراء كامل: `python test_checkout_flow.py --plan pro` (يتطلب `TEST_API`/`TEST_EMAIL`/`TEST_PASSWORD`).

## الوضع الاختباري

- `config/settings/testing.py`: يُولّد مفاتيح RSA تلقائياً ولا يحتاج `.env` (يُستخدم في CI).
- الترحيلات تشمل بيانات بذر تلقائياً (باقات + خدمات + حصص الخطة المجانية) في قاعدة الاختبار.
