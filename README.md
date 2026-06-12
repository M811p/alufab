# AluFab Cloud — منصة تصنيع الألمنيوم والزجاج

نظام SaaS متكامل لمصانع الألمنيوم والزجاج: تصميم مرئي ← تسعير تلقائي (ضريبة 15%) ← قوائم تقطيع محسّنة ← اعتماد وخصم مخزون ← إنتاج ← فوترة.

---

## 🚀 التشغيل المحلي (3 خطوات فقط)

**المتطلبات:** Node.js 20+ و PostgreSQL (محلي أو Supabase).

### الخطوة 1 — تثبيت الحزم
```bash
npm install
```

### الخطوة 2 — ضبط قاعدة البيانات
افتح ملف `.env` (يُنشأ تلقائياً في الخطوة التالية إن لم يوجد — أو انسخه الآن من `.env.example`) وعدّل سطراً واحداً:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alufab"
```

### الخطوة 3 — الإعداد التلقائي ثم التشغيل
```bash
npm run setup    # يولّد AUTH_SECRET + ينشئ الجداول + يزرع البيانات الأولية
npm run dev      # ثم افتح http://localhost:3000
```

**حساب تجريبي جاهز للدخول فوراً:**
| البريد | كلمة المرور |
|---|---|
| `admin@demo.sa` | `Demo12345678` |

> `npm run setup` آمن لإعادة التشغيل — إذا فشل الاتصال بقاعدة البيانات سيخبرك بالسبب والحل بالضبط.

---

## ☁️ النشر على Vercel + Supabase (خطوة بخطوة)

### أولاً: قاعدة البيانات على Supabase
1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com) (الخطة المجانية تكفي).
2. من **Project Settings → Database → Connection string** انسخ صيغة **URI**.
3. استخدم **منفذ 6543 (Transaction pooler)** وأضف `?pgbouncer=true` لنهاية الرابط:
   ```
   postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. من جهازك، أنشئ الجداول والبيانات الأولية مرة واحدة (استخدم هنا **منفذ 5432 المباشر** بدون pgbouncer):
   ```bash
   DATABASE_URL="<الرابط المباشر 5432>" npx prisma db push
   DATABASE_URL="<الرابط المباشر 5432>" npx tsx prisma/seed.ts
   ```

### ثانياً: النشر على Vercel
1. ارفع المشروع إلى GitHub.
2. في [vercel.com](https://vercel.com) اختر **Add New → Project** واستورد المستودع (Vercel يتعرف على Next.js تلقائياً — لا تغيّر شيئاً).
3. في **Environment Variables** أضف ثلاثة متغيرات:
   | المتغير | القيمة |
   |---|---|
   | `DATABASE_URL` | رابط pooler منفذ 6543 من الخطوة 3 أعلاه |
   | `AUTH_SECRET` | ناتج الأمر `npx auth secret` أو أي نص عشوائي 32+ حرف |
   | `NEXT_PUBLIC_APP_URL` | `https://اسم-مشروعك.vercel.app` |
4. اضغط **Deploy**. انتهى — `prisma generate` يعمل تلقائياً ضمن البناء.

---

## 📖 الأوامر المتاحة

| الأمر | الوظيفة |
|---|---|
| `npm run setup` | إعداد كامل تلقائي (بيئة + جداول + بذور) |
| `npm run dev` | تشغيل التطوير المحلي |
| `npm run build` | بناء الإنتاج |
| `npm run db:push` | مزامنة الجداول مع المخطط |
| `npm run db:seed` | إعادة زرع البيانات الأولية |

## 🔌 مرجع الـ API

| المسار | الطريقة | الوصف | الأدوار |
|---|---|---|---|
| `/api/auth/register` | POST | تسجيل مصنع + أول ADMIN | عام |
| `/api/auth/accept-invite` | POST | قبول دعوة عضو | عام (برمز) |
| `/api/team` | GET | الأعضاء والدعوات المعلقة | ADMIN, MANAGER |
| `/api/team/invite` | POST | دعوة عضو — يُرجع رابط `/join` | ADMIN |
| `/api/team/:id` | PATCH/DELETE | تغيير دور / تعطيل عضو | ADMIN |
| `/api/clients` و `/api/clients/:id` | CRUD | إدارة العملاء | الجميع (الحذف للإدارة) |
| `/api/projects` | GET/POST | المشاريع مع فلترة بالحالة | الجميع |
| `/api/projects/:id/status` | GET/PATCH | آلة الحالات + خصم/إرجاع المخزون | حسب الانتقال |
| `/api/quotations` | POST | حساب + تسعير + BOM في معاملة واحدة | الجميع |
| `/api/invoices` | GET/POST/PATCH | فواتير INV-YYYY-#### | حسب العملية |

## 🔄 آلة حالات المشروع
```
DRAFT → QUOTED → APPROVED → PRODUCTION → INSTALLATION → COMPLETED
          ↑↓        ↑↓ (سحب الاعتماد يعيد المخزون تلقائياً)
```
الاعتماد يتطلب BOM ويفحص كفاية المخزون (تجاوز العجز بـ `allowNegativeStock: true`).

## 🛠️ حل المشاكل الشائعة

- **`P1001: Can't reach database`** → PostgreSQL لا يعمل أو `DATABASE_URL` خاطئ.
- **`prepared statement already exists` على Vercel** → نسيت `?pgbouncer=true` في رابط منفذ 6543.
- **`Invalid AUTH_SECRET`** → شغّل `npm run setup` محلياً، أو أضف المتغير في Vercel.
- **رابط الدعوة يحوّل لتسجيل الدخول** → تأكد أن `NEXT_PUBLIC_APP_URL` يطابق نطاق النشر.

## 🔒 ملاحظات أمنية
`tenantId` يُستمد حصراً من جلسة JWT — عزل كامل بين المصانع. رموز الدعوات SHA-256 وتنتهي خلال 72 ساعة. كلمات المرور bcrypt (cost 12). لا يمكن تعطيل آخر ADMIN ولا تعديل المستخدم لدوره بنفسه.
