/**
 * Pseudo-code Logical Map:
 * 1. Import NextResponse.
 * 2. Import Stripe.
 * 3. Import productsCatalog.
 * 4. Import calculateShippingCost from @/lib/shipping.
 * 5. Handle POST request:
 *    - Retrieve cart, shipping, and shippingMethod from request JSON body.
 *    - Verify Stripe secret key in environment.
 *    - Calculate total product catalog amount.
 *    - Calculate shipping cost dynamically using calculateShippingCost.
 *    - Sum product total and shipping cost to compute grandTotal.
 *    - Create Stripe Payment Intent with grandTotal in cents.
 *    - Populate metadata fields (including shipping address, method, and cost) so the Stripe Webhook can read them.
 *    - Return clientSecret and shippingCost.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { productsCatalog } from "@/lib/catalog";
import { calculateShippingCost } from "@/lib/shipping";

interface CartItem {
  sku: string;
  quantity: number;
}

interface ShippingForm {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  phone_number: string;
}

interface CheckoutRequestBody {
  cart?: CartItem[];
  shipping?: ShippingForm;
  shippingMethod?: "Standard" | "Express";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const cart = body.cart || [];
    const shipping = body.shipping;
    const shippingMethod = body.shippingMethod || "Standard";

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: "STRIPE CONFIGURATION ERROR: Secret key is missing." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (!cart || !cart.length) {
      return NextResponse.json(
        { message: "VALIDATION ERROR: Cart is empty." },
        { status: 400 }
      );
    }

    // 1. Calculate total product catalog amount securely on the server
    let productsAmount = 0;
    for (const item of cart) {
      const match = productsCatalog
        .map((p) => {
          const variant = p.variants.find((v) => v.sku === item.sku);
          if (variant) {
            return variant.recommendPrice;
          }
          return null;
        })
        .find((x) => x !== null);

      if (!match) {
        return NextResponse.json(
          { message: `VALIDATION ERROR: SKU ${item.sku} not found in catalog.` },
          { status: 400 }
        );
      }
      productsAmount += match * item.quantity;
    }

    // 2. Calculate shipping cost dynamically
    let shippingCost = 0;
    if (shipping && shipping.country_code) {
      shippingCost = calculateShippingCost(
        cart,
        shipping.country_code,
        shippingMethod
      );
    }

    const grandTotal = productsAmount + shippingCost;

    // 3. Create Stripe Payment Intent (unit in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100),
      currency: "usd",
      metadata: {
        cart_data: JSON.stringify(cart.map((item) => ({ sku: item.sku, qty: item.quantity }))),
        shipping_method: shippingMethod,
        shipping_cost: String(shippingCost),
        shipping_name: shipping?.name || "",
        shipping_email: shipping?.email || "",
        shipping_address: shipping?.address || "",
        shipping_city: shipping?.city || "",
        shipping_state: shipping?.state || "",
        shipping_country_code: shipping?.country_code || "",
        shipping_zip_code: shipping?.zip_code || "",
        shipping_phone_number: shipping?.phone_number || "",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      shippingCost,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Payment intent creation failed";
    console.error("[Stripe Payment Intent Creation Failed]:", error);
    return NextResponse.json(
      { message: "Failed to initialize payment intent.", error: errorMsg },
      { status: 500 }
    );
  }
}
