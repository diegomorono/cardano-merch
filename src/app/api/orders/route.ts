import { NextResponse } from "next/server";
import crypto from "crypto";

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

    // 1. Ingest and sanitize environmental variables to strip hidden string pollution
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "CONFIGURATION ERROR: POPCustoms keys are unreadable or missing from environment configuration properties." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Map payload properties to clear common fulfillment validation constraints
    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item) => ({
        sku: item.sku.trim(),
        quantity: Number(item.quantity)
      })),
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name.trim(),
        address1: body.shipping.address.trim(), // Map into split parameters if platform rejects flat strings
        address2: "",
        city: body.shipping.city.trim(),
        province: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(), // Force uppercase two-character ISO mapping
        zip: body.shipping.zip_code.trim(),
        phone: body.shipping.phone_number.replace(/[^\d+]/g, ""), // Remove spaces, braces, and hyphens
        email: body.shipping.email.trim()
      }
    };

    // 3. Generate the required Base64 HMAC-SHA256 signature
    const payloadString = JSON.stringify(popCustomsPayload);
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(payloadString)
      .digest("base64");

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 4. Dispatch the signed payload to the endpoint
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-hmac-sha256": signature, // HMAC authorization signature
        "x-topic": "orders/paid"    // Required fulfillment payload type identifier
      },
      body: payloadString
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: unknown;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    // 5. Intercept transaction issues or field formatting problems
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Data Rejection] Status ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          success: false,
          message: "DATA VALIDATION FAILURE: Authentication passed, but order details violated platform data specifications.",
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData, // Returns the exact validation error message to your tracking logs
          debug: {
            sentPayload: popCustomsPayload
          }
        },
        { status: 422 }
      );
    }

    // 6. Return verified order processing confirmation
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Processing Node Exception]:", error);
    return NextResponse.json(
      { success: false, message: "Internal application handler collapse", error: error.message },
      { status: 500 }
    );
  }
}