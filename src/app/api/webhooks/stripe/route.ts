import { NextResponse } from "next/server";
import Stripe from "stripe";
import { submitOrderToPopCustoms } from "@/lib/popcustoms";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe Webhook]: Secret key is missing.");
      return NextResponse.json({ message: "Secret key missing" }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.accredited" as any,
    });

    if (!webhookSecret) {
      console.error("[Stripe Webhook]: Webhook secret is not configured.");
      return NextResponse.json({ message: "Webhook secret missing" }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook Verification Failed]: ${err.message}`);
      return NextResponse.json({ message: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.error("[Stripe Webhook]: No metadata found in checkout session.");
        return NextResponse.json({ message: "No metadata found" }, { status: 400 });
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
        console.error("[Stripe Webhook]: Failed to parse cart metadata", parseErr);
        return NextResponse.json({ message: "Invalid cart metadata" }, { status: 400 });
      }

      console.log(`[Stripe Webhook]: Fulfilling order ${orderNumber} via POPCustoms...`);
      try {
        const result = await submitOrderToPopCustoms(cart, shipping, orderNumber);
        console.log(`[Stripe Webhook]: Fulfillment successful for order ${orderNumber}`, result);
      } catch (fulfillmentErr: any) {
        console.error(`[Stripe Webhook]: POPCustoms submission failed for order ${orderNumber}:`, fulfillmentErr.message);
        // We return a 200/202 to avoid Stripe retrying the webhook infinitely if the error is POPCustoms validation.
        // But we log it clearly.
        return NextResponse.json({ message: "Fulfillment failed but received", error: fulfillmentErr.message }, { status: 202 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Fatal Error]:", error);
    return NextResponse.json({ message: "Webhook Handler Error", error: error.message }, { status: 500 });
  }
}
