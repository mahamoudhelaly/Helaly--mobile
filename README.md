# Helaly App — Backend

## خطوات التشغيل (بالترتيب)

### 1. تثبيت الحزم
```bash
npm install
```

### 2. إعداد ملف .env
انسخ `.env.example` وسمّيه `.env`، واملأ القيم:

```bash
cp .env.example .env
```

ثم افتح `.env` وضع فيه:
- `DATABASE_URL` — رابط قاعدة بيانات PostgreSQL (من Neon مثلاً)
- `JWT_SECRET` — نص عشوائي طويل وسري (20+ حرف)
- `PORT` — رقم المنفذ (اختياري، افتراضي 3000)

### 3. تطبيق الجداول على قاعدة البيانات
```bash
npm run db:generate
npm run db:migrate
```

### 4. إضافة بيانات تجريبية (اختياري)
```bash
npm run db:seed
```

### 5. تشغيل السيرفر
```bash
npm run dev
```

السيرفر هيشتغل على: `http://localhost:3000`

---

## نقاط الوصول المتاحة (Endpoints)

### `POST /auth/register`
تسجيل مستخدم جديد.

**Body:**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "123456",
  "phone": "01012345678"
}
```

### `POST /auth/login`
تسجيل الدخول.

**Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "123456"
}
```

كلاهما يرجّع `token` تستخدمه في باقي الطلبات المحمية عن طريق:
```
Authorization: Bearer <token>
```

---

## أدوات مفيدة أثناء التطوير

```bash
npm run db:studio   # واجهة بصرية لقاعدة البيانات
```
