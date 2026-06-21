import jwt from "jsonwebtoken";

// لازم يكون موجود في .env — نص عشوائي طويل وسري
// لو غير موجود، نوقف تشغيل السيرفر فوراً (أفضل من تشغيله بشكل غير آمن)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET مش موجود في ملف .env — لازم تضيفه قبل تشغيل السيرفر"
  );
}

// الحمولة (Payload) اللي هنخزنها داخل كل Token
export interface TokenPayload {
  userId: number;
  role: "customer" | "admin";
}

/**
 * توليد Token جديد لمستخدم بعد تسجيل الدخول بنجاح
 * الـ Token صلاحيته 7 أيام، بعدها المستخدم لازم يسجل دخول تاني
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}

/**
 * التحقق من صحة Token وفك تشفيره
 * يرمي error لو الـ Token غير صالح أو منتهي الصلاحية
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET!) as TokenPayload;
}
