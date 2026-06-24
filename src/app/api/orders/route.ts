import { NextResponse } from "next/server";

interface CartItem {
  sku: string;
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

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json();

    // 1. Sanitize system environment parameters
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Configuration Error: API key or Store ID resolves to an empty string." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Map payload cleanly matching the POPCustoms data model
    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item) => ({
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
      })),
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name.trim(),
        address: body.shipping.address.trim(),
        phone_number: body.shipping.phone_number.replace(/[^\d+]/g, ""),
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(), // ISO Alpha-2 code
        zip_code: body.shipping.zip_code.trim(),
        email: body.shipping.email.trim(),
      },
    };

    // 3. Target the correct custom webhook endpoint with a Bearer Token
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}` // Injected per tech-support guidelines
      },
      body: JSON.stringify(popCustomsPayload),
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: any;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    // 4. Handle structural validation errors or edge rejections
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Feedback] ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "PROTOCOL ERROR: POPCustoms rejected the transaction payload rules (Validation Gate)",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            payloadSent: popCustomsPayload,
          },
        },
        { status: popCustomsResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        data: popCustomsData,
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