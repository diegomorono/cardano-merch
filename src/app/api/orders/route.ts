import { NextResponse } from "next/server";
import crypto from "crypto";

// POPCustoms order POST handler
// Auth flow based on API docs:
// 1. The webhook endpoint uses x-hmac-sha256 signing with the store API key
// 2. The x-topic header must be "orders/paid" to signal a completed payment
// 3. The store_id is taken from POPCUSTOMS_STORE_ID env var

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.POPCUSTOMS_API_KEY;
    const storeId = process.env.POPCUSTOMS_STORE_ID;
    const account = process.env.POPCUSTOMS_ACCOUNT;
    const password = process.env.POPCUSTOMS_PASSWORD;

    if (!apiKey || !storeId || !account || !password) {
      return NextResponse.json(
        { message: "Missing POPCustoms credentials in .env.local" },
        { status: 500 }
      );
    }

    // Step 1: Login to get Bearer Token
    const loginRes = await fetch("https://i.popcustoms.com/api/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, password }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.data?.token) {
      return NextResponse.json(
        { message: "POPCustoms login failed", details: loginData },
        { status: 401 }
      );
    }

    const token = loginData.data.token;

    // Build POPCustoms-compatible payload
    // ... rest of the payload logic ...
    const orderNumber = `ADA-${Date.now()}`;

    const popCustomsPayload = {
      platform_name: "POPCustoms",
      order_number: orderNumber,
      line_items: body.cart as { sku: string; quantity: number }[],
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name,
        address: body.shipping.address,
        phone_number: body.shipping.phone_number,
        city: body.shipping.city,
        state: body.shipping.state,
        country_code: body.shipping.country_code,
        zip_code: body.shipping.zip_code,
        email: body.shipping.email,
      },
    };

    const payloadString = JSON.stringify(popCustomsPayload);

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", apiKey);
    hmac.update(payloadString.trim());
    const signature = hmac.digest("base64");

    // Step 2: Submit Order
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/orders`;

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "x-hmac-sha256": signature,
        "x-topic": "orders/paid",
      },
      body: payloadString,
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: unknown;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms] ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "POPCustoms rejected the order",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            order_number: orderNumber,
            line_items: popCustomsPayload.line_items,
          },
        },
        { status: popCustomsResponse.status }
      );
    }

    return NextResponse.json(
      { success: true, order_number: orderNumber, data: popCustomsData },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /orders] Internal error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
