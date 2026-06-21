import { Router, Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { wishlist, products, productImages } from "../../db/schema";
import { requireAuth } from "../middleware/auth";

export const wishlistRouter = Router();

/**
 * POST /wishlist
 * إضافة منتج لقائمة المفضلة
 */
wishlistRouter.post(
  "/wishlist",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "productId مطلوب" });
      }

      // تأكد إن المنتج فعلاً موجود
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }

      // تأكد إنه مش مضاف بالفعل (نمنع التكرار)
      const [existing] = await db
        .select()
        .from(wishlist)
        .where(
          and(eq(wishlist.userId, userId), eq(wishlist.productId, productId))
        )
        .limit(1);

      if (existing) {
        return res.status(409).json({
          error: "المنتج موجود بالفعل في المفضلة",
        });
      }

      const [newItem] = await db
        .insert(wishlist)
        .values({ userId, productId })
        .returning();

      return res.status(201).json({
        message: "تمت إضافة المنتج للمفضلة",
        item: newItem,
      });
    } catch (err) {
      console.error("خطأ في POST /wishlist:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /wishlist
 * عرض كل منتجات المفضلة للمستخدم الحالي (مع صورة وسعر كل منتج)
 */
wishlistRouter.get(
  "/wishlist",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const items = await db
        .select({
          wishlistId: wishlist.id,
          productId: products.id,
          name: products.name,
          slug: products.slug,
          price: products.price,
        })
        .from(wishlist)
        .innerJoin(products, eq(wishlist.productId, products.id))
        .where(eq(wishlist.userId, userId));

      // نجيب صورة واحدة لكل منتج (للعرض في القائمة)
      const itemsWithImage = await Promise.all(
        items.map(async (item) => {
          const [image] = await db
            .select()
            .from(productImages)
            .where(eq(productImages.productId, item.productId))
            .limit(1);

          return { ...item, imageUrl: image?.imageUrl ?? null };
        })
      );

      return res.status(200).json({ wishlist: itemsWithImage });
    } catch (err) {
      console.error("خطأ في GET /wishlist:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * DELETE /wishlist/:productId
 * حذف منتج من المفضلة
 */
wishlistRouter.delete(
  "/wishlist/:productId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const productId = Number(req.params.productId);

      const deleted = await db
        .delete(wishlist)
        .where(
          and(eq(wishlist.userId, userId), eq(wishlist.productId, productId))
        )
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({
          error: "المنتج غير موجود في المفضلة",
        });
      }

      return res.status(200).json({ message: "تم حذف المنتج من المفضلة" });
    } catch (err) {
      console.error("خطأ في DELETE /wishlist/:productId:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
