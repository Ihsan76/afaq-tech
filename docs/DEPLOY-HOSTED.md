# النشر المستضاف — Vercel + Render (مجاني بالكامل)

بديل النفق: يستضيف الموقع على سيرفرات طرف ثالث لا تحتاج جهازك شغّالاً.

```
الإنترنت → Cloudflare
  ├─ afaq.app      → Vercel (Next.js frontend)
  ├─ api.afaq.app  → Render (Django + Gunicorn)
قاعدة البيانات: Supabase (Postgres دائم)
Redis: Upstash (مجاني)
```

## الخطوات

### 1) GitHub (مرة واحدة)
```bash
gh auth login          # تسجيل الدخول
gh repo create afaq-tech --private --source . --push
```

### 2) Upstash (Redis مجاني)
1. أنشئ حساباً في upstash.com → **Create Database** (نوع Redis، أقرب منطقة).
2. انسخ **REST URL** بالصيغة `rediss://default:...@...upstash.io` → سيكون `REDIS_URL`.

### 3) Render — الباكند
الخيار الأسهل (بدون ملفات):
- **New Web Service** → Connect GitHub repo `afaq-tech` → Root Directory: `backend` → Runtime: **Docker**.
- Render يبني `backend/Dockerfile` تلقائياً ويعمل `entrypoint.sh` (migrate + collectstatic + gunicorn).
- أضف المتغيرات التالية (القيم من `backend/.env`):

| المتغير | القيمة |
|---|---|
| DJANGO_SETTINGS_MODULE | `config.settings.production` |
| DJANGO_SECRET_KEY | قيمة جديدة قوية |
| DATABASE_URL | من Supabase |
| SUPABASE_URL / SUPABASE_KEY | من Supabase |
| REDIS_URL | من Upstash |
| JWT_PRIVATE_KEY_B64 / JWT_PUBLIC_KEY_B64 | من `.env` |
| GEMINI_API_KEY / RESEND_API_KEY | من `.env` |
| SENTRY_DSN_BACKEND | من `.env` (اختياري) |
| ALLOWED_HOSTS | `afaq.app,www.afaq.app,api.afaq.app` |
| CORS_ALLOWED_ORIGINS | `https://afaq.app,https://www.afaq.app` |
| FRONTEND_URL | `https://afaq.app` |
| GUNICORN_WORKERS | `1` (ذاكرة التخطيط المجاني 512MB) |

- **Health Check Path**: `/api/v1/core/health/`.
- يظل الخدمة تنام بعد 15 دقيقة خمول على التخطيط المجاني (برودة 30-60 ث) — مقبول لفترة التطوير.

### 4) Vercel — الفرونت
- **New Project** → Import GitHub repo → Framework: **Next.js** → Root Directory: `frontend`.
- أضف متغيرات البيئة:
  - `NEXT_PUBLIC_API_URL=https://api.afaq.app/api/v1`
  - `NEXT_PUBLIC_SITE_URL=https://afaq.app`
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_KEY` (من `frontend/.env.local`)
- أول بناء سيعمل حتى لو لم يكن `api.afaq.app` جاهزاً بعد (sitemap يتحمّل).

### 5) DNS في Cloudflare
- **afaq.app** → CNAME إلى `cname.vercel-dns.com` (Proxied).
- **api.afaq.app** → عدّل سجل CNAME القديم ليشير إلى `<خدمتك>.onrender.com` (Proxied) — احذف سجل `week1-backend.onrender.com` القديم.
- احذف أي Hostname routes أضيفت للنفق `afaq-prod` (لا تعد هناك حاجة للنفق).

### 6) التحقق
```bash
curl -s https://api.afaq.app/api/v1/core/health/   # {"status":"ok",...}
curl -sI https://afaq.app/                          # 200
```
ثم أوقف النفق المحلي:
```bash
docker compose -f docker-compose.prod.yml down
```

## ملاحظات
- تخطيط Vercel Hobby غير تجاري — عند الإيرادات الحقيقية يلزم Pro ($20).
- قاعدة بيانات Supabase دائمة ومجانية — لا تنتهي (على عكس Postgres في Render).
- رفع الآلة ذاتها يبقى النفق كخيار احتياطي (دليل DEPLOYMENT.md).
