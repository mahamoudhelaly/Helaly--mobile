import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  // مكان ملف الـ schema اللي عملناه
  schema: "./db/schema.ts",

  // فين تتخزن ملفات الـ migration الناتجة
  out: "./db/migrations",

  dialect: "postgresql",

  dbCredentials: {
    // لازم يكون متعرف في ملف .env
    url: process.env.DATABASE_URL!,
  },

  // يطبع تفاصيل أكتر وقت التشغيل (مفيد وقت التطوير)
  verbose: true,
  strict: true,
});
