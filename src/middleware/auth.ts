import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";

// نوسع نوع Request الأساسي عشان نضيف بيانات المستخدم بعد التحقق
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware يتحقق من وجود Token صحيح في الـ Header
 * يستخدم في أي route عايز تحميه (زي: إنشاء طلب، عرض بيانات المستخدم)
 *
 * طريقة الاستخدام في الـ route:
 *   router.get("/me", requireAuth, (req, res) => { ... })
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // الـ Token المتوقع يكون في الشكل: "Authorization: Bearer xxxxx"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "غير مصرح — لازم تسجل دخول الأول",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    // نحط بيانات المستخدم في الـ request عشان الـ route اللي بعده يستخدمها
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "الـ Token غير صالح أو منتهي الصلاحية — سجل دخول تاني",
    });
  }
}

/**
 * Middleware يتحقق من إن المستخدم "admin"
 * لازم يُستخدم بعد requireAuth في نفس الـ route:
 *   router.post("/promo-codes", requireAuth, requireAdmin, (req, res) => { ... })
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      error: "هذا الإجراء يتطلب صلاحية أدمن",
    });
  }
  next();
}
