/**
 * Pseudo-code Logical Map:
 * 1. Import pgTable, uuid, text, integer, pgEnum, boolean, timestamp, index from Drizzle's pg-core.
 * 2. Define the 'midnight_escrow_status' enum with values: 'PENDING', 'CLAIMED', 'FORFEITED'.
 * 3. Create the 'loyalty_escrow' table with specified fields mapping Stripe checkouts to Midnight ZK-Receipt eligibility.
 * 4. Configure B-Tree indexes on 'customer_email' (lookups) and 'created_at' (sorting/filtering).
 * 5. Ensure that nullability and default values conform exactly to specification constraints.
 */

import { pgTable, uuid, text, integer, pgEnum, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Define the enum type for Midnight escrow status
export const escrowStatusEnum = pgEnum('midnight_escrow_status', ['PENDING', 'CLAIMED', 'FORFEITED']);

// Define the loyalty_escrow table
export const loyaltyEscrow = pgTable('loyalty_escrow', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeOrderId: text('stripe_order_id').unique().notNull(),
  cartValueUsd: integer('cart_value_usd').notNull(),
  midnightEscrowStatus: escrowStatusEnum('midnight_escrow_status').default('PENDING').notNull(),
  premiumNftEligible: boolean('premium_nft_eligible').default(false).notNull(),
  customerEmail: text('customer_email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return [
    index('customer_email_idx').on(table.customerEmail),
    index('created_at_idx').on(table.createdAt),
  ];
});
