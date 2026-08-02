# النشر المستضاف — Vercel + Render (مجاني بالكامل)

بديل النفق: يستضيف الموقع على سيرفرات طرف ثالث لا تحتاج جهازك شغّالاً.

```
الإنترنت → Cloudflare (edge — وسيط يتجاوز حظر الشبكات)
  ├─ afaq.app / www.afaq.app  → Vercel (Next.js frontend)
  ├─ api.afaq.app             → Render (Django + Gunicorn)
DNS: النطاق في Cloudflare (تحوّل الـ NS من Namecheap إلى Cloudflare)
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
- **`DJANGO_SECRET_KEY`**: لا تُدوّره بعد النشر إذا كانت مفاتيح AI في Supabase مشفّرة به (سيُعطّل فك التشفير). غيّره فقط ثم أعد تشفير البيانات.

### 4) Vercel — الفرونت
- **New Project** → Import GitHub repo → Framework: **Next.js** → Root Directory: `frontend`.
- أضف متغيرات البيئة:
  - `NEXT_PUBLIC_API_URL=https://api.afaq.app/api/v1`
  - `NEXT_PUBLIC_SITE_URL=https://afaq.app`
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_KEY` (من `frontend/.env.local`)
- أول بناء سيعمل حتى لو لم يكن `api.afaq.app` جاهزاً بعد (sitemap يتحمّل).

### 5) نقل النطاق إلى Cloudflare (إلزامي)
ليست مجرد سجلات — النطاق **كله** ينتقل إلى Cloudflare ليصبح الوسيط أمام الفرونت (بعض الشبكات تحظر عناوين Vercel نفسها؛ إدخال Cloudflare يتجاوزها لأن المتصفح يتصل بـ Cloudflare وهو يجلب من Vercel من خوادمه).

1. **Cloudflare**: Add site → `afaq.app` → خطة **Free** → انسخ اسمَي nameservers.
2. **Namecheap**: Domain List → Nameservers → Custom DNS → استبدل `dns1/dns2.registrar-servers.com` باسمَي Cloudflare.
3. **سجلات Cloudflare** (Proxied=برتقالي للويب فقط):

| النوع | الاسم | القيمة | Proxied |
|---|---|---|---|
| `CNAME` | `@` | `92117e5bf0e3e63c.vercel-dns-017.com` (من Vercel) | ✅ |
| `CNAME` | `www` | `92117e5bf0e3e63c.vercel-dns-017.com` | ✅ |
| `CNAME` | `api` | `<خدمتك>.onrender.com` (الجديدة، وليس القديمة) | ✅ |
| `MX` | `@` | `eforward1..5.registrar-servers.com` (10,10,10,15,20) | ❌ |
| `TXT` | `@` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | ❌ |

- سجلا `@` و`www`: استخدم **القيمة التي يعرضها Vercel** في Domain panel (جديدة مثل `92117e5bf0e3e63c.vercel-dns-017.com`). السجلان القديمان `cname.vercel-dns.com` و`76.76.21.21` يظلان يعملان، لكن لا تخلط: **لا يمكن وجود A وCNAME على نفس الاسم** — احذف أي `A @` إن أضفته.
- لا تحذف MX/TXT حتى يستمر بريد Namecheap (إعادة توجيه).
- **SSL/TLS ← Overview → Full (strict)**.

> ملاحظة: بعد نقل الـ NS تصبح كل سجلات Namecheap معطّلة — أعد كل شيء في Cloudflare فقط.

### 6) ربط الدومين في Vercel
- Project → Settings → **Domains** → أضف `afaq.app` و`www.afaq.app`.
- إن ظهرت *"This domain is linked to another Vercel account"*: أضف سجل **TXT** عند `_vercel` بالقيمة `vc-domain-verify=...` (يعرضها Vercel) ثم **Refresh** — تحل نقل الملكية.
- تأكد `NEXT_PUBLIC_API_URL=https://api.afaq.app/api/v1`.

### 7) نقل Custom Domain في Render (خطوة حرجة)
تغيير CNAME في Namecheap **وحده لا ينقل الربط** — يجب نقل ملكية النطاق داخل لوحة Render:
1. الخدمة القديمة (مثل `week1-backend`) → Settings → Custom Domains → **احذف** `api.afaq.app`.
2. الخدمة الجديدة → Settings → Custom Domains → **أضف** `api.afaq.app`.
3. انتظر إصدار الشهادة (~دقيقتان). **أثناء الإصدار**: HTTPS = TLS handshake failure، HTTP = **409**، ثم بعدها 200.
4. تحقق: `curl -s https://api.afaq.app/api/v1/core/health/` → 200.

### 8) التحقق النهائي
```bash
curl -sI https://api.afaq.app/api/v1/core/health/   # 200
curl -sL -o /dev/null -w "%{http_code}\n" https://afaq.app/          # 200
curl -sI https://www.afaq.app/                      # 307 → /en
curl -s "https://api.afaq.app/api/v1/pages/menu/header/?locale=ar"   # 200 (قوائم)
```
ثم أوقف النفق المحلي إن بقي شغّالاً:
```bash
docker compose -f docker-compose.prod.yml down
```

## ملاحظات
- تخطيط Vercel Hobby غير تجاري — عند الإيرادات الحقيقية يلزم Pro ($20).
- قاعدة بيانات Supabase دائمة ومجانية — لا تنتهي (على عكس Postgres في Render).
- رفع الآلة ذاتها يبقى النفق كخيار احتياطي (دليل DEPLOYMENT.md).
- **تحذير "Dangerous site" (Brave/Chrome)**: قد يكون النطاق مُدرجاً في Google Safe Browsing (خصوصاً `www` أو `api`). الحل: تحقق الملكية في Google Search Console (سجل TXT `google-site-verification` في Cloudflare) ثم اطلب مراجعة من `https://transparencyreport.google.com/safe-browsing/search?url=<النطاق>` — تظهر النتيجة خلال 1–3 أيام.
