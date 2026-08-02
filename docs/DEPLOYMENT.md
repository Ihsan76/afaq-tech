# النشر — دليل Cloudflare Tunnel (مجاني، بدون خادم خارجي)

يشرح هذا الدليل نشر آفاق تكنولوجي مجانياً من هذه الآلة نفسها عبر **Cloudflare Tunnel**:
يعمل خلف NAT، SSL مجاني تلقائياً، يستخدم الدومين `afaq.app`، ولا يتطلب فتح منافذ.

البنية النهائية:

```
الإنترنت -> Cloudflare (afaq.app) --> cloudflared -> frontend (Next, :3000)
           Cloudflare (api.afaq.app) -> cloudflared -> backend (Gunicorn, :8000)
                                          + redis (داخل الشبكة)
```

## المتطلبات

- الدومين `afaq.app` مضاف إلى حساب Cloudflare (يمكن نقله مجاناً أو إضافة نطاق فرعي).
- `docker` و `docker compose` مثبتان.
- قيم env للـ backend جاهزة (`backend/.env`).

## الخطوات

### 1) إنشاء الـ Tunnel والحصول على Token

1. ادخل إلى **Cloudflare Dashboard > Zero Trust > Networks > Tunnels > Create a tunnel**.
2. اختر **Cloudflared** ثم انسخ الـ **Token** (لا تنشئ أي أمر تشغيل، سنشغّله داخل Docker).
3. انتقل لعلامة **Public Hostnames** وأضف:
   - `afaq.app` → Service: `HTTP` → `http://frontend:3000`
   - `api.afaq.app` → Service: `HTTP` → `http://backend:8000`
   (بعد أول تشغيل للـ compose ستُحَل الأسماء `frontend` و`backend` تلقائياً داخل شبكة Docker.)

### 2) ضبط env

- انسخ `.env.production.example` إلى `.env` في جذر المستودع وعبّئ `CLOUDFLARE_TUNNEL_TOKEN` و`NEXT_PUBLIC_*`.
- انسخ `backend/.env.example` إلى `backend/.env` (أو حدّث الموجود) مع القيم الحقيقية.

### 3) البناء والتشغيل

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

عند أول تشغيل ينفّذ الـ backend تلقائياً `migrate` و`collectstatic` (عبر `entrypoint.sh`).

### 4) الفحص

```bash
curl -s https://api.afaq.app/api/v1/core/health/        # -> {"status":"ok",...}
curl -sI https://afaq.app/                              # -> 200
docker compose -f docker-compose.prod.yml logs -f backend frontend cloudflared
```

## العمليات اليومية

| العملية | الأمر |
|---|---|
| سجلّات | `docker compose -f docker-compose.prod.yml logs -f` |
| إعادة تشغيل | `docker compose -f docker-compose.prod.yml restart` |
| تحديث بعد تغيير | `docker compose -f docker-compose.prod.yml up -d --build` |
| نسخ احتياطي لقاعدة البيانات | `pg_dump "$DATABASE_URL" \| gzip > backup-$(date +%F).sql.gz` |
| إيقاف | `docker compose -f docker-compose.prod.yml down` |

## أمانات أساسية

- `DJANGO_SECRET_KEY` قيمتها جديدة وقوية — لا تشاركها.
- أبقِ `DEBUG=False` في الإنتاج.
- لا ترفع `backend/.env` أو `.env` إلى git (مستبعدة في `.gitignore` و`.dockerignore`).
- `SENTRY_DSN_BACKEND` مفعّل في الإنتاج إذا وُجدت القيمة.

## بديل مستقبلي: VPS حقيقي

عند الحاجة لخادم دائم (وسعة أكبر)، نفس ملفات Docker صالحة مباشرة على أي VPS:
مجلد المشروع + `.env` + `docker compose -f docker-compose.prod.yml up -d --build`،
مع استبدال cloudflared بـ Nginx + Let's Encrypt أو إبقاء الـ tunnel.
