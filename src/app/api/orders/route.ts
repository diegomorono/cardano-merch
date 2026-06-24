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

    // 1. Cleanse environment token metrics from surrounding whitespace/escape pollution
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Configuration Failure: Empty or missing POPCustoms credential keys in server environment." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Map payload object array schemas matching strict platform rules
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
        phone_number: body.shipping.phone_number.replace(/[^\d+]/g, ""), // Sanitize down to strict numerical values
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(), // Force standard ISO Alpha-2 formatting
        zip_code: body.shipping.zip_code.trim(),
        email: body.shipping.email.trim(),
      },
    };

    // 3. Enforce strict absolute byte-level structural alignment for signing
    const finalizedPayloadString = JSON.stringify(popCustomsPayload);

    // Compute Base64-encoded HMAC signature (Strict POPCustoms Webhook requirement)
    const hmacBase64 = crypto.createHmac("sha256", apiKey);
    hmacBase64.update(finalizedPayloadString);
    const signatureBase64 = hmacBase64.digest("base64");

    // Assign the Base64 digest string as the active token to resolve the 401 error
    const activeSignature = signatureBase64;

    // 4. Construct remote webhook gateway target destination routing parameters
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-hmac-sha256": activeSignature,
        "x-topic": "orders/paid",
      },
      body: finalizedPayloadString, // Ensure the exact unmutated string is passed
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: any;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Feedback Rejection] ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "POPCustoms rejected the transaction payload rules (Validation Gate)",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            sentSignatureFormat: "base64",
            sentSignatureValue: activeSignature,
            payloadLengthBytes: Buffer.byteLength(finalizedPayloadString, "utf8"),
          },
        },
        { status: 422 } // Expose 422 up to client layer to identify validation rules errors
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