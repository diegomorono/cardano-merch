CREATE TYPE "public"."midnight_escrow_status" AS ENUM('PENDING', 'CLAIMED', 'FORFEITED');--> statement-breakpoint
CREATE TABLE "loyalty_escrow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_order_id" text NOT NULL,
	"cart_value_usd" integer NOT NULL,
	"midnight_escrow_status" "midnight_escrow_status" DEFAULT 'PENDING' NOT NULL,
	"premium_nft_eligible" boolean DEFAULT false NOT NULL,
	"customer_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_escrow_stripe_order_id_unique" UNIQUE("stripe_order_id")
);
--> statement-breakpoint
CREATE INDEX "customer_email_idx" ON "loyalty_escrow" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "loyalty_escrow" USING btree ("created_at");