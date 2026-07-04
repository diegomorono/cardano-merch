/**
 * Pseudo-code Logical Map:
 * 1. Import NextResponse from 'next/server'.
 * 2. Import Stripe.
 * 3. Import POPCustoms types and fulfillment client.
 * 4. Import Drizzle database client, schema, and query filters.
 * 5. Import mintZkReceipt from Midnight module.
 * 6. Within the POST endpoint handler:
 *    - Log "[WEBHOOK] Triggered".
 *    - Log "[WEBHOOK] Reading raw body" and extract req.text().
 *    - Verify webhook signature. On failure, log verification failure and return 200 (guaranteed return).
 *    - Log "[WEBHOOK] Signature verified" and inspect event type.
 *    - If event is 'checkout.session.completed':
 *      - Parse cart metadata and shipping information.
 *      - Log "[WEBHOOK] POPCustoms triggered" and run order fulfillment.
 *      - Log "[WEBHOOK] Drizzle inserted" and save initial loyalty record as PENDING.
 *      - If eligible for ZK-Receipt (> $100 and Midnight wallet provided):
 *        - Log "[WEBHOOK] Midnight called".
 *        - Wrap 'mintZkReceipt' in a Promise.race with a 10-second rejection timer to act as a circuit breaker.
 *        - On successful minting, update status in Drizzle to 'CLAIMED'.
 *        - On timeout/failure, log warning and keep status as 'PENDING'.
 *    - Ensure every catch block and code branch terminates with status 200 to prevent hanging the Stripe CLI.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { submitOrderToPopCustoms, CartItem } from "@/lib/popcustoms";
import { db } from "@/lib/db/drizzle";
import { loyaltyEscrow } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { mintZkReceipt } from "@/lib/midnight/mint-receipt";

export async function POST(req: Request) {
  console.log("[WEBHOOK] Triggered: Received incoming request.");
  
  try {
    // 1. Safe RAW BODY reading
    console.log("[WEBHOOK] Reading raw body...");
    const rawBody = await req.text();
    console.log("[WEBHOOK] Body read successfully.");

    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[Stripe Webhook]: Secret key (STRIPE_SECRET_KEY) is missing.");
      return NextResponse.json({ received: true }, { status: 200 }); // Guaranteed return
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (!webhookSecret) {
      console.error("[Stripe Webhook]: Webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.");
      return NextResponse.json({ received: true }, { status: 200 }); // Guaranteed return
    }

    let event: Stripe.Event;

    // 2. Cryptographic signature verification
    console.log("[WEBHOOK] Verifying Stripe signature...");
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log("[WEBHOOK] Signature verified successfully. Event ID:", event.id);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Signature verification failed";
      console.error(`[WEBHOOK] Signature verification failed: ${errMsg}`);
      return NextResponse.json({ received: true, error: `Webhook Signature Error: ${errMsg}` }, { status: 200 }); // Guaranteed return
    }

    // 3. Process Checkout Session Completed event
    if (event.type === "checkout.session.completed") {
      console.log("[WEBHOOK] Processing event checkout.session.completed");
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata) {
        console.error("[WEBHOOK] No metadata found in checkout session object.");
        return NextResponse.json({ received: true, error: "No metadata found" }, { status: 200 }); // Guaranteed return
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
        console.error("[WEBHOOK] Failed to parse cart metadata:", parseErr);
        return NextResponse.json({ received: true, error: "Invalid cart metadata" }, { status: 200 }); // Guaranteed return
      }

      // --- POPCustoms Physical Fulfillment ---
      console.log("[WEBHOOK] POPCustoms triggered: Submitting order", orderNumber);
      try {
        const result = await submitOrderToPopCustoms(cart, shipping, orderNumber);
        console.log("[WEBHOOK] POPCustoms completed: Order submitted successfully.", result);
      } catch (fulfillmentErr) {
        const errMsg = fulfillmentErr instanceof Error ? fulfillmentErr.message : "Fulfillment error";
        console.error(`[WEBHOOK] POPCustoms submission failed for order ${orderNumber}:`, errMsg);
        // Continue to database logs so we do not lose track of the transaction
      }

      // --- Database Registration (Drizzle) ---
      const customerEmail = session.customer_details?.email || session.customer_email || metadata.shipping_email || "unknown@example.com";
      const cartValueUsd = Math.round((session.amount_total || 0) / 100);
      const midnightWallet = metadata.midnight_wallet || metadata.midnight_wallet_address;
      const isEligible = cartValueUsd > 100 && !!midnightWallet;

      console.log("[WEBHOOK] Drizzle inserted: Writing initial escrow record as PENDING...");
      
      let loyaltyRecord;
      try {
        const [inserted] = await db.insert(loyaltyEscrow).values({
          stripeOrderId: session.id,
          cartValueUsd: cartValueUsd,
          midnightEscrowStatus: 'PENDING',
          premiumNftEligible: isEligible,
          customerEmail: customerEmail,
        }).returning();
        loyaltyRecord = inserted;
        console.log("[WEBHOOK] Drizzle record inserted successfully. Escrow ID:", loyaltyRecord.id);
      } catch (dbErr) {
        const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        console.error("[WEBHOOK] Drizzle insertion failed (escrow write skipped):", errMsg);
        return NextResponse.json({ received: true, error: "Database registration failed" }, { status: 200 }); // Guaranteed return
      }

      // --- Midnight Minting Circuit Breaker ---
      if (isEligible && loyaltyRecord) {
        console.log("[WEBHOOK] Midnight called: Launching mint with 10s circuit breaker...");
        
        let mintResult;
        try {
          // Promise that rejects after 10 seconds to enforce a circuit breaker timeout
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Midnight RPC network request timed out after 10s")), 10000)
          );

          mintResult = await Promise.race([
            mintZkReceipt(midnightWallet, cartValueUsd),
            timeoutPromise
          ]);
          console.log("[WEBHOOK] Midnight completed: Mint result received.", mintResult);
        } catch (mintErr) {
          const errMsg = mintErr instanceof Error ? mintErr.message : String(mintErr);
          console.warn(`[WEBHOOK] Midnight circuit breaker triggered (timed out or failed): ${errMsg}`);
          mintResult = { success: false, error: errMsg };
        }

        if (mintResult.success) {
          console.log("[WEBHOOK] Drizzle status updated: Upgrading escrow status to CLAIMED...");
          try {
            await db.update(loyaltyEscrow)
              .set({ midnightEscrowStatus: 'CLAIMED' })
              .where(eq(loyaltyEscrow.id, loyaltyRecord.id));
            console.log("[WEBHOOK] Drizzle status updated successfully to CLAIMED.");
          } catch (dbUpdateErr) {
            console.error("[WEBHOOK] Failed to update Drizzle record to CLAIMED:", dbUpdateErr);
          }
        } else {
          console.log("[WEBHOOK] Midnight mint failed or timed out. Database record left as PENDING.");
        }
      } else {
        console.log(`[WEBHOOK] Escrow not eligible for minting (Total: $${cartValueUsd}, Wallet: ${midnightWallet ? "Yes" : "No"})`);
      }
    } else {
      console.log(`[WEBHOOK] Skipping event type: ${event.type}`);
    }

    console.log("[WEBHOOK] Returning success response.");
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Webhook handler failed";
    console.error("[WEBHOOK] Fatal error in Stripe Webhook route handler:", error);
    return NextResponse.json({ received: true, error: errorMsg }, { status: 200 }); // Guaranteed return
  }
}
