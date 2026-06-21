import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL مش موجود في ملف .env — لازم تضيفه الأول"
  );
}

// عميل الاتصال بقاعدة البيانات
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // أقصى عدد اتصالات في الـ pool (يكفي للتطوير)
});

// تصدير db عشان نستخدمه في كل أنحاء المشروع
// مثال استخدام: db.select().from(users)
export const db = drizzle(client, { schema });
