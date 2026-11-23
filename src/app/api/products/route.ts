import { NextResponse } from "next/server";
import { productsCatalog, Product, ShowroomCategory } from "@/lib/catalog";

interface POPCustomsVariant {
  sku?: string;
  size?: string;
  color?: string;
  weight?: number | string;
  dropshipping_price?: number | string;
  price?: number | string;
  recommend_price?: number | string;
  recommendPrice?: number | string;
}

interface POPCustomsProduct {
  id?: string | number;
  product_id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  color?: string;
  category?: string;
  images?: string[];
  mockup_images?: string[];
  variants?: POPCustomsVariant[];
}

function inferShowroomCategory(rawTitle: string, rawCategory?: string): ShowroomCategory {
  const haystack = `${rawTitle} ${rawCategory || ""}`.toLowerCase();
  if (
    haystack.includes("mug") ||
    haystack.includes("tumbler") ||
    haystack.includes("cup") ||
    haystack.includes("glass") ||
    haystack.includes("bottle")
  ) {
    return "drinkware";
  }
  if (
    haystack.includes("tote") ||
    haystack.includes("bag") ||
    haystack.includes("case") ||
    haystack.includes("phone") ||
    haystack.includes("notebook") ||
    haystack.includes("journal") ||
    haystack.includes("flask") ||
    haystack.includes("mousepad") ||
    haystack.includes("mat") ||
    haystack.includes("coaster") ||
    haystack.includes("knife")
  ) {
    return "gear";
  }
  return "clothing";
}

function inferEyebrow(category: ShowroomCategory, title: string): string {
  const lower = title.toLowerCase();
  if (category === "drinkware") return "Insulated Vault Vessel";
  if (category === "gear") return "Sovereign Hardware & Carry";
  if (lower.includes("hoodie") || lower.includes("sweatshirt")) return "Heavyweight Pullover Hoodie";
  return "Unisex Heavyweight Tee";
}

export async function GET() {
  try {
    const account = (process.env.POPCUSTOMS_ACCOUNT || "").trim();
    const password = (process.env.POPCUSTOMS_PASSWORD || "").trim();
    const storeId = (process.env.POPCUSTOMS_STORE_ID || "").replace(/['"\s]/g, "").trim();

    if (!account || !password || !storeId) {
      console.warn("[POPCustoms Catalog]: Credentials missing. Using local showroom catalog.");
      return NextResponse.json(productsCatalog);
    }

    // 1. Authenticate with POPCustoms
    const loginUrl = "https://i.popcustoms.com/api/v1/login";
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ account, password }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData?.data?.token;

    if (!token) {
      throw new Error("Token missing from login response");
    }

    // 2. Fetch Store Info & Products
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}`;
    const storeResponse = await fetch(popCustomsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!storeResponse.ok) {
      throw new Error(`Fetch store failed with status ${storeResponse.status}`);
    }

    const storeData = await storeResponse.json();
    const rawProducts = storeData?.data?.products || storeData?.products;

    if (!rawProducts || !Array.isArray(rawProducts) || rawProducts.length === 0) {
      throw new Error("No products returned in store metadata payload");
    }

    // 3. Map retrieved products to Showroom Product schema and merge curated showroom walls
    const mappedProducts: Product[] = rawProducts.map((p: POPCustomsProduct) => {
      const title = String(p.name || p.title || "Cardano Custom Apparel");
      const category = inferShowroomCategory(title, p.category);
      const variants = (p.variants || []).map((v: POPCustomsVariant) => ({
        sku: (v.sku || "").trim(),
        size: (v.size || "M").trim(),
        color: (v.color || "Black").trim(),
        weight: Number(v.weight || 180),
        dropshippingPrice: Number(v.dropshipping_price || v.price || 12.39),
        recommendPrice: Number(
          v.recommend_price || v.recommendPrice || (v.price ? Number(v.price) * 2 : 24.78)
        ),
      }));

      // Prefer local hanger-ready studio image when product matches our flagship SKU
      const matchingLocal = productsCatalog.find(
        (local) =>
          local.id === String(p.id || p.product_id) ||
          local.title.toLowerCase() === title.toLowerCase() ||
          local.variants.some((lv) => variants.some((rv) => rv.sku === lv.sku))
      );

      const resolvedImages =
        matchingLocal
          ? matchingLocal.images
          : Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : p.mockup_images || ["/showroom/products/tee-cardano-doodle.png"];

      return {
        id: String(p.id || p.product_id || `pc-${Date.now()}`),
        title,
        description: String(p.description || "Made from soft, breathable, and premium fabric."),
        color: String(p.color || matchingLocal?.color || "Obsidian Black"),
        colorHex: matchingLocal?.colorHex || "#181B22",
        category: matchingLocal?.category || category,
        eyebrow: matchingLocal?.eyebrow || inferEyebrow(category, title),
        era: matchingLocal?.era || "Cardano Vault Release",
        fabricSpec: matchingLocal?.fabricSpec || "Heavyweight 220 GSM · Archival Print",
        specs: matchingLocal?.specs || [
          "Premium Organic Cotton",
          "Heavyweight 220 GSM",
          "Eco-Friendly Print",
          "Ethical Production",
        ],
        images: resolvedImages,
        variants: variants.length > 0 ? variants : productsCatalog[0].variants,
      };
    });

    // Ensure showroom walls stay populated if live store currently exposes only 1 SKU
    const existingIds = new Set(mappedProducts.map((p) => p.id));
    const existingTitles = new Set(mappedProducts.map((p) => p.title.toLowerCase()));
    const supplementedCatalog: Product[] = [
      ...mappedProducts,
      ...productsCatalog.filter(
        (local) => !existingIds.has(local.id) && !existingTitles.has(local.title.toLowerCase())
      ),
    ];

    return NextResponse.json(supplementedCatalog);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[POPCustoms Sync Failed]: ${errorMessage}. Returning local showroom catalog.`);
    return NextResponse.json(productsCatalog);
  }
}
