import { NextResponse } from "next/server";
import { productsCatalog } from "@/lib/catalog";

export async function GET() {
  try {
    const account = (process.env.POPCUSTOMS_ACCOUNT || "").trim();
    const password = (process.env.POPCUSTOMS_PASSWORD || "").trim();
    const storeId = (process.env.POPCUSTOMS_STORE_ID || "").replace(/['"\s]/g, "").trim();

    if (!account || !password || !storeId) {
      console.warn("[POPCustoms Catalog]: Credentials missing. Using local catalog fallback.");
      return NextResponse.json(productsCatalog);
    }

    // 1. Authenticate with POPCustoms
    const loginUrl = "https://i.popcustoms.com/api/v1/login";
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ account, password })
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
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!storeResponse.ok) {
      throw new Error(`Fetch store failed with status ${storeResponse.status}`);
    }

    const storeData = await storeResponse.json();
    const rawProducts = storeData?.data?.products || storeData?.products;

    if (!rawProducts || !Array.isArray(rawProducts) || rawProducts.length === 0) {
      throw new Error("No products returned in store metadata payload");
    }

    // 3. Map retrieved products to project Catalog schema
    const mappedProducts = rawProducts.map((p: any) => {
      const variants = (p.variants || []).map((v: any) => ({
        sku: (v.sku || "").trim(),
        size: (v.size || "M").trim(),
        color: (v.color || "Black").trim(),
        weight: Number(v.weight || 180),
        dropshippingPrice: Number(v.dropshipping_price || v.price || 12.39),
        recommendPrice: Number(v.recommend_price || v.recommendPrice || (v.price ? v.price * 2 : 24.78))
      }));

      return {
        id: String(p.id || p.product_id || `pc-${Date.now()}`),
        title: String(p.name || p.title || "Cardano Custom Apparel"),
        description: String(p.description || "Made from soft, breathable, and premium fabric."),
        color: String(p.color || "Black"),
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.mockup_images || [
          "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-1-Q4py2wJnDb.jpeg"
        ]),
        variants: variants
      };
    });

    return NextResponse.json(mappedProducts);
  } catch (error: any) {
    console.warn(`[POPCustoms Sync Failed]: ${error.message}. Returning local fallback catalog.`);
    // Safe fallback to local mockup state
    return NextResponse.json(productsCatalog);
  }
}
