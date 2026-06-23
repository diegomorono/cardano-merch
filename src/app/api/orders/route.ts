import { NextResponse } from "next/server";
import crypto from "crypto";

// POPCustoms webhook order creation handler
// Auth flow:
// 1. The endpoint is https://i.popcustoms.com/api/v1/stores/[store_id]/webhooks/orders?platform=general
// 2. The webhook endpoint uses x-hmac-sha256 signing with the store API key
// 3. The x-topic header must be "orders/paid" to signal a completed payment
// 4. The store_id is taken from POPCUSTOMS_STORE_ID env var

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.POPCUSTOMS_API_KEY;
    const storeId = process.env.POPCUSTOMS_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Missing POPCustoms credentials in .env.local" },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item: { sku: string; quantity: number }) => ({
        sku: item.sku,
        quantity: item.quantity
      })),
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
    console.log("Submitting payload to POPCustoms:", payloadString);

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", apiKey);
    hmac.update(payloadString.trim());
    const signature = hmac.digest("base64");

    // Submit Order
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=general`;

    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
        { status: 422 }
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
