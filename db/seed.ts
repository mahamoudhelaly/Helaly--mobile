import { db } from "./index";
import { categories, products, productImages } from "./schema";

async function seed() {
  console.log("🌱 بدء إضافة البيانات التجريبية...");

  // 1) فئات إلكترونيات (HellyBuy متجر إلكترونيات متكامل)
  const insertedCategories = await db
    .insert(categories)
    .values([
      {
        name: "هواتف ذكية",
        slug: "smartphones",
        sortOrder: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
      },
      {
        name: "لابتوبات",
        slug: "laptops",
        sortOrder: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      },
      {
        name: "شاشات",
        slug: "monitors",
        sortOrder: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop",
      },
      {
        name: "سماعات",
        slug: "headphones",
        sortOrder: 4,
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      },
      {
        name: "ساعات ذكية",
        slug: "smartwatches",
        sortOrder: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
      },
      {
        name: "إكسسوارات",
        slug: "accessories",
        sortOrder: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1583863788434-e62bd6c93986?w=400&h=400&fit=crop",
      },
    ])
    .returning();

  console.log(`✅ تمت إضافة ${insertedCategories.length} فئة`);

  const [smartphones, laptops, monitors, headphones, smartwatches, accessories] =
    insertedCategories;

  // 2) منتجات بأسماء وموديلات حقيقية (للاستخدام التعليمي/الشخصي المحلي فقط)
  const insertedProducts = await db
    .insert(products)
    .values([
      // ===== هواتف ذكية =====
      {
        categoryId: smartphones.id,
        name: "Apple iPhone 17 Pro Max",
        slug: "iphone-17-pro-max",
        description:
          "شاشة 6.9 بوصة LTPO Super Retina XDR OLED بمعدل تحديث 120Hz، معالج Apple A19 Pro، كاميرا ثلاثية Fusion بدقة 48 ميجابكسل، هيكل ألومنيوم متين، مقاوم للماء IP68.",
        price: "78000.00",
        stock: 12,
      },
      {
        categoryId: smartphones.id,
        name: "Samsung Galaxy S25 Ultra",
        slug: "samsung-galaxy-s25-ultra",
        description:
          "شاشة AMOLED ديناميكية 6.8 بوصة بمعدل تحديث 120Hz، قلم S Pen مدمج، كاميرا رباعية بدقة 200 ميجابكسل، معالج Snapdragon فائق الأداء.",
        price: "62000.00",
        stock: 14,
      },
      {
        categoryId: smartphones.id,
        name: "Xiaomi 15 Ultra",
        slug: "xiaomi-15-ultra",
        description:
          "نظام كاميرا Leica من الجيل التالي، شاشة AMOLED WQHD+، معالج Snapdragon 8 Elite، حماية Gorilla Glass 7i مع طبقة مضادة للانعكاس.",
        price: "45000.00",
        stock: 16,
      },
      {
        categoryId: smartphones.id,
        name: "Samsung Galaxy A56 5G",
        slug: "samsung-galaxy-a56-5g",
        description:
          "هاتف متوسط الفئة بشاشة AMOLED، شحن سريع 45 وات، أداء قوي للاستخدام اليومي بسعر مناسب.",
        price: "18500.00",
        stock: 30,
      },
      {
        categoryId: smartphones.id,
        name: "Xiaomi Redmi Note 14 Pro",
        slug: "xiaomi-redmi-note-14-pro",
        description:
          "هاتف اقتصادي قوي بشاشة AMOLED 120Hz، بطارية ضخمة بشحن سريع، أداء سلس للاستخدام اليومي والتطبيقات.",
        price: "9800.00",
        stock: 40,
      },
      // ===== لابتوبات =====
      {
        categoryId: laptops.id,
        name: "Apple MacBook Pro 14 M4",
        slug: "macbook-pro-14-m4",
        description:
          "معالج Apple M4 فائق الكفاءة، شاشة Liquid Retina XDR، بطارية تدوم طوال اليوم، مثالي للتصميم والمونتاج والبرمجة.",
        price: "85000.00",
        stock: 8,
      },
      {
        categoryId: laptops.id,
        name: "Dell XPS 15",
        slug: "dell-xps-15",
        description:
          "لابتوب أعمال فاخر بشاشة InfinityEdge، معالج Intel Core i7، تصميم معدني أنيق وأداء قوي للمهام الاحترافية.",
        price: "58000.00",
        stock: 10,
      },
      {
        categoryId: laptops.id,
        name: "ASUS ROG Strix G18",
        slug: "asus-rog-strix-g18",
        description:
          "لابتوب جيمنج بشاشة 18 بوصة معدل تحديث عالي، كرت رسومات قوي، نظام تبريد متقدم لتجربة لعب استثنائية.",
        price: "72000.00",
        stock: 6,
      },
      // ===== شاشات =====
      {
        categoryId: monitors.id,
        name: "LG UltraGear 27GR75FG",
        slug: "lg-ultragear-27gr75fg",
        description:
          "شاشة جيمنج 27 بوصة بدقة Full HD ومعدل تحديث 144Hz، زمن استجابة منخفض جداً مثالية لمحبي الألعاب التنافسية.",
        price: "9500.00",
        stock: 18,
      },
      {
        categoryId: monitors.id,
        name: "Samsung Odyssey G9",
        slug: "samsung-odyssey-g9",
        description:
          "شاشة منحنية 49 بوصة بدقة DQHD، انحناء 1000R غامر، معدل تحديث فائق لتجربة جيمنج لا مثيل لها.",
        price: "24000.00",
        stock: 5,
      },
      // ===== سماعات =====
      {
        categoryId: headphones.id,
        name: "Sony WH-1000XM5",
        slug: "sony-wh-1000xm5",
        description:
          "سماعة رأس لاسلكية بعزل ضوضاء رائد في فئته، جودة صوت استثنائية، وراحة فائقة للاستخدام الطويل.",
        price: "8500.00",
        stock: 22,
      },
      {
        categoryId: headphones.id,
        name: "Apple AirPods Pro 2",
        slug: "airpods-pro-2",
        description:
          "سماعات أذن لاسلكية بعزل ضوضاء نشط متقدم، صوت مكاني، وعلبة شحن ذكية بمقاومة للماء.",
        price: "6200.00",
        stock: 35,
      },
      // ===== ساعات ذكية =====
      {
        categoryId: smartwatches.id,
        name: "Apple Watch Series 10",
        slug: "apple-watch-series-10",
        description:
          "ساعة ذكية بشاشة أكبر وأرفع تصميم، مستشعرات صحية متقدمة لتتبع القلب والنوم، مقاومة للماء بالكامل.",
        price: "14500.00",
        stock: 20,
      },
      // ===== إكسسوارات =====
      {
        categoryId: accessories.id,
        name: "شاحن سريع 65 وات USB-C",
        slug: "fast-charger-65w-usbc",
        description: "شاحن متوافق مع أغلب الأجهزة، يدعم الشحن السريع لتوفير الوقت.",
        price: "650.00",
        stock: 60,
      },
      {
        categoryId: accessories.id,
        name: "كيبورد ميكانيكي للألعاب RGB",
        slug: "mechanical-gaming-keyboard-rgb",
        description:
          "كيبورد ميكانيكي بإضاءة RGB واستجابة سريعة، مصمم خصيصاً لمحبي الألعاب.",
        price: "2400.00",
        stock: 25,
      },
    ])
    .returning();

  console.log(`✅ تمت إضافة ${insertedProducts.length} منتج`);

  // 3) صور من Unsplash (مجانية للاستخدام التجاري، آمنة قانونياً)
  const imageMap: Record<string, string> = {
    "iphone-17-pro-max":
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop",
    "samsung-galaxy-s25-ultra":
      "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=600&h=600&fit=crop",
    "xiaomi-15-ultra":
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop",
    "samsung-galaxy-a56-5g":
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=600&fit=crop",
    "xiaomi-redmi-note-14-pro":
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=600&fit=crop",
    "macbook-pro-14-m4":
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop",
    "dell-xps-15":
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop",
    "asus-rog-strix-g18":
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&h=600&fit=crop",
    "lg-ultragear-27gr75fg":
      "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=600&h=600&fit=crop",
    "samsung-odyssey-g9":
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=600&fit=crop",
    "sony-wh-1000xm5":
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "airpods-pro-2":
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
    "apple-watch-series-10":
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
    "fast-charger-65w-usbc":
      "https://images.unsplash.com/photo-1583863788434-e62bd6c93986?w=600&h=600&fit=crop",
    "mechanical-gaming-keyboard-rgb":
      "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=600&h=600&fit=crop",
  };

  for (const product of insertedProducts) {
    const imageUrl =
      imageMap[product.slug] ??
      `https://placehold.co/600x600?text=${encodeURIComponent(product.name)}`;

    await db.insert(productImages).values([
      {
        productId: product.id,
        imageUrl,
        sortOrder: 0,
      },
    ]);
  }

  console.log("✅ تمت إضافة صور المنتجات");
  console.log("🎉 انتهت عملية الـ Seed بنجاح");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ حصل خطأ أثناء الـ seed:", err);
  process.exit(1);
});
