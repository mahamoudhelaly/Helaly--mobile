# HellyBuy — Backend API

Backend API كامل لمتجر إلكتروني للإلكترونيات، مبني بـ Express وTypeScript وDrizzle ORM، مع نظام مصادقة، سلة وطلبات، نظام ولاء، تقييمات، وأكواد خصم.

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المميزات](#المميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [بنية المشروع](#بنية-المشروع)
- [نموذج قاعدة البيانات](#نموذج-قاعدة-البيانات)
- [التشغيل محلياً](#التشغيل-محلياً)
- [نقاط الوصول (API Endpoints)](#نقاط-الوصول-api-endpoints)
- [قرارات تصميمية](#قرارات-تصميمية)

## نظرة عامة

هذا الـ API يخدم تطبيق [HellyBuy Mobile](https://github.com/mahamoudhelaly/Helaly-mobile)، وهو تطبيق React Native لمتجر إلكترونيات. يغطي الـ API دورة حياة المتجر الإلكتروني الكاملة: من التسجيل وتصفح المنتجات إلى السلة والدفع وتتبع الطلبات.

## المميزات

### المصادقة والأمان
- تسجيل/تسجيل دخول بكلمات مرور مشفّرة (bcrypt)
- مصادقة عبر JWT مع صلاحية 7 أيام
- أدوار مستخدمين (عميل / أدمن) مع حماية على مستوى الـ middleware

### المنتجات والفئات
- عرض الفئات والمنتجات مع فلترة حسب الفئة
- صفحة تفاصيل منتج تشمل معرض صور متعدد

### السلة والطلبات
- إنشاء طلبات مع حساب السعر من السيرفر (لا يُعتمد على السعر القادم من العميل)
- خصم المخزون تلقائياً ضمن معاملة قاعدة بيانات واحدة (Transaction) لمنع حالات التعارض (Race Conditions)
- ربط كل طلب بعنوان توصيل خاص بالمستخدم

### أكواد الخصم (Promo Codes)
- خصم بالنسبة أو بقيمة ثابتة
- حد أدنى لقيمة الطلب، وحد أقصى لعدد مرات الاستخدام
- التحقق من الصلاحية وتاريخ الانتهاء قبل التطبيق

### المفضلة والتقييمات
- إضافة/حذف منتجات من المفضلة
- تقييمات مقيّدة بشرط "الشراء الفعلي" (Verified Purchase) لمنع التقييمات الزائفة

## التقنيات المستخدمة

| الفئة | الأداة |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| اللغة | TypeScript |
| قاعدة البيانات | PostgreSQL (مُستضافة على [Neon](https://neon.tech)) |
| ORM | Drizzle ORM |
| المصادقة | JWT + bcrypt |
| تشغيل التطوير | tsx (watch mode) |

## بنية المشروع

```
mobile-app/
├── db/
│   ├── schema.ts        # تعريف الجداول والعلاقات
│   ├── seed.ts           # بيانات تجريبية (فئات ومنتجات)
│   └── migrations/        # ملفات SQL الناتجة عن Drizzle Kit
├── src/
│   ├── server.ts          # نقطة الدخول الرئيسية
│   ├── middleware/
│   │   └── auth.ts        # حماية المسارات (requireAuth, requireAdmin)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── products.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── addresses.routes.ts
│   │   ├── wishlist.routes.ts
│   │   ├── reviews.routes.ts
│   │   └── promoCodes.routes.ts
│   └── utils/
│       └── jwt.ts          # توليد والتحقق من الـ JWT
└── drizzle.config.ts
```

## نموذج قاعدة البيانات

11 جدول مرتبطة بعلاقات Foreign Key واضحة:

```
users ──┬── addresses
        ├── orders ──┬── order_items ── products ──┬── product_images
        │            └── transactions               ├── reviews
        ├── wishlist ─────────────────────────────────┘
        └── reviews

categories ── products

promo_codes ── orders
```

نقاط تصميمية مهمة:
- **Snapshot للسعر والاسم وقت الطلب** (`order_items.unitPriceSnapshot`, `productNameSnapshot`) — لضمان بقاء بيانات الطلبات القديمة صحيحة حتى لو تغيّر سعر المنتج لاحقاً.
- **Enums على مستوى قاعدة البيانات** لحالات الطلب والدفع (`order_status`, `payment_status`) — حماية من قيم غير صالحة.

## التشغيل محلياً

### المتطلبات
- Node.js 18+
- حساب مجاني على [Neon](https://neon.tech) (أو أي PostgreSQL آخر)

### الخطوات

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد متغيرات البيئة
cp .env.example .env
# عدّل DATABASE_URL و JWT_SECRET في .env

# 3. تطبيق الجداول على قاعدة البيانات
npm run db:generate
npm run db:migrate

# 4. إضافة بيانات تجريبية (اختياري)
npm run db:seed

# 5. تشغيل السيرفر
npm run dev
```

السيرفر يعمل على `http://localhost:3000`.

## نقاط الوصول (API Endpoints)

### Authentication
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| POST | `/auth/register` | تسجيل مستخدم جديد | عام |
| POST | `/auth/login` | تسجيل الدخول | عام |
| GET | `/auth/me` | بيانات المستخدم الحالي | مسجل دخول |

### Products & Categories
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| GET | `/categories` | عرض كل الفئات | عام |
| GET | `/products?categoryId=` | عرض المنتجات (فلترة اختيارية) | عام |
| GET | `/products/:slug` | تفاصيل منتج مع الصور | عام |

### Orders & Addresses
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| POST | `/addresses` | إضافة عنوان توصيل | مسجل دخول |
| GET | `/addresses` | عرض عناوين المستخدم | مسجل دخول |
| POST | `/orders` | إنشاء طلب جديد (يدعم `promoCode`) | مسجل دخول |
| GET | `/orders` | سجل الطلبات | مسجل دخول |
| GET | `/orders/:id` | تفاصيل طلب واحد | مسجل دخول |

### Wishlist & Reviews
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| POST | `/wishlist` | إضافة منتج للمفضلة | مسجل دخول |
| GET | `/wishlist` | عرض المفضلة | مسجل دخول |
| DELETE | `/wishlist/:productId` | حذف من المفضلة | مسجل دخول |
| POST | `/products/:productId/reviews` | إضافة تقييم (شرط الشراء) | مسجل دخول |
| GET | `/products/:productId/reviews` | عرض التقييمات + المتوسط | عام |

### Promo Codes
| Method | Endpoint | الوصف | الحماية |
|---|---|---|---|
| POST | `/promo-codes` | إنشاء كود خصم | أدمن فقط |
| GET | `/promo-codes/:code/check` | التحقق من صلاحية كود | مسجل دخول |

## قرارات تصميمية

**لماذا يُحسب السعر من السيرفر دائماً؟**
لمنع أي تلاعب من جهة العميل (Client). السيرفر يجلب سعر المنتج الحقيقي من قاعدة البيانات وقت إنشاء الطلب، بدلاً من الاعتماد على القيمة المرسلة من التطبيق.

**لماذا Transaction واحدة لإنشاء الطلب وخصم المخزون؟**
لتجنب وصول التطبيق إلى حالة غير متّسقة (مثل خصم المخزون بدون تسجيل الطلب فعليًا) في حال فشل أي خطوة وسط العملية.

**لماذا تتطلب التقييمات شراءً فعليًا (Verified Purchase)؟**
لرفع جودة وموثوقية التقييمات المعروضة للمستخدمين الآخرين، ومنع التقييمات الزائفة من حسابات لم تشترِ المنتج أصلاً.
