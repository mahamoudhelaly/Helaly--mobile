import { Router, Request, Response } from "express";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db";
import { categories, products, productImages } from "../../db/schema";

export const productsRouter = Router();

/**
 * GET /categories
 * عرض كل الفئات، مرتبة حسب sortOrder
 * (تستخدم في صفحة الفئات الرئيسية)
 */
productsRouter.get("/categories", async (req: Request, res: Response) => {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));

    return res.status(200).json({ categories: allCategories });
  } catch (err) {
    console.error("خطأ في /categories:", err);
    return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
  }
});

/**
 * GET /products
 * عرض المنتجات (مع إمكانية الفلترة بالفئة)
 * مثال: /products?categoryId=2
 *
 * يرجع صورة واحدة بس لكل منتج (الأولى) — كفاية لعرض الـ Grid/List
 * صفحة التفاصيل هي اللي تجيب كل الصور
 */
productsRouter.get("/products", async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;

    // نبني شرط الفلترة بس لو categoryId موجود في الطلب
    const allProducts = categoryId
      ? await db
          .select()
          .from(products)
          .where(eq(products.categoryId, Number(categoryId)))
          .orderBy(asc(products.id))
      : await db.select().from(products).orderBy(asc(products.id));

    // نجيب صورة واحدة (الأولى) لكل منتج، عشان عرض الـ Grid يكون خفيف وسريع
    const productsWithImage = await Promise.all(
      allProducts.map(async (product) => {
        const [firstImage] = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, product.id))
          .orderBy(asc(productImages.sortOrder))
          .limit(1);

        return {
          ...product,
          imageUrl: firstImage?.imageUrl ?? null,
        };
      })
    );

    return res.status(200).json({ products: productsWithImage });
  } catch (err) {
    console.error("خطأ في /products:", err);
    return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
  }
});

/**
 * GET /products/:slug
 * تفاصيل منتج واحد (PDP) — يشمل كل الصور للـ Carousel
 */
productsRouter.get(
  "/products/:slug",
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }

      // كل صور المنتج، مرتبة حسب sortOrder (للـ Carousel)
      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder));

      return res.status(200).json({
        product: {
          ...product,
          images: images.map((img) => img.imageUrl),
        },
      });
    } catch (err) {
      console.error("خطأ في /products/:slug:", err);
      return res.status(500).json({ error: "حصل خطأ داخلي، حاول تاني" });
    }
  }
);
