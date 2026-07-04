/**
 * Pseudo-code Logical Map:
 * 1. Import NextResponse.
 * 2. Import getShippingOptions from @/lib/shipping.
 * 3. Handle POST request:
 *    - Extract cart and country_code from JSON body.
 *    - Validate input parameters.
 *    - Resolve available shipping options using getShippingOptions.
 *    - Return options as JSON.
 */

import { NextResponse } from "next/server";
import { getShippingOptions } from "@/lib/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cart = body.cart || [];
    const countryCode = body.country_code || "US";

    if (!cart.length) {
      return NextResponse.json({ options: [] }, { status: 200 });
    }

    const options = getShippingOptions(cart, countryCode);

    return NextResponse.json({ options }, { status: 200 });
  } catch (error) {
    console.error("[Shipping API Error]:", error);
    return NextResponse.json(
      { message: "Failed to resolve shipping options." },
      { status: 500 }
    );
  }
}
