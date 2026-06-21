import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { generateToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

/**
 * POST /auth/register
 * تسجيل مستخدم جديد
 */
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1) تحقق أساسي من البيانات المطلوبة
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "الاسم والإيميل والباسورد مطلوبين",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "الباسورد لازم يكون 6 حروف على الأقل",
      });
    }

    // 2) تأكد إن الإيميل غير مستخدم قبل كده
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: "الإيميل ده مسجل بالفعل، جرب تسجل دخول",
      });
    }

    // 3) تشفير الباسورد (salt rounds = 10، توازن جيد بين الأمان والسرعة)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4) إضافة المستخدم لقاعدة البيانات
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        phone,
        passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    // 5) توليد Token عشان المستخدم يدخل مباشرة بعد التسجيل
    const token = generateToken({ userId: newUser.id, role: newUser.role });

    return res.status(201).json({
      message: "تم التسجيل بنجاح",
      user: newUser,
      token,
    });
  } catch (err) {
    console.error("خطأ في /auth/register:", err);
    return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
  }
});

/**
 * POST /auth/login
 * تسجيل دخول مستخدم موجود
 */
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "الإيميل والباسورد مطلوبين",
      });
    }

    // 1) البحث عن المستخدم بالإيميل
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // ملاحظة أمنية: نرجع نفس رسالة الخطأ سواء الإيميل غلط أو الباسورد غلط
    // عشان منعطيش معلومة تساعد حد يعرف إيميلات مسجلة فعلاً
    if (!user) {
      return res.status(401).json({
        error: "الإيميل أو الباسورد غير صحيح",
      });
    }

    // 2) مقارنة الباسورد المُدخل بالـ hash المخزن
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "الإيميل أو الباسورد غير صحيح",
      });
    }

    // 3) توليد Token جديد
    const token = generateToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("خطأ في /auth/login:", err);
    return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
  }
});

/**
 * GET /auth/me
 * جلب بيانات المستخدم الحالي (يستخدمها التطبيق لعرض صفحة الملف الشخصي)
 */
authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        loyaltyPoints: users.loyaltyPoints,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error("خطأ في GET /auth/me:", err);
    return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
  }
});
