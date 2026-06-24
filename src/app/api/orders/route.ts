import { NextResponse } from "next/server";

interface CartItem {
  sku?: string;      // e.g., "N79G24RY-3" (Direct Complete SKU)
  baseSku?: string;  // e.g., "N79G24RY" (Decoupled Sku)
  size?: string;     // e.g., "L"
  quantity: number;
}

interface ShippingData {
  name?: string;
  address?: string;
  phone_number?: string;
  city?: string;
  state?: string;
  country_code?: string;
  zip_code?: string;
  email?: string;
}

interface IncomingRequestBody {
  cart?: CartItem[];
  shipping?: ShippingData;
}

interface ProductDetails {
  size: string;
  weight: number;
  price: string;
}

// Immutable inventory matrix compiled directly from cardano-black-shirt.xlsx
const SKU_MASTER_DATABASE: Record<string, ProductDetails> = {
  "N79G24RY-3": { size: "S", weight: 160, price: "12.39" },
  "N79G24RY-4": { size: "M", weight: 180, price: "12.39" },
  "N79G24RY-1": { size: "L", weight: 200, price: "12.39" },
  "N79G24RY-2": { size: "XL", weight: 220, price: "12.39" },
  "N79G24RY-5": { size: "2XL", weight: 240, price: "12.39" },
  "N79G24RY-6": { size: "3XL", weight: 260, price: "13.39" },
  "N79G24RY-7": { size: "4XL", weight: 280, price: "13.39" },
  "N79G24RY-8": { size: "5XL", weight: 300, price: "13.39" }
};

// Fallback lookup dictionary if the frontend only passes base SKU and Size strings
const SIZE_TO_SUFFIX_MAP: Record<string, string> = {
  "S": "-3", "SMALL": "-3",
  "M": "-4", "MEDIUM": "-4",
  "L": "-1", "LARGE": "-1",
  "XL": "-2", "EXTRA LARGE": "-2",
  "2XL": "-5", "XXL": "-5",
  "3XL": "-6", "XXXL": "-6",
  "4XL": "-7", "XXXXL": "-7",
  "5XL": "-8", "XXXXXL": "-8"
};

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json() || {};

    // 1. Ingest and sanitize server credentials
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { success: false, message: "CONFIGURATION EXCEPTION: Core fulfillment API credentials or Store IDs are missing from the environment variables." },
        { status: 500 }
      );
    }

    // 2. Validate structural initialization of incoming arrays
    if (!body.cart || !Array.isArray(body.cart) || body.cart.length === 0) {
      return NextResponse.json(
        { success: false, message: "VALIDATION ERROR: Cart collection payload is missing, empty, or structurally corrupted." },
        { status: 400 }
      );
    }

    const timestampId = Date.now();
    const orderNumber = `ADA-${timestampId}`;

    // 3. Defensive sanitization of customer parameters
    const rawName = (body.shipping?.name || "Customer Receiver").trim();
    const nameParts = rawName.split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Receiver";

    const cleanPhone = (body.shipping?.phone_number || "+10000000000").replace(/[^\d+]/g, "");
    const cleanEmail = (body.shipping?.email || "billing@cardano-merch.vercel.app").trim();
    const cleanAddress = (body.shipping?.address || "Missing Address Line 1").trim();
    const cleanCity = (body.shipping?.city || "Missing City").trim();
    const cleanState = (body.shipping?.state || "WY").trim();
    const cleanZip = (body.shipping?.zip_code || "82001").trim();
    const cleanCountry = (body.shipping?.country_code || "US").toUpperCase().trim();

    // 4. Dynamic line-item mapping engine compatible with multiple frontend cart variants
    const resolvedLineItems = body.cart.map((item, index) => {
      let finalSku = "";
      let productMeta: ProductDetails = { size: "Unknown", weight: 200, price: "12.39" };

      if (item.sku) {
        // Path A: Frontend passed a complete direct SKU string
        finalSku = item.sku.trim();
        if (SKU_MASTER_DATABASE[finalSku]) {
          productMeta = SKU_MASTER_DATABASE[finalSku];
        }
      } else if (item.baseSku && item.size) {
        // Path B: Frontend passed decoupled base and size fields
        const base = item.baseSku.trim().split("-")[0];
        const sizeToken = item.size.trim().toUpperCase();
        const suffix = SIZE_TO_SUFFIX_MAP[sizeToken] || "-3";
        finalSku = `${base}${suffix}`;

        if (SKU_MASTER_DATABASE[finalSku]) {
          productMeta = SKU_MASTER_DATABASE[finalSku];
        } else {
          productMeta.size = sizeToken;
        }
      } else {
        // Path C: Emergency fallback case to prevent item processing failures
        finalSku = "N79G24RY-3";
        productMeta = SKU_MASTER_DATABASE[finalSku];
      }

      return {
        id: timestampId + index,
        variant_id: null,
        product_id: null,
        sku: finalSku,
        quantity: Number(item.quantity || 1),
        price: productMeta.price,
        title: `Cardano Doodle + Logo Design - Black (Size ${productMeta.size})`,
        grams: productMeta.weight,
        requires_shipping: true
      };
    });

    // 5. Build vendor-compliant request payload payload mapping
    const popCustomsPayload = {
      id: timestampId,
      id_str: String(timestampId),
      order_number: orderNumber,
      number: orderNumber,
      name: orderNumber,
      email: cleanEmail,
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: null,
      shipping_method: "Standard",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      line_items: resolvedLineItems,

      shipping_address: {
        name: rawName,
        first_name: firstName,
        last_name: lastName,
        address1: cleanAddress,
        address_2: "",
        city: cleanCity,
        state: cleanState,
        province: cleanState,
        province_code: cleanState.substring(0, 2).toUpperCase(),
        zip: cleanZip,
        country_code: cleanCountry,
        country: cleanCountry,
        phone: cleanPhone
      },

      billing_address: {
        name: rawName,
        first_name: firstName,
        last_name: lastName,
        address1: cleanAddress,
        address_2: "",
        city: cleanCity,
        state: cleanState,
        province: cleanState,
        province_code: cleanState.substring(0, 2).toUpperCase(),
        zip: cleanZip,
        country_code: cleanCountry,
        country: cleanCountry,
        phone: cleanPhone
      }
    };

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 6. Dispatch transaction request with clean Bearer Authorization tokens
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-topic": "orders/paid"
      },
      body: JSON.stringify(popCustomsPayload)
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: unknown;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Rejection - Code ${popCustomsResponse.status}]:`, popCustomsData);
      return NextResponse.json(
        {
          success: false,
          message: `PROTOCOL ERROR: TRANSIT SECTOR REJECTION. Upstream Details: ${JSON.stringify(popCustomsData)}`,
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData
        },
        { status: popCustomsResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Runtime Exception Block Triggered]:", error);
    return NextResponse.json(
      {
        success: false,
        message: "PROTOCOL ERROR: Internal application handler collapse",
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}