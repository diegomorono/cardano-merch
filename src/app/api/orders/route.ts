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

    // 1. Extract and cleanse environment variables from syntax padding
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { message: "Configuration Fault: API Key or Store ID resolves to an empty value after sanitization loops." },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-${Date.now()}`;

    // 2. Formulate data maps matching verified schema constraints
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
        phone_number: body.shipping.phone_number.replace(/[^\d+]/g, ""), // Strip everything except numeric values and country codes
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(), // Force absolute ISO Alpha-2 formatting rule
        zip_code: body.shipping.zip_code.trim(),
        email: body.shipping.email.trim(),
      },
    };

    // 3. Construct the absolute store-scoped routing node URL destination
    const popCustomsUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/orders`;

    // 4. Fire the remote payload execution loop
    const popCustomsResponse = await fetch(popCustomsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`, // Restoring required Bearer token structure 
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

    // 5. Catch validation failures or processing gate structural blocks
    if (!popCustomsResponse.ok) {
      console.error(`[POPCustoms Processing Block] Error Code ${popCustomsResponse.status}:`, popCustomsData);
      return NextResponse.json(
        {
          message: "PROTOCOL ERROR: POPCustoms rejected the transaction payload rules (Validation Gate)",
          status: popCustomsResponse.status,
          details: popCustomsData,
          debug: {
            endpoint: popCustomsUrl,
            payloadStructureSent: popCustomsPayload,
          },
        },
        { status: popCustomsResponse.status } // Bubble original server code (e.g., 422) back up cleanly
      );
    }

    // 6. Return verified 200 success state confirmation up to active client layer
    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        pop_order_id: popCustomsData.order_id || null,
        data: popCustomsData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Order Sync Route Exception Handler Triggered]:", error);
    return NextResponse.json(
      { message: "Internal Server Processing Failure", error: error.message },
      { status: 500 }
    );
  }
}