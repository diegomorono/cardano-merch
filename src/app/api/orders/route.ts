/**
 * Pseudo-code Logical Map:
 * 1. Import NextResponse.
 * 2. Import submitOrderToPopCustoms, CartItem, ShippingData.
 * 3. Define OrdersRequestBody with optional shippingMethod.
 * 4. Within the POST handler:
 *    - Extract cart, shipping, and shippingMethod from the body.
 *    - Generate a unique ADA order number.
 *    - Validate presence of shipping data.
 *    - If POPCUSTOMS_TEST_MODE is true:
 *      - Construct popCustomsPayload with dynamic shipping_method (Standard/Express).
 *      - Log the payload and return mock success.
 *    - If test mode is false:
 *      - Submit order directly via submitOrderToPopCustoms (we will modify submitOrderToPopCustoms to accept shippingMethod).
 *      - Return gateway response.
 */

import { NextResponse } from "next/server";
import { submitOrderToPopCustoms, CartItem, ShippingData } from "@/lib/popcustoms";

interface OrdersRequestBody {
  cart?: CartItem[];
  shipping?: ShippingData;
  shippingMethod?: "Standard" | "Express";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OrdersRequestBody;
    const cart = body.cart || [];
    const shipping = body.shipping;
    const shippingMethod = body.shippingMethod || "Standard";
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
        shipping_method: shippingMethod,
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

    // Call POPCustoms submit wrapper (which we will update to pass shippingMethod)
    const result = await submitOrderToPopCustoms(cart, shipping, orderNumber, shippingMethod);

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