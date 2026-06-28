import { NextResponse } from "next/server";
import Stripe from "stripe";
import { productsCatalog } from "@/lib/catalog";

interface CartItemInput {
  sku: string;
  quantity: number;
}

interface ShippingDataInput {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  phone_number: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cart: CartItemInput[] = body.cart || [];
    const shipping: ShippingDataInput = body.shipping;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: "STRIPE CONFIGURATION ERROR: Secret key is missing." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (!cart.length) {
      return NextResponse.json(
        { message: "VALIDATION ERROR: Cart is empty." },
        { status: 400 }
      );
    }

    // Resolve details and verify pricing to avoid client tampering
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const validatedCartDetails: Array<{ sku: string; quantity: number; title: string; price: number }> = [];

    for (const item of cart) {
      // Find item in local catalog
      const match = productsCatalog
        .map((p) => {
          const variant = p.variants.find((v) => v.sku === item.sku);
          if (variant) {
            return {
              title: `${p.title} (${variant.size})`,
              price: variant.recommendPrice,
              sku: variant.sku,
            };
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

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: match.title,
            metadata: {
              sku: match.sku,
            },
          },
          unit_amount: Math.round(match.price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      });

      validatedCartDetails.push({
        sku: match.sku,
        quantity: item.quantity,
        title: match.title,
        price: match.price,
      });
    }

    // Generate a unique order/manifest ID
    const orderNumber = `ADA-${Date.now()}`;

    // Metadata limit in Stripe is 50 key-value pairs, keys under 40 chars, values under 500 chars.
    // Serializing cart to fit in metadata.
    const cartMetadataString = JSON.stringify(
      validatedCartDetails.map((item) => ({ sku: item.sku, qty: item.quantity }))
    );

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      customer_email: shipping.email,
      metadata: {
        order_number: orderNumber,
        cart_data: cartMetadataString,
        shipping_name: shipping.name,
        shipping_email: shipping.email,
        shipping_address: shipping.address,
        shipping_city: shipping.city,
        shipping_state: shipping.state || "",
        shipping_country_code: shipping.country_code,
        shipping_zip_code: shipping.zip_code,
        shipping_phone_number: shipping.phone_number || "",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      order_number: orderNumber,
    });
  } catch (error: any) {
    console.error("[Stripe Session Creation Failed]:", error);
    return NextResponse.json(
      { message: "Failed to initialize Stripe Checkout Session.", error: error.message },
      { status: 500 }
    );
  }
}
