---
id: "945B98EC3478"
title: "Cardano Merch Repository Index"
type: "map_of_content"
status: "processed"
tags: ["#index/codebase", "#status/linked"]
thermodynamic_constraint: "Reference latency optimization via indexed mapping"
---

# CARDANO MERCH REPOSITORY INDEX

This index maps the files, routes, and logical directories of the `cardano-merch` e-commerce Next.js application to allow rapid navigation and type resolution for AI agents.

---

## 📂 COMPONENT DIRECTORY MAPPINGS

*   [src/app/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/) — Next.js Application Router containing layout, styling, and page views.
*   [src/lib/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/) — Helper libraries, APIs, and shared utility modules.
*   [src/context/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/context/) — React context state providers for cart persistence.
*   [productos/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/productos/) — Excel spreadsheets managing catalog product attributes.
*   [delivery_data/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/delivery_data/) — Directory containing shipping rates and quotes datasets.
*   [public/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/public/) — Static brand assets, mockup images, and logos.
*   [supabase/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/supabase/) — Local Supabase migrations database schema folder.

---

## 📄 CANONICAL ROUTE FILES

*   [src/app/page.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/page.tsx) — **Main Catalog Grid View:** Displays products and handles cart addition actions.
*   [src/app/checkout/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/checkout/) — **Checkout Handler views:** Visual validation and success triggers.
*   [src/app/api/checkout/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/checkout/route.ts) — **Stripe Session API:** Handles Stripe session configuration and creation.
*   [src/app/api/webhooks/stripe/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/webhooks/stripe/route.ts) — **Stripe Webhook API:** Processes payments asynchronously and triggers order fulfillment.
*   [src/app/api/shipping/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/shipping/route.ts) — **Shipping API:** Calculates available transit methods and dynamic quotes.
*   [src/lib/shipping.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/shipping.ts) — **Shipping Utility:** Implements zone lookup logic and print-on-demand cost aggregation.

---

## 🗄️ DATABASE & BLOCKCHAIN INTEGRATIONS

*   [src/lib/db/schema.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/db/schema.ts) — **Database Schema:** Defines Drizzle database schema structures and indexes.
*   [src/lib/db/drizzle.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/db/drizzle.ts) — **Drizzle Client:** Connection pool configuration and ORM client initialization.
*   [drizzle.config.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/drizzle.config.ts) — **Drizzle Kit Config:** Controls schema migrations and code-generation outputs to local Supabase directory.
*   [src/lib/midnight/mint-receipt.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/midnight/mint-receipt.ts) — **Midnight Mint Utility:** Connects to Midnight Wallet Connector and executes Compact token contract mints.

---

## 🔗 SYSTEM CONNECTIONS

- **Root MOC Registry:** [[INDEX|Root Index]]
- **Parent Directory Index:** [[10_PROJECTS/INDEX|Projects Index]]
- **Domain MOC Mapping:** [[11_001_PROJ_CARDANO_MERCH|Cardano Merch MOC]]
- **Underlying Core Axiom:** [[90_002_TECH_STACK|02 Tech Stack]]
