import { NextResponse } from "next/server";
import Stripe from "stripe";
import { submitOrderToPopCustoms, CartItem } from "@/lib/popcustoms";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ message: "Missing session_id query parameter." }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ message: "Stripe key is not configured." }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ message: "Order payment has not been verified." }, { status: 400 });
    }

    const metadata = session.metadata;
    if (!metadata) {
      return NextResponse.json({ message: "Missing session metadata." }, { status: 400 });
    }

    const orderNumber = metadata.order_number;
    const shipping = {
      name: metadata.shipping_name || "",
      email: metadata.shipping_email || "",
      address: metadata.shipping_address || "",
      city: metadata.shipping_city || "",
      state: metadata.shipping_state || "",
      country_code: metadata.shipping_country_code || "US",
      zip_code: metadata.shipping_zip_code || "",
      phone_number: metadata.shipping_phone_number || "",
    };

    interface CartItemMetadata {
      sku: string;
      qty: number;
    }

    let cart: CartItem[] = [];
    try {
      const cartRaw = JSON.parse(metadata.cart_data || "[]") as CartItemMetadata[];
      cart = cartRaw.map((item) => ({
        sku: item.sku,
        quantity: item.qty,
      }));
    } catch (parseErr) {
      console.error("[Confirm Order]: Failed to parse cart metadata", parseErr);
      return NextResponse.json({ message: "Invalid cart metadata." }, { status: 400 });
    }

    console.log(`[Confirm Order]: Fulfilling order ${orderNumber} via POPCustoms...`);
    
    // submitOrderToPopCustoms is fully idempotent and resolves duplication errors internally
    const result = await submitOrderToPopCustoms(cart, shipping, orderNumber);
    console.log(`[Confirm Order]: POPCustoms Fulfillment complete:`, result);

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      details: result,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Order verification failed";
    console.error("[Confirm Order Fatal Error]:", error);
    return NextResponse.json({ message: "Order verification failed.", error: errorMsg }, { status: 500 });
  }
}
