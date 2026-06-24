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

    // 1. Ingest and sanitize environmental credentials
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "CONFIGURATION ERROR: Missing or corrupted POPCustoms credentials in server environment variables." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Build structured webhook payload matching vendor data expectations
    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item) => ({
        sku: item.sku.trim(),
        quantity: Number(item.quantity)
      })),
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name.trim(),
        address1: body.shipping.address.trim(),
        address2: "",
        city: body.shipping.city.trim(),
        province: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(), // Enforce ISO 2-letter uppercase constraint
        zip: body.shipping.zip_code.trim(),
        phone: body.shipping.phone_number.replace(/[^\d+]/g, ""), // Sanitize phone format
        email: body.shipping.email.trim()
      }
    };

    // 3. Serialize and cryptographically sign the payload string using HMAC-SHA256
    const payloadString = JSON.stringify(popCustomsPayload);
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(payloadString)
      .digest("base64");

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 4. Dispatch the signed payload to the webhook endpoint
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-hmac-sha256": signature, // Clears the 401 gate
        "x-topic": "orders/paid"    // Required to signal completed payment status
      },
      body: payloadString
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: any;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    // 5. Catch and intercept validation errors
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Rejected Payload] Status ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "PROTOCOL ERROR: POPCustoms rejected the transaction payload rules (Validation Gate)",
          status: popCustomsResponse.status,
          details: popCustomsData, // Displays specific field validation errors on your frontend screen
          debug: {
            endpoint: popCustomsUrl,
            sentPayload: popCustomsPayload
          }
        },
        { status: popCustomsResponse.status }
      );
    }

    // 6. Return success confirmation state
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        data: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Webhook Execution Exception]:", error);
    return NextResponse.json(
      { message: "Internal Processing Failure", error: error.message },
      { status: 500 }
    );
  }
}