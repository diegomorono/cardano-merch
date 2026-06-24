import { NextResponse } from "next/server";

interface CartItem {
  baseSku: string;   // e.g., "N79G24RY"
  size: string;      // e.g., "S", "M", "L", "XL", "2XL", "5XL"
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

// Deterministic translation dictionary mapping catalog sizes to factory SKU suffixes
const SIZE_SUFFIX_MAP: Record<string, string> = {
  "S": "-3",
  "SMALL": "-3",
  "M": "-4",
  "MEDIUM": "-4",
  "L": "-5",
  "LARGE": "-5",
  "XL": "-6",
  "EXTRA LARGE": "-6",
  "2XL": "-7",
  "XXL": "-7",
  "5XL": "-8"
};

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json();

    // 1. Ingest and sanitize fulfillment environment variables
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { success: false, message: "CONFIGURATION EXCEPTION: Core fulfillment API keys or Store IDs are missing from the server environment." },
        { status: 500 }
      );
    }

    const timestampId = Date.now();
    const orderNumber = `ADA-${timestampId}`;

    const nameParts = body.shipping.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Receiver";
    const cleanPhone = body.shipping.phone_number.replace(/[^\d+]/g, "") || "+10000000000";

    // 2. Map and resolve dynamic SKU variations for factory consumption
    const resolvedLineItems = body.cart.map((item, index) => {
      const cleanBase = item.baseSku.trim().split("-")[0]; // Strip existing suffix if accidentally passed
      const normalizedSize = item.size.trim().toUpperCase();
      const suffix = SIZE_SUFFIX_MAP[normalizedSize] || "-3"; // Default to Small if size token is unmapped

      const absoluteSku = `${cleanBase}${suffix}`;

      return {
        id: timestampId + index,
        variant_id: null,
        product_id: null,
        sku: absoluteSku,
        quantity: Number(item.quantity),
        price: "0.00",
        title: `Cardano Merchandise Item - Size ${normalizedSize}`,
        grams: 0,
        requires_shipping: true
      };
    });

    // 3. Construct unified webhook compliant payload data matrix
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

    // 4. Dispatch transaction request with clean Bearer Authorization tokens
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

    // 5. Intercept failures and reflect structured execution variables
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Rejection - Code ${popCustomsResponse.status}]:`, popCustomsData);

      const errorString = typeof popCustomsData === "object" && popCustomsData !== null
        ? JSON.stringify(popCustomsData)
        : String(popCustomsData);

      return NextResponse.json(
        {
          success: false,
          message: `PROTOCOL ERROR: TRANSIT SECTOR REJECTION. Upstream Details: ${errorString}`,
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData,
          debug: {
            targetEndpoint: popCustomsUrl,
            sentPayload: popCustomsPayload
          }
        },
        { status: popCustomsResponse.status }
      );
    }

    // 6. Return successful manufacturing confirmation
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Processing Loop Exception Caught]:", error);
    return NextResponse.json(
      { success: false, message: "Internal application handler collapse", error: error.message },
      { status: 500 }
    );
  }
}