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

    // 1. Ingest and clean environmental variables
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { success: false, message: "CONFIGURATION FAULT: Environment keys are missing or unreadable within the compute layer." },
        { status: 500 }
      );
    }

    const timestampId = Date.now();
    const orderNumber = `ADA-${timestampId}`;

    // Split names into first and last parameters for strict fulfillment engines
    const nameParts = body.shipping.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Receiver";

    // Normalize phone formatting (numeric string with optional leading plus)
    const cleanPhone = body.shipping.phone_number.replace(/[^\d+]/g, "") || "+10000000000";

    // 2. Construct a multi-mapped payload structure to satisfy generic webhook validations
    const popCustomsPayload = {
      id: timestampId,
      order_number: orderNumber,
      number: orderNumber,
      email: body.shipping.email.trim(),
      financial_status: "paid",
      fulfillment_status: null,
      shipping_method: "Standard",

      // Line item arrays containing both simple and descriptor parameters
      line_items: body.cart.map((item, index) => ({
        id: timestampId + index,
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
        price: "0.00",
        title: "Merchandise Item"
      })),

      // Standardize address nodes across duplicate structure naming conventions
      shipping_address: {
        name: body.shipping.name.trim(),
        first_name: firstName,
        last_name: lastName,
        address1: body.shipping.address.trim(),
        address_1: body.shipping.address.trim(),
        address2: "",
        address_2: "",
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        province: body.shipping.state.trim(),
        province_code: body.shipping.state.trim().substring(0, 2).toUpperCase(),
        zip: body.shipping.zip_code.trim(),
        zip_code: body.shipping.zip_code.trim(),
        postcode: body.shipping.zip_code.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        country: body.shipping.country_code.toUpperCase().trim(),
        phone: cleanPhone,
        phone_number: cleanPhone
      }
    };

    // 3. Compute Base64 HMAC-SHA256 signature over the updated payload layout
    const payloadString = JSON.stringify(popCustomsPayload);
    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(payloadString)
      .digest("base64");

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 4. Dispatch the signed request payload
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "x-hmac-sha256": signature,
        "x-topic": "orders/paid"
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

    // 5. Intercept detailed data specification rejections
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway 422 Refusal Details]:`, popCustomsData);
      return NextResponse.json(
        {
          success: false,
          message: "DATA VALIDATION FAILURE: Authentication passed, but order details violated platform data specifications.",
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData, // Returns the platform's specific field errors directly to your frontend logs
          debug: {
            sentPayload: popCustomsPayload,
            endpoint: popCustomsUrl
          }
        },
        { status: 422 }
      );
    }

    // 6. Return successful processing confirmation state
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Processing Exception Encountered]:", error);
    return NextResponse.json(
      { success: false, message: "Internal application handler collapse", error: error.message },
      { status: 500 }
    );
  }
}