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

    // 1. Ingest and sanitize environmental credentials
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        {
          message: "CONFIGURATION FAULT: Application credentials are blank or unreadable within the hosting substrate environment.",
          api_key_present: apiKey.length > 0,
          store_id_present: storeId.length > 0
        },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Build structured payload following vendor schema metrics
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
        country_code: body.shipping.country_code.toUpperCase().trim(),
        zip_code: body.shipping.zip_code.trim(),
        email: body.shipping.email.trim(),
      },
    };

    // 3. Establish targeted endpoint reference
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 4. Dispatch transaction payload
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}` // Using standard Bearer formatting
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

    // 5. Catch and log authentication or validation gateway blocks
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Connection Gateway Fault] Status: ${popCustomsResponse.status}`);
      return NextResponse.json(
        {
          message: `PROTOCOL BLOCK: Remote server rejected credentials with status code ${popCustomsResponse.status}`,
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            apiKeyLength: apiKey.length,
            apiKeyPrefixLook: apiKey.substring(0, 8),
          },
        },
        { status: popCustomsResponse.status } // Bubbles the 401 back out cleanly for analysis
      );
    }

    // 6. Return verified success confirmation state
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        data: popCustomsData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Processing Exception Encountered]:", error);
    return NextResponse.json(
      { message: "Internal System Execution Failure", error: error.message },
      { status: 500 }
    );
  }
}