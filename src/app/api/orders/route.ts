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

    // 1. Sanitize system environments to protect against hidden character injection
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Missing or unreadable POPCustoms credentials in server context" },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Assemble the uniform payload matching internal specifications
    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name,
        address: body.shipping.address,
        phone_number: body.shipping.phone_number,
        city: body.shipping.city,
        state: body.shipping.state,
        country_code: body.shipping.country_code.toUpperCase().trim(),
        zip_code: body.shipping.zip_code,
        email: body.shipping.email,
      },
    };

    // 3. Enforce strict absolute byte-level structural string alignment
    const finalizedPayloadString = JSON.stringify(popCustomsPayload);

    // Compute Hex-encoded HMAC signature (standard webhook convention protocol)
    const hmacHex = crypto.createHmac("sha256", apiKey);
    hmacHex.update(finalizedPayloadString);
    const signatureHex = hmacHex.digest("hex");

    // Compute Base64 fallback signature to guarantee protocol alignment stability
    const hmacBase64 = crypto.createHmac("sha256", apiKey);
    hmacBase64.update(finalizedPayloadString);
    const signatureBase64 = hmacBase64.digest("base64");

    // Select the signature format. Defaulting to standard hex; switch to signatureBase64 if endpoint expects base64 stringing.
    const activeSignature = signatureHex;

    // 4. Construct remote webhook gateway target routing parameter
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-hmac-sha256": activeSignature,
        "x-topic": "orders/paid",
      },
      body: finalizedPayloadString, // Pass the exact unmutated string used during signature compilation
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: any;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Verification Failure] ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "POPCustoms rejected the signature payload authentication sequence",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            sentSignatureLength: activeSignature.length,
            payloadLengthBytes: Buffer.byteLength(finalizedPayloadString, 'utf8'),
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
    console.error("[Order Webhook Internal Exception Error]:", error);
    return NextResponse.json(
      { message: "Internal Server Processing Failure", error: error.message },
      { status: 500 }
    );
  }
}