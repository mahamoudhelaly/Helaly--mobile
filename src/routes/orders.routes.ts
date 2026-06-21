import { Router, Request, Response } from "express";
import { eq, desc, sql, inArray, and, gt } from "drizzle-orm";
import { db } from "../../db";
import {
  orders,
  orderItems,
  products,
  addresses,
  promoCodes,
} from "../../db/schema";
import { requireAuth } from "../middleware/auth";

export const ordersRouter = Router();

/**
 * شكل البيانات المتوقع من الواجهة عند تأكيد الطلب
 */
interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

/**
 * POST /orders
 * إنشاء طلب جديد (Checkout)
 * محمي بـ requireAuth — لازم المستخدم يكون مسجل دخول
 */
ordersRouter.post(
  "/orders",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { addressId, items, promoCode } = req.body as {
        addressId: number;
        items: CreateOrderItemInput[];
        promoCode?: string;
      };

      // 1) تحقق أساسي من شكل البيانات
      if (!addressId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "لازم تحدد عنوان وتبعت قائمة منتجات (items)",
        });
      }

      // 2) تأكد إن العنوان فعلاً ملك المستخدم ده (مش عنوان شخص تاني)
      const [address] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, addressId))
        .limit(1);

      if (!address || address.userId !== userId) {
        return res.status(403).json({
          error: "العنوان غير صالح أو غير ملك لك",
        });
      }

      // 3) لو فيه كود خصم، نتحقق من صلاحيته الأساسية (الوجود والفعالية وتاريخ الانتهاء)
      // التحقق الكامل (الحد الأدنى للطلب وعدد الاستخدامات) يحصل بعد حساب subtotal داخل الـ transaction
      let promoCodeRecord: typeof promoCodes.$inferSelect | null = null;

      if (promoCode) {
        const [foundCode] = await db
          .select()
          .from(promoCodes)
          .where(eq(promoCodes.code, promoCode.toUpperCase()))
          .limit(1);

        if (!foundCode || !foundCode.isActive) {
          return res.status(400).json({ error: "كود الخصم غير صالح" });
        }

        if (foundCode.expiresAt && new Date(foundCode.expiresAt) < new Date()) {
          return res.status(400).json({ error: "كود الخصم منتهي الصلاحية" });
        }

        if (
          foundCode.maxUses !== null &&
          foundCode.usedCount >= foundCode.maxUses
        ) {
          return res.status(400).json({
            error: "كود الخصم وصل للحد الأقصى من الاستخدام",
          });
        }

        promoCodeRecord = foundCode;
      }

      // 3) كل العملية دي لازم تحصل داخل Transaction واحدة
      // لو أي خطوة فشلت (زي مخزون غير كافٍ)، كل التغييرات ترجع لورا تلقائياً
      const result = await db.transaction(async (tx) => {
        const productIds = items.map((item) => item.productId);

        // نجيب بيانات المنتجات الحقيقية من قاعدة البيانات (مش من الواجهة)
        const dbProducts = await tx
          .select()
          .from(products)
          .where(inArray(products.id, productIds));

        let subtotal = 0;
        const orderItemsData: {
          productId: number;
          productNameSnapshot: string;
          unitPriceSnapshot: string;
          quantity: number;
        }[] = [];

        // نتحقق من كل منتج: موجود؟ فعال؟ المخزون كافٍ؟
        for (const item of items) {
          const product = dbProducts.find((p) => p.id === item.productId);

          if (!product || !product.isActive) {
            throw new Error(`المنتج رقم ${item.productId} غير متاح`);
          }

          if (item.quantity <= 0) {
            throw new Error(`الكمية غير صحيحة للمنتج: ${product.name}`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `الكمية المطلوبة من "${product.name}" غير متوفرة في المخزون`
            );
          }

          const lineTotal = Number(product.price) * item.quantity;
          subtotal += lineTotal;

          orderItemsData.push({
            productId: product.id,
            productNameSnapshot: product.name,
            unitPriceSnapshot: product.price,
            quantity: item.quantity,
          });
        }

        // التحقق من الحد الأدنى للطلب بعد ما عرفنا الـ subtotal الفعلي
        let discountAmount = 0;

        if (promoCodeRecord) {
          const minAmount = Number(promoCodeRecord.minOrderAmount ?? 0);

          if (subtotal < minAmount) {
            throw new Error(
              `كود الخصم يتطلب حد أدنى للطلب ${minAmount} جنيه`
            );
          }

          discountAmount =
            promoCodeRecord.discountType === "percentage"
              ? (subtotal * Number(promoCodeRecord.discountValue)) / 100
              : Number(promoCodeRecord.discountValue);

          // الخصم لا يتجاوز قيمة الطلب نفسها
          discountAmount = Math.min(discountAmount, subtotal);
        }

        const totalPrice = subtotal - discountAmount;

        // 4) إنشاء الطلب نفسه
        const [newOrder] = await tx
          .insert(orders)
          .values({
            userId,
            addressId,
            status: "pending",
            subtotal: subtotal.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            promoCodeId: promoCodeRecord?.id ?? null,
            totalPrice: totalPrice.toFixed(2),
          })
          .returning();

        // إذا تم استخدام كود خصم، نزود عداد الاستخدام بأمان (داخل نفس الـ transaction)
        if (promoCodeRecord) {
          await tx
            .update(promoCodes)
            .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
            .where(eq(promoCodes.id, promoCodeRecord.id));
        }

        // 5) إضافة كل عناصر الطلب (order_items)
        await tx.insert(orderItems).values(
          orderItemsData.map((item) => ({
            orderId: newOrder.id,
            ...item,
          }))
        );

        // 6) خصم الكمية من المخزون لكل منتج
        for (const item of orderItemsData) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${item.quantity}`,
            })
            .where(eq(products.id, item.productId));
        }

        return newOrder;
      });

      return res.status(201).json({
        message: "تم إنشاء الطلب بنجاح",
        order: result,
      });
    } catch (err: any) {
      console.error("خطأ في /orders:", err);

      // لو الخطأ من نوع "رسالة واضحة" (زي مخزون غير كافٍ)، نرجعها للمستخدم
      if (err.message) {
        return res.status(400).json({ error: err.message });
      }

      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /orders
 * عرض كل طلبات المستخدم الحالي (سجل الطلبات)
 */
ordersRouter.get(
  "/orders",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;

      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt));

      return res.status(200).json({ orders: userOrders });
    } catch (err) {
      console.error("خطأ في GET /orders:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);

/**
 * GET /orders/:id
 * تفاصيل طلب واحد (مع عناصره)
 */
ordersRouter.get(
  "/orders/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const orderId = Number(req.params.id);

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      // تأكد إن الطلب ده فعلاً ملك المستخدم اللي طالبه
      if (!order || order.userId !== userId) {
        return res.status(404).json({ error: "الطلب غير موجود" });
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      return res.status(200).json({ order: { ...order, items } });
    } catch (err) {
      console.error("خطأ في GET /orders/:id:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
