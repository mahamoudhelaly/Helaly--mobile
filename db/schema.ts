import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* =========================================================
   ENUMS - تحكم في القيم المسموحة من جهة قاعدة البيانات
   ========================================================= */

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // الطلب اتعمل بس لسه الدفع ماتأكدش
  "received", // تم تأكيد الدفع
  "processing", // جاري التجهيز
  "shipped", // تم الشحن
  "delivered", // تم التوصيل
  "cancelled", // تم الإلغاء
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage", // خصم بنسبة % من الإجمالي
  "fixed", // خصم بقيمة ثابتة
]);

/* =========================================================
   USERS
   ========================================================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("customer"),

  // جاهز لمرحلة 2 (نظام الولاء) من غير ما نحتاج migration بعدين
  loyaltyPoints: integer("loyalty_points").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* =========================================================
   ADDRESSES
   مصمم من الأول كـ "متعدد" حتى لو هتستخدم عنوان واحد بس دلوقتي
   ========================================================= */

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  label: varchar("label", { length: 50 }).default("home"), // home / work / other
  fullName: varchar("full_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  area: varchar("area", { length: 150 }),
  street: text("street").notNull(),
  buildingDetails: text("building_details"), // رقم العمارة، الدور، إلخ

  isDefault: boolean("is_default").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   CATEGORIES
   ========================================================= */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // للروابط/الـ SEO
  imageUrl: varchar("image_url", { length: 500 }),
  sortOrder: integer("sort_order").notNull().default(0), // ترتيب ظهور الأقسام

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   PRODUCTS
   ========================================================= */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),

  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  description: text("description"),

  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* =========================================================
   PRODUCT IMAGES
   جدول منفصل بدل عمود واحد، عشان الـ Carousel (صور متعددة)
   ========================================================= */

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  imageUrl: varchar("image_url", { length: 500 }).notNull(), // WebP
  sortOrder: integer("sort_order").notNull().default(0), // ترتيب الصور في السلايدر
});

/* =========================================================
   ORDERS
   ========================================================= */

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  addressId: integer("address_id")
    .notNull()
    .references(() => addresses.id, { onDelete: "restrict" }),

  status: orderStatusEnum("status").notNull().default("pending"),

  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  // الكود المستخدم في هذا الطلب (لو موجود) — مفيد للتقارير والتتبع
  promoCodeId: integer("promo_code_id").references(() => promoCodes.id, {
    onDelete: "set null",
  }),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* =========================================================
   ORDER ITEMS
   نسجل اسم المنتج وسعره وقت الطلب (snapshot) عشان لو
   المنتج تغير سعره أو اتمسح بعدين، الطلب القديم يفضل صحيح
   ========================================================= */

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),

  productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
  unitPriceSnapshot: numeric("unit_price_snapshot", {
    precision: 10,
    scale: 2,
  }).notNull(),
  quantity: integer("quantity").notNull(),
});

/* =========================================================
   TRANSACTIONS
   ========================================================= */

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "restrict" }),

  provider: varchar("provider", { length: 50 }).notNull(), // "stripe" | "paymob"
  providerTransactionId: varchar("provider_transaction_id", {
    length: 255,
  }), // الـ ID الراجع من الـ payment gateway

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   PROMO CODES
   ========================================================= */

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // مثلاً: SAVE20

  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(), // لو percentage: قيمتها من 0-100، لو fixed: قيمة بالجنيه

  // أقل قيمة للطلب عشان الكود يسري (اختياري)
  minOrderAmount: numeric("min_order_amount", {
    precision: 10,
    scale: 2,
  }).default("0"),

  // أقصى عدد مرات استخدام للكود إجمالاً (اختياري، null = غير محدود)
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),

  expiresAt: timestamp("expires_at"), // تاريخ انتهاء الصلاحية (اختياري)
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   WISHLIST
   جدول بسيط: ربط بين user و product
   نمنع تكرار نفس المنتج لنفس المستخدم بقيد فريد (unique)
   ========================================================= */

export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   REVIEWS
   تقييم المستخدم لمنتج معين (1-5 نجوم + تعليق نصي)
   ========================================================= */

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  rating: integer("rating").notNull(), // من 1 إلى 5
  comment: text("comment"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================================================
   RELATIONS (لتسهيل الاستعلامات بـ Drizzle ORM)
   ========================================================= */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
  wishlist: many(wishlist),
  reviews: many(reviews),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  orderItems: many(orderItems),
  wishlistedBy: many(wishlist),
  reviews: many(reviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  promoCode: one(promoCodes, {
    fields: [orders.promoCodeId],
    references: [promoCodes.id],
  }),
  items: many(orderItems),
  transactions: many(transactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, { fields: [wishlist.userId], references: [users.id] }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  orders: many(orders),
}));
