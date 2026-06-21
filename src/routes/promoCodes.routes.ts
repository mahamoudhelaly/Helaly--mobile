import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { promoCodes } from "../../db/schema";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/auth";

export const promoCodesRouter = Router();

/**
 * POST /promo-codes
 * إنشاء كود خصم جديد — محمي، للأدمن فقط
 */
promoCodesRouter.post(
  "/promo-codes",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxUses,
        expiresAt,
      } = req.body;

      if (!code || !discountType || discountValue === undefined) {
        return res.status(400).json({
          error: "code و discountType و discountValue مطلوبين",
        });
      }

      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({
          error: "discountType لازم يكون percentage أو fixed",
        });
      }

      if (discountType === "percentage" && discountValue > 100) {
        return res.status(400).json({
          error: "نسبة الخصم لا يمكن أن تتجاوز 100%",
        });
      }

      const [newCode] = await db
        .insert(promoCodes)
        .values({
          code: code.toUpperCase(),
          discountType,
          discountValue: String(discountValue),
          minOrderAmount: minOrderAmount ? String(minOrderAmount) : "0",
          maxUses: maxUses ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        })
        .returning();

      return res.status(201).json({
        message: "تم إنشاء كود الخصم بنجاح",
        promoCode: newCode,
      });
    } catch (err: any) {
      console.error("خطأ في POST /promo-codes:", err);

      // كود مكرر (الكود فريد - unique constraint)
      if (err.code === "23505") {
        return res.status(409).json({ error: "هذا الكود موجود بالفعل" });
      }

      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /promo-codes/:code/check
 * التحقق من صلاحية كود قبل تطبيقه (مفيد للواجهة قبل الـ checkout)
 * متاح لأي مستخدم مسجل دخول، بدون تطبيق الكود فعلياً
 */
promoCodesRouter.get(
  "/promo-codes/:code/check",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      const [promo] = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, code.toUpperCase()))
        .limit(1);

      if (!promo || !promo.isActive) {
        return res.status(404).json({ error: "كود الخصم غير صالح" });
      }

      if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        return res.status(400).json({ error: "كود الخصم منتهي الصلاحية" });
      }

      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        return res.status(400).json({
          error: "كود الخصم وصل للحد الأقصى من الاستخدام",
        });
      }

      return res.status(200).json({
        valid: true,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: promo.minOrderAmount,
      });
    } catch (err) {
      console.error("خطأ في GET /promo-codes/:code/check:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
