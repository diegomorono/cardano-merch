import { NextResponse } from "next/server";
import Stripe from "stripe";
import { productsCatalog } from "@/lib/catalog";

interface CartItem {
  sku: string;
  quantity: number;
}

interface CheckoutRequestBody {
  cart?: CartItem[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const cart = body.cart || [];

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

    // Resolve details and calculate amount securely on the server
    let totalAmount = 0;
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
      totalAmount += match * item.quantity;
    }

    // Create Stripe Payment Intent (unit in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "usd",
      metadata: {
        cart_data: JSON.stringify(cart.map((item) => ({ sku: item.sku, qty: item.quantity }))),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
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
