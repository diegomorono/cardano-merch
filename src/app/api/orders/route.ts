import { NextResponse } from "next/server";

interface CartItem {
  sku: string;
  quantity: number;
  variant_id?: string;
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

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json();

    // 1. Extract and sanitize authorization tokens from environment storage
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Configuration Error: API key or Store ID token resolves to an empty string after sanitization." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Map payload cleanly matching the case-sensitive "General" rules for Outbound API
    const popCustomsPayload = {
      store_id: storeId,
      platform: "General", // Explicitly matching validated support configuration
      out_order_id: orderNumber,
      shipping_name: body.shipping.name.trim(),
      shipping_address1: body.shipping.address.trim(),
      shipping_address2: "",
      shipping_city: body.shipping.city.trim(),
      shipping_province: body.shipping.state.trim(),
      shipping_country_code: body.shipping.country_code.toUpperCase().trim(), // Strict ISO 2-letter validation code
      shipping_zip: body.shipping.zip_code.trim(),
      shipping_phone: body.shipping.phone_number.replace(/[^\d+]/g, ""), // Sanitize characters leaving numbers and + signs
      products: body.cart.map((item) => ({
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
        variant_id: item.variant_id || ""
      }))
    };

    // 3. Construct HTTP Outbound Request targeting standard orders endpoint
    const popCustomsUrl = "https://i.popcustoms.com/api/v1/orders";

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}` // Strict compliance with technical support specifications
      },
      body: JSON.stringify(popCustomsPayload)
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: any;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    // 4. Handle structural validation errors returned from target gateway
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Error] State ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "PROTOCOL ERROR: POPCustoms rejected the transaction payload rules (Validation Gate)",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            sentPayload: popCustomsPayload
          }
        },
        { status: popCustomsResponse.status }
      );
    }

    // 5. Order Synced Successfully with General Dashboard Matrix
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        pop_order_id: popCustomsData.order_id || null,
        data: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Order Sync Route Exception Handler Triggered]:", error);
    return NextResponse.json(
      { message: "Internal Processing Failure", error: error.message },
      { status: 500 }
    );
  }
}