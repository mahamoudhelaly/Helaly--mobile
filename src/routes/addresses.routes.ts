import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { addresses } from "../../db/schema";
import { requireAuth } from "../middleware/auth";

export const addressesRouter = Router();

/**
 * POST /addresses
 * إضافة عنوان جديد للمستخدم الحالي
 */
addressesRouter.post(
  "/addresses",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { label, fullName, phone, city, area, street, buildingDetails } =
        req.body;

      if (!fullName || !phone || !city || !street) {
        return res.status(400).json({
          error: "الاسم، الهاتف، المدينة، والشارع مطلوبين",
        });
      }

      const [newAddress] = await db
        .insert(addresses)
        .values({
          userId,
          label: label ?? "home",
          fullName,
          phone,
          city,
          area,
          street,
          buildingDetails,
        })
        .returning();

      return res.status(201).json({
        message: "تم إضافة العنوان بنجاح",
        address: newAddress,
      });
    } catch (err) {
      console.error("خطأ في /addresses:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /addresses
 * عرض كل عناوين المستخدم الحالي
 */
addressesRouter.get(
  "/addresses",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const userAddresses = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId));

      return res.status(200).json({ addresses: userAddresses });
    } catch (err) {
      console.error("خطأ في GET /addresses:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
