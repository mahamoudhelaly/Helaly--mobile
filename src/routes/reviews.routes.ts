import { Router, Request, Response } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db } from "../../db";
import { reviews, orders, orderItems, products } from "../../db/schema";
import { requireAuth } from "../middleware/auth";

export const reviewsRouter = Router();

/**
 * POST /products/:productId/reviews
 * إضافة تقييم لمنتج — بشرط إن المستخدم اشترى المنتج فعلاً
 * (الطلب موجود، عنصر للمنتج ده موجود فيه، وحالة الطلب ليست "cancelled")
 */
reviewsRouter.post(
  "/products/:productId/reviews",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const productId = Number(req.params.productId);
      const { rating, comment } = req.body;

      // 1) تحقق أساسي من البيانات
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: "التقييم لازم يكون رقم من 1 إلى 5",
        });
      }

      // 2) تأكد إن المنتج موجود
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }

      // 3) التحقق الأهم: هل المستخدم اشترى المنتج ده فعلاً؟
      // نجيب كل طلبات المستخدم (غير الملغية) اللي فيها هذا المنتج
      const purchase = await db
        .select()
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.userId, userId),
            eq(orderItems.productId, productId),
            ne(orders.status, "cancelled")
          )
        )
        .limit(1);

      if (purchase.length === 0) {
        return res.status(403).json({
          error: "لازم تشتري المنتج الأول قبل ما تقدر تقيّمه",
        });
      }

      // 4) تأكد إن المستخدم لسه ما قيّمش المنتج ده قبل كده
      const [existingReview] = await db
        .select()
        .from(reviews)
        .where(
          and(eq(reviews.userId, userId), eq(reviews.productId, productId))
        )
        .limit(1);

      if (existingReview) {
        return res.status(409).json({
          error: "أنت قيّمت هذا المنتج بالفعل",
        });
      }

      // 5) إضافة التقييم
      const [newReview] = await db
        .insert(reviews)
        .values({ userId, productId, rating, comment })
        .returning();

      return res.status(201).json({
        message: "تم إضافة تقييمك بنجاح",
        review: newReview,
      });
    } catch (err) {
      console.error("خطأ في POST /products/:productId/reviews:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /products/:productId/reviews
 * عرض كل تقييمات منتج معين (عام، بدون الحاجة لتسجيل دخول)
 */
reviewsRouter.get(
  "/products/:productId/reviews",
  async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.productId);

      const productReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, productId));

      // متوسط التقييم، مفيد لعرضه في صفحة المنتج
      const averageRating =
        productReviews.length > 0
          ? productReviews.reduce((sum, r) => sum + r.rating, 0) /
            productReviews.length
          : 0;

      return res.status(200).json({
        reviews: productReviews,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: productReviews.length,
      });
    } catch (err) {
      console.error("خطأ في GET /products/:productId/reviews:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
