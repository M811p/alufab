# AluFab Cloud — منصة تصنيع الألمنيوم والزجاج

نظام **SaaS متعدد المستأجرين** مصمّم خصيصاً لمصانع الألمنيوم والزجاج في السوق السعودي والخليجي. يغطي الدورة الكاملة من الرسم الفني إلى الفاتورة النهائية.

---

## المميزات الرئيسية

| الوحدة | الوصف |
|---|---|
| **مصمم مرئي ثنائي الأبعاد** | رسم النوافذ والواجهات بأبعاد حقيقية مع حساب مقاسات القص والزجاج لحظياً |
| **محرك الحسابات الهندسية** | خصميات الحلق والضلف وفق بروفايلات ALUPCO / Technal / Schuco / Reynaers |
| **تقطيع ذكي (1D Nesting)** | خوارزمية First-Fit Decreasing لتحسين استهلاك قضبان 6 متر وتقليل الهدر |
| **تسعير أوتوماتيكي** | هامش ربح + ضريبة القيمة المضافة 15% (لائحة هيئة الزكاة والضريبة) |
| **قوائم المواد (BOM)** | توليد وحفظ BOM كاملة مرتبطة بعرض السعر مع قائمة التقطيع |
| **آلة حالات المشروع** | DRAFT → QUOTED → APPROVED → PRODUCTION → INSTALLATION → COMPLETED |
| **إدارة المخزون** | خصم تلقائي عند اعتماد المشروع وإعادة إضافة عند سحب الاعتماد |
| **الفوترة** | فواتير مرقّمة INV-YYYY-#### مع ضريبة منفصلة |
| **دعوات الفريق** | رموز مشفّرة SHA-256 بصلاحية 72 ساعة، قابلة للمشاركة عبر واتساب |
| **WhatsApp API** | توليد رسائل وروابط wa.me لإرسال عروض الأسعار مباشرة للعملاء |
| **عزل كامل بين المصانع** | كل مصنع (Tenant) بياناته مستقلة تماماً — `tenantId` من JWT فقط |

---

## المتطلبات

| الأداة | الإصدار الأدنى |
|---|---|
| Node.js | 20 LTS أو أحدث |
| PostgreSQL | 15 أو أحدث (محلي أو Supabase) |
| npm | 10 أو أحدث |

---

## التشغيل المحلي السريع

```bash
# 1. تثبيت الحزم
npm install

# 2. عدّل DATABASE_URL في .env بعد نسخه من .env.example
cp .env.example .env
# افتح .env وغيّر DATABASE_URL لقاعدة بياناتك

# 3. الإعداد التلقائي (يولّد AUTH_SECRET + ينشئ الجداول + يزرع البيانات)
npm run setup

# 4. تشغيل بيئة التطوير
npm run dev
```

افتح المتصفح على `http://localhost:3000`

**حساب تجريبي جاهز:**

| البريد | كلمة المرور |
|---|---|
| `admin@demo.sa` | `Demo12345678` |

---

## متغيرات البيئة

| المتغير | الوصف | مثال |
|---|---|---|
| `DATABASE_URL` | اتصال PostgreSQL | `postgresql://user:pass@localhost:5432/alufab` |
| `AUTH_SECRET` | مفتاح JWT (32+ حرف عشوائي) | يُولَّد تلقائياً بـ `npm run setup` |
| `NEXT_PUBLIC_APP_URL` | رابط المنصة (لروابط الدعوات) | `https://myapp.vercel.app` |

---

## أوامر npm

| الأمر | الوظيفة |
|---|---|
| `npm run setup` | إعداد كامل تلقائي — الأمر الوحيد الذي تحتاجه للبداية |
| `npm run dev` | تشغيل بيئة التطوير المحلية |
| `npm run build` | بناء إصدار الإنتاج |
| `npm run start` | تشغيل إصدار الإنتاج |
| `npm run lint` | فحص الكود بـ ESLint |
| `npm run db:push` | مزامنة مخطط Prisma مع قاعدة البيانات |
| `npm run db:migrate` | إنشاء migration جديدة |
| `npm run db:seed` | إعادة زرع البيانات الأولية |

---

## النشر على Vercel + Supabase

### 1. قاعدة البيانات (Supabase)

1. أنشئ مشروعاً على [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI** — انسخ الرابط.
3. من جهازك المحلي فقط (استخدم منفذ 5432 المباشر — بدون pgbouncer):
   ```bash
   DATABASE_URL="postgresql://postgres:[pass]@[host]:5432/postgres" npx prisma db push
   DATABASE_URL="postgresql://postgres:[pass]@[host]:5432/postgres" npx tsx prisma/seed.ts
   ```

### 2. النشر على Vercel

1. ارفع المستودع إلى GitHub.
2. في [vercel.com](https://vercel.com): **Add New → Project** → استورد المستودع.
3. أضف متغيرات البيئة الثلاثة:

   | المتغير | القيمة |
   |---|---|
   | `DATABASE_URL` | رابط Supabase pooler منفذ **6543** + `?pgbouncer=true` |
   | `AUTH_SECRET` | نص عشوائي 32+ حرف (مخرج `npx auth secret`) |
   | `NEXT_PUBLIC_APP_URL` | `https://اسم-مشروعك.vercel.app` |

4. اضغط **Deploy** — `prisma generate` يعمل تلقائياً أثناء البناء.

> **ملاحظة Supabase:** استخدم دائماً منفذ **6543 مع `?pgbouncer=true`** في Vercel، و**5432 بدونها** للأوامر المحلية.

---

## مرجع الـ API

| المسار | الطريقة | الوصف | الأدوار المطلوبة |
|---|---|---|---|
| `/api/auth/register` | POST | تسجيل مصنع جديد مع أول ADMIN | عام |
| `/api/auth/accept-invite` | POST | قبول دعوة عضو | عام (برمز الدعوة) |
| `/api/team` | GET | الأعضاء + الدعوات المعلّقة | ADMIN, MANAGER |
| `/api/team/invite` | POST | إرسال دعوة — يُرجع رابط `/join` مرة واحدة | ADMIN |
| `/api/team/:id` | PATCH | تغيير دور عضو | ADMIN |
| `/api/team/:id` | DELETE | تعطيل عضو (Soft delete) | ADMIN |
| `/api/clients` | GET, POST | قائمة/إضافة عملاء | جميع الأدوار |
| `/api/clients/:id` | GET, PATCH, DELETE | عمليات عميل محدد | GET/PATCH: الجميع؛ DELETE: ADMIN, MANAGER |
| `/api/projects` | GET, POST | قائمة/إنشاء مشاريع (فلترة بالحالة) | جميع الأدوار |
| `/api/projects/:id/status` | GET | الحالة الحالية + الانتقالات المتاحة للدور | جميع الأدوار |
| `/api/projects/:id/status` | PATCH | نقل المشروع لحالة جديدة | حسب الانتقال |
| `/api/quotations` | POST | حساب + تسعير + BOM في معاملة واحدة | جميع الأدوار |
| `/api/invoices` | GET | قائمة الفواتير (فلتر `?unpaid=true`) | جميع الأدوار |
| `/api/invoices` | POST | إصدار فاتورة من عرض معتمد | ESTIMATOR, MANAGER, ADMIN |
| `/api/invoices` | PATCH | تحديث حالة السداد | MANAGER, ADMIN |

---

## آلة حالات المشروع

```
DRAFT → QUOTED → APPROVED → PRODUCTION → INSTALLATION → COMPLETED
          ↑↓         ↑↓
     (إعادة المسودة)  (سحب الاعتماد يُعيد المخزون تلقائياً)
```

| الانتقال | الأدوار المخوّلة |
|---|---|
| DRAFT → QUOTED | ESTIMATOR, MANAGER, ADMIN |
| QUOTED → APPROVED | MANAGER, ADMIN |
| APPROVED → PRODUCTION | PRODUCTION, MANAGER, ADMIN |
| PRODUCTION → INSTALLATION | PRODUCTION, MANAGER, ADMIN |
| INSTALLATION → COMPLETED | MANAGER, ADMIN |
| أي انتقال عكسي | MANAGER, ADMIN |

**شرط الاعتماد:** يجب توليد BOM أولاً. النظام يفحص كفاية المخزون تلقائياً — يمكن تجاوز العجز بـ `allowNegativeStock: true`.

---

## هيكل المشروع

```
src/
├── app/
│   ├── (auth)/              # صفحات تسجيل الدخول/التسجيل/الانضمام
│   ├── (dashboard)/         # الواجهات المحمية (dashboard, designer, ...)
│   ├── api/                 # مسارات API (Next.js Route Handlers)
│   ├── layout.tsx           # Layout الجذر (خط IBM Plex Arabic + RTL)
│   └── providers.tsx        # SessionProvider
├── lib/
│   ├── auth.ts              # NextAuth + requireSession / requireRole
│   └── prisma.ts            # Prisma client singleton
├── services/
│   ├── calculation-engine.ts  # حسابات قص الألمنيوم (First-Fit Decreasing)
│   ├── quotation-engine.ts    # التسعير + ضريبة 15%
│   ├── bom-generator.ts       # توليد وحفظ BOM + خصم المخزون
│   ├── project-workflow.ts    # آلة الحالات + صلاحيات الأدوار
│   └── whatsapp-service.ts    # رسائل wa.me + تطبيع أرقام الجوال
└── types/
    ├── index.ts             # أنواع مشتركة (ProjectStatus, UserRole, ...)
    ├── deduction.ts         # IDeductionProfile + Zod schema
    └── next-auth.d.ts       # تمديد أنواع JWT/Session
prisma/
├── schema.prisma            # نموذج قاعدة البيانات (PostgreSQL)
└── seed.ts                  # بيانات أولية: مصنع تجريبي + 5 بروفايلات + مخزون
```

---

## الأمان والأداء

- **عزل المستأجرين:** `tenantId` يُستمد حصراً من JWT — لا يُقبل من العميل.
- **كلمات المرور:** bcrypt (cost 12).
- **رموز الدعوات:** SHA-256، صالحة 72 ساعة فقط، تُعرض مرة واحدة.
- **آخر ADMIN:** محمي بمعاملة Serializable — لا يمكن تعطيله أو إزالة دوره.
- **JWT:** 8 ساعات (وردية عمل) — يُجدَّد تلقائياً عند كل طلب.
- **الفواتير:** ترقيم سنوي داخل معاملة Serializable يمنع التكرار.

---

## حل المشاكل الشائعة

| الخطأ | الحل |
|---|---|
| `P1001: Can't reach database` | PostgreSQL لا يعمل أو `DATABASE_URL` خاطئ |
| `prepared statement already exists` | نسيت `?pgbouncer=true` مع منفذ 6543 على Supabase |
| `Invalid AUTH_SECRET` | شغّل `npm run setup` أو أضف المتغير في Vercel |
| رابط الدعوة يحوّل لصفحة الدخول | تأكد أن `NEXT_PUBLIC_APP_URL` يطابق نطاق النشر |
| `P2002: Unique constraint` على InventoryItem | الـ SKU مكرر لنفس المصنع — كل مصنع له فضاء SKU مستقل |

---

## رفع المشروع على GitHub

```bash
# 1. تهيئة المستودع (إن لم يكن موجوداً)
git init
git branch -M main

# 2. إضافة الملفات (لا تُضاف .env تلقائياً بفضل .gitignore)
git add .
git commit -m "feat: initial AluFab Cloud release"

# 3. ربط مستودع GitHub الجديد
git remote add origin https://github.com/YOUR_USERNAME/alufab-cloud.git

# 4. رفع الكود
git push -u origin main
```

> **مهم:** تأكد أن ملف `.env` **غير مرفوع** — `.gitignore` يستبعده تلقائياً. أضف متغيرات البيئة مباشرة في لوحة Vercel.

---

## الترخيص

هذا المشروع خاص — جميع الحقوق محفوظة.
