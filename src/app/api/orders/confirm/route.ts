import { NextResponse } from "next/server";
import Stripe from "stripe";
import { submitOrderToPopCustoms } from "@/lib/popcustoms";

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

    let cart = [];
    try {
      const cartRaw = JSON.parse(metadata.cart_data || "[]");
      cart = cartRaw.map((item: any) => ({
        sku: item.sku,
        quantity: item.qty,
      }));
    } catch (parseErr) {
      console.error("[Confirm Order]: Failed to parse cart metadata", parseErr);
      return NextResponse.json({ message: "Invalid cart metadata." }, { status: 400 });
    }

    console.log(`[Confirm Order]: Fulfilling order ${orderNumber} via POPCustoms...`);
    let result;
    try {
      result = await submitOrderToPopCustoms(cart, shipping, orderNumber);
      console.log(`[Confirm Order]: POPCustoms Fulfillment complete:`, result);
    } catch (fulfillmentErr: any) {
      // If the error indicates it's already created, we can ignore it and succeed
      const isAlreadyCreated = fulfillmentErr.message.toLowerCase().includes("exist") ||
                               fulfillmentErr.message.toLowerCase().includes("duplicate") ||
                               fulfillmentErr.message.toLowerCase().includes("already");
      if (isAlreadyCreated) {
        console.log(`[Confirm Order]: Order ${orderNumber} was already submitted.`);
      } else {
        console.error(`[Confirm Order]: POPCustoms submission failed:`, fulfillmentErr.message);
        return NextResponse.json({ message: "Fulfillment submission failed.", error: fulfillmentErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      details: result || "Already fulfilled",
    });
  } catch (error: any) {
    console.error("[Confirm Order Fatal Error]:", error);
    return NextResponse.json({ message: "Order verification failed.", error: error.message }, { status: 500 });
  }
}
