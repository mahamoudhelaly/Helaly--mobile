import "dotenv/config";
import express from "express";
import { authRouter } from "./routes/auth.routes";
import { productsRouter } from "./routes/products.routes";
import { ordersRouter } from "./routes/orders.routes";
import { addressesRouter } from "./routes/addresses.routes";
import { wishlistRouter } from "./routes/wishlist.routes";
import { reviewsRouter } from "./routes/reviews.routes";
import { promoCodesRouter } from "./routes/promoCodes.routes";

const app = express();

// عشان السيرفر يقدر يقرا JSON من body الطلبات
app.use(express.json());

// مسار اختباري بسيط، عشان تتأكد إن السيرفر شغال
app.get("/", (req, res) => {
  res.json({ message: "Helaly App API شغال 🚀" });
});

// ربط مسارات Authentication تحت /auth
app.use("/auth", authRouter);

// ربط مسارات المنتجات والفئات (بدون prefix، فهي مباشرة: /categories, /products)
app.use("/", productsRouter);

// ربط مسارات الطلبات (/orders) والعناوين (/addresses)
app.use("/", ordersRouter);
app.use("/", addressesRouter);

// ربط مسارات المفضلة (/wishlist) والتقييمات (/products/:id/reviews)
app.use("/", wishlistRouter);
app.use("/", reviewsRouter);

// ربط مسارات أكواد الخصم (/promo-codes)
app.use("/", promoCodesRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});
