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

    // 1. Ingest and sanitize environmental variables
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { success: false, message: "CONFIGURATION EXCEPTION: Core fulfillment API keys or Store IDs are missing from the server environment." },
        { status: 500 }
      );
    }

    const timestampId = Date.now();
    const orderNumber = `ADA-${timestampId}`;

    // Split descriptive name strings into distinct parts for strict profile mappings
    const nameParts = body.shipping.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Receiver";

    // Clean phone variables to conform with standard numeric processing layouts
    const cleanPhone = body.shipping.phone_number.replace(/[^\d+]/g, "") || "+10000000000";

    // 2. Map standard webhook compliant data model (platform=General structural requirements)
    const popCustomsPayload = {
      id: timestampId,
      id_str: String(timestampId),
      order_number: orderNumber,
      number: orderNumber,
      name: orderNumber,
      email: body.shipping.email.trim(),
      currency: "USD",
      financial_status: "paid",
      fulfillment_status: null,
      shipping_method: "Standard",
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),

      line_items: body.cart.map((item, index) => ({
        id: timestampId + index,
        variant_id: null,
        product_id: null,
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
        price: "0.00",
        title: "Merchandise Item",
        grams: 0,
        requires_shipping: true
      })),

      shipping_address: {
        name: body.shipping.name.trim(),
        first_name: firstName,
        last_name: lastName,
        address1: body.shipping.address.trim(),
        address_2: "",
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        province: body.shipping.state.trim(),
        province_code: body.shipping.state.trim().substring(0, 2).toUpperCase(),
        zip: body.shipping.zip_code.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        country: body.shipping.country_code.toUpperCase().trim(),
        phone: cleanPhone
      },

      billing_address: {
        name: body.shipping.name.trim(),
        first_name: firstName,
        last_name: lastName,
        address1: body.shipping.address.trim(),
        address_2: "",
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        province: body.shipping.state.trim(),
        province_code: body.shipping.state.trim().substring(0, 2).toUpperCase(),
        zip: body.shipping.zip_code.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        country: body.shipping.country_code.toUpperCase().trim(),
        phone: cleanPhone
      }
    };

    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

    // 3. Execute request using direct Bearer Authorization tokens
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-topic": "orders/paid"
      },
      body: JSON.stringify(popCustomsPayload)
    });

    const responseText = await popCustomsResponse.text();
    let popCustomsData: unknown;
    try {
      popCustomsData = JSON.parse(responseText);
    } catch {
      popCustomsData = responseText;
    }

    // 4. Handle errors and map upstream validation metrics transparently
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Gateway Error Response - Code ${popCustomsResponse.status}]:`, popCustomsData);

      const errorString = typeof popCustomsData === "object" && popCustomsData !== null
        ? JSON.stringify(popCustomsData)
        : String(popCustomsData);

      return NextResponse.json(
        {
          success: false,
          message: `PROTOCOL ERROR: TRANSIT SECTOR REJECTION. Upstream Details: ${errorString}`,
          status: popCustomsResponse.status,
          gatewayDetails: popCustomsData,
          debug: {
            targetEndpoint: popCustomsUrl,
            sentPayload: popCustomsPayload
          }
        },
        { status: popCustomsResponse.status }
      );
    }

    // 5. Order successfully parsed and ingested by the remote manufacturer
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: popCustomsData
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Fatal Processing Loop Exception Caught]:", error);
    return NextResponse.json(
      { success: false, message: "Internal application handler collapse", error: error.message },
      { status: 500 }
    );
  }
}