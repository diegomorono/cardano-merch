import { NextResponse } from "next/server";
import { submitOrderToPopCustoms, CartItem, ShippingData } from "@/lib/popcustoms";

interface OrdersRequestBody {
  cart?: CartItem[];
  shipping?: ShippingData;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrdersRequestBody;
    const cart = body.cart || [];
    const shipping = body.shipping;
    const orderNumber = `ADA-${Date.now()}`;

    if (!shipping) {
      return NextResponse.json(
        { message: "VALIDATION ERROR: Shipping data is missing." },
        { status: 400 }
      );
    }

    // Check if POPCustoms test mode is enabled
    if (process.env.POPCUSTOMS_TEST_MODE === "true") {
      const cleanLineItems = cart.map((item) => ({
        sku: (item.sku || "").trim(),
        quantity: Number(item.quantity || 1)
      }));

      // Construct and log mock payload matching POPCustoms format
      const popCustomsPayload = {
        order_number: orderNumber,
        line_items: cleanLineItems,
        shipping_method: "Standard",
        shipping_address: {
          name: (shipping.name || "").trim(),
          address: (shipping.address || "").trim(),
          phone_number: (shipping.phone_number || "").replace(/[^\d+]/g, ""),
          city: (shipping.city || "").trim(),
          state: (shipping.state || "").trim(),
          country_code: (shipping.country_code || "US").toUpperCase().trim(),
          zip_code: (shipping.zip_code || "").trim(),
          email: (shipping.email || "").trim()
        }
      };

      console.log("[POPCustoms Mock Request Payload]:", JSON.stringify(popCustomsPayload, null, 2));

      return NextResponse.json(
        {
          success: true,
          order_number: orderNumber,
          tracking_number: "TEST-TRK-9999",
          message: "MOCK FULFILLMENT SUCCESSFUL (TEST MODE)"
        },
        { status: 200 }
      );
    }

    const result = await submitOrderToPopCustoms(cart, shipping, orderNumber);

    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: result
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal Processing Failure";
    console.error("[Orders Route Fatal Error]:", error);
    return NextResponse.json(
      { message: errorMsg },
      { status: 500 }
    );
  }
}