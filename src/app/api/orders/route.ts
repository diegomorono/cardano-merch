import { NextResponse } from "next/server";

interface CartItem {
  baseSku: string;   // e.g., "N79G24RY"
  size: string;      // e.g., "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"
  quantity: number;
}

interface ShippingData {
  name: string;
  address: string;
  phone_number: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  email: string;
}

interface IncomingRequestBody {
  cart: CartItem[];
  shipping: ShippingData;
}

interface VariantMetadata {
  suffix: string;
  weight: number;
  price: string;
}

// Ground truth data specification derived directly from cardano-black-shirt.xlsx
const VARIANT_REGISTRY: Record<string, VariantMetadata> = {
  "S": { suffix: "-3", weight: 160, price: "12.39" },
  "SMALL": { suffix: "-3", weight: 160, price: "12.39" },

  "M": { suffix: "-4", weight: 180, price: "12.39" },
  "MEDIUM": { suffix: "-4", weight: 180, price: "12.39" },

  "L": { suffix: "-1", weight: 200, price: "12.39" },
  "LARGE": { suffix: "-1", weight: 200, price: "12.39" },

  "XL": { suffix: "-2", weight: 220, price: "12.39" },
  "EXTRA LARGE": { suffix: "-2", weight: 220, price: "12.39" },

  "2XL": { suffix: "-5", weight: 240, price: "12.39" },
  "XXL": { suffix: "-5", weight: 240, price: "12.39" },

  "3XL": { suffix: "-6", weight: 260, price: "13.39" },
  "XXXL": { suffix: "-6", weight: 260, price: "13.39" },

  "4XL": { suffix: "-7", weight: 280, price: "13.39" },
  "XXXXL": { suffix: "-7", weight: 280, price: "13.39" },

  "5XL": { suffix: "-8", weight: 300, price: "13.39" },
  "XXXXXL": { suffix: "-8", weight: 300, price: "13.39" }
};

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json();

    // 1. Ingest and sanitize server credentials to prevent 401 string errors
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { success: false, message: "CONFIGURATION EXCEPTION: Core fulfillment API credentials or Store IDs are missing from the environment." },
        { status: 500 }
      );
    }

    const timestampId = Date.now();
    const orderNumber = `ADA-${timestampId}`;

    const nameParts = body.shipping.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Receiver";
    const cleanPhone = body.shipping.phone_number.replace(/[^\d+]/g, "") || "+10000000000";

    // 2. Transform the items based on the true matrix inside cardano-black-shirt.xlsx
    const resolvedLineItems = body.cart.map((item, index) => {
      const cleanBase = item.baseSku.trim().split("-")[0];
      const normalizedSize = item.size.trim().toUpperCase();

      // Look up true metadata profile or apply fallback default to Small configuration
      const variantConfig = VARIANT_REGISTRY[normalizedSize] || { suffix: "-3", weight: 160, price: "12.39" };
      const absoluteSku = `${cleanBase}${variantConfig.suffix}`;

      return {
        id: timestampId + index,
        variant_id: null,
        product_id: null,
        sku: absoluteSku,
        quantity: Number(item.quantity),
        price: variantConfig.price,
        title: `Cardano Doodle + Logo Design - Black (Size ${normalizedSize})`,
        grams: variantConfig.weight,
        requires_shipping: true
      };
    });

    // 3. Format payload compliant with the vendor schema guidelines
    const popCustomsPayload = {
      id: timestampId,
      id_str: String(timestampId),
      order_number: orderNumber,
      number: orderNumber,
      name: orderNumber,
      email: body.shipping.email.trim(),
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: null,
      shipping_method: "Standard",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      line_items: resolvedLineItems,

      shipping_address: {
        name: body.shipping.name.trim(),
        first_name: firstName,
        last_name: lastName,
        address1: body.shipping.address.trim(),
        address_2: "",
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        province: body.shipping.state.trim(),
        province_code: body.shipping.state.trim().substring(0, 2).toUpperCase(),
        zip: body.shipping.zip_code.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        country: body.shipping.country_code.toUpperCase().trim(),
        phone: cleanPhone
      },

      billing_address: {
        name: body.shipping.name.trim(),
        first_name: firstName,
        last_name: lastName,
        address1: body.shipping.address.trim(),
        address_2: "",
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        province: body.shipping.state.trim(),
        province_code: body.shipping.state.trim().substring(0, 2).toUpperCase(),
        zip: body.shipping.zip_code.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        country: body.shipping.country_code.toUpperCase().trim(),
        phone: cleanPhone
      }
    };

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 4. Secure delivery across external interface
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
      console.error(`[POPCustoms Gateway Exception - Status ${popCustomsResponse.status}]:`, popCustomsData);
      return NextResponse.json(
        {
          success: false,
          message: `PROTOCOL ERROR: TRANSIT SECTOR REJECTION. Upstream Details: ${JSON.stringify(popCustomsData)}`,
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData,
          debug: { sentPayload: popCustomsPayload }
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
    console.error("[Fatal Production Pipeline Exception]:", error);
    return NextResponse.json(
      { success: false, message: "Internal application handler collapse", error: error.message },
      { status: 500 }
    );
  }
}