import { NextResponse } from "next/server";
import Stripe from "stripe";

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

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      details: { code: 200, message: "Order payment confirmed." },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Order verification failed";
    console.error("[Confirm Order Fatal Error]:", error);
    return NextResponse.json({ message: "Order verification failed.", error: errorMsg }, { status: 500 });
  }
}
