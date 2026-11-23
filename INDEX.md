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
*   [src/components/showroom/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/) — Spatial Virtual Showroom architectural walls, interactive 3D clothing rack, inspection mode, HUD, and fly-to-bag portal.
*   [src/lib/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/) — Helper libraries, APIs, and shared utility modules.
*   [src/context/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/context/) — React context state providers for cart persistence.
*   [productos/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/productos/) — Excel spreadsheets managing catalog product attributes.
*   [delivery_data/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/delivery_data/) — Directory containing shipping rates and quotes datasets.
*   [public/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/public/) — Static brand assets, mockup images, and logos.
*   [public/showroom/products/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/public/showroom/products/) — Transparent hanger-aligned garment PNGs and studio-isolated drinkware/gear artifacts.
*   [branding/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/branding/) — High-fidelity brand assets, designs, logos, and promotional video assets.
*   [scripts/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/scripts/) — Developer automation and interceptor scripts.
*   [supabase/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/supabase/) — Local Supabase migrations database schema folder.

---

## 🏛️ SPATIAL VIRTUAL SHOWROOM MODULES

*   [src/components/showroom/types.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/types.ts) — Strict TypeScript interfaces for showroom walls, categories, products, and fly-to-bag clones.
*   [src/components/showroom/SpatialRoomStage.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/SpatialRoomStage.tsx) — Fixed `100dvh` 4-wall continuous horizontal camera stage, keyboard navigation, and state coordinator.
*   [src/components/showroom/ShowroomHUD.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/ShowroomHUD.tsx) — Top-center brand mark, top-right bag button (`cartIconRef` bounce target), and bottom floating pill dock (`layoutId`).
*   [src/components/showroom/StoreWall.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/StoreWall.tsx) — Architectural entrance wall showcasing curated vault wings and flagship artifacts.
*   [src/components/showroom/ClothingRackWall.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/ClothingRackWall.tsx) — Brushed-titanium horizontal rail with 3D `rotateY` flanking garments, spring slides, drag/swipe, wheel, and keyboard arrows.
*   [src/components/showroom/FixtureGridWall.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/FixtureGridWall.tsx) — Floating illuminated ledges (Drinkware) and perforated steel pegboard (Gear).
*   [src/components/showroom/InspectionOverlay.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/InspectionOverlay.tsx) — Zoom-in product inspection view, `<` `>` steppers, floating purchase card, pill size selector, quantity stepper, and confirmed CTA.
*   [src/components/showroom/FlyToBagPortal.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/FlyToBagPortal.tsx) — Curved-arc fixed-position ghost clone animation flying from garment origin into `cartIconRef`.
*   [src/components/showroom/BagDrawer.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/BagDrawer.tsx) — Slide-over frosted obsidian shopping bag drawer routing into `/checkout`.
*   [src/components/showroom/VaultInfoModal.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/components/showroom/VaultInfoModal.tsx) — Vault manifesto, material integrity specifications, and showroom navigation controls.

---

## 📄 CANONICAL ROUTE FILES

*   [src/app/page.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/page.tsx) — **Spatial Virtual Showroom Entry:** Renders `SpatialRoomStage` with optional `?product=` deep-linking.
*   [src/app/productos/[id]/page.tsx](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/productos/%5Bid%5D/page.tsx) — **Product Deep-Link Route:** Opens `SpatialRoomStage` directly in Inspection Mode for target product `[id]`.
*   [src/app/checkout/](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/checkout/) — **Checkout Handler views:** Visual validation and success triggers.
*   [src/app/api/checkout/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/checkout/route.ts) — **Stripe Checkout API:** Creates Stripe checkout sessions for credit/debit payments.
*   [src/app/api/checkout-session/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/checkout-session/route.ts) — **Stripe Session Init API:** Allocates checkout identifiers and maps prices.
*   [src/app/api/orders/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/orders/route.ts) — **Orders API:** Manages transaction validation and fulfillment routing.
*   [src/app/api/orders/confirm/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/orders/confirm/route.ts) — **Order Confirmation API:** Finalizes payment receipt verification.
*   [src/app/api/products/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/products/route.ts) — **Catalog Sync API:** Serves live POPCustoms catalog normalized with showroom categories and local fallback.
*   [src/app/api/webhooks/stripe/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/webhooks/stripe/route.ts) — **Stripe Webhook API:** Processes payments asynchronously and triggers order fulfillment.
*   [src/app/api/shipping/route.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/api/shipping/route.ts) — **Shipping API:** Calculates available transit methods and dynamic quotes.
*   [src/lib/shipping.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/shipping.ts) — **Shipping Utility:** Implements zone lookup logic and print-on-demand cost aggregation.
*   [src/lib/catalog.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/catalog.ts) — **Catalog Utility:** Expanded 16-artifact showroom catalog mapped across Clothing, Drinkware, and Gear walls.
*   [src/lib/popcustoms.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/popcustoms.ts) — **POPCUSTOMS Client:** Manages API keys, bearer tokens, store requests, and order post schemas.
*   [src/lib/products.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/products.ts) — **Database Products Utility:** Re-exports catalog items and typed showroom product interfaces.
*   [src/lib/delivery-data.json](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/delivery-data.json) — **Delivery Zone Matrix:** Cache of global shipping regions and base rates.
*   [src/lib/countries-data.json](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/countries-data.json) — **Countries Database:** Standard ISO country codes mapped to English names.
*   [scripts/capture-shipping-api.js](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/scripts/capture-shipping-api.js) — **Developer Shipping API Interceptor:** Scrapes outgoing network requests to discover POPCustoms' private shipping calculator endpoint.
*   [scripts/upscale_all_staged.js](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/scripts/upscale_all_staged.js) — **Automated Staged Designs Upscaler:** Scans, validates, and upscales staged design PNG/JPEG files using the high-fidelity Lanczos3 filter to match their target upload resolutions exactly, preventing print quality warnings in POPCustoms.
*   [debug_popcustoms.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/debug_popcustoms.ts) — **Troubleshooting Script:** Root-level script to test credentials and POPCustoms bearer token flows.

---

## 🗄️ DATABASE & BLOCKCHAIN INTEGRATIONS

*   [src/lib/db/schema.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/db/schema.ts) — **Database Schema:** Defines Drizzle database schema structures and indexes.
*   [src/lib/db/drizzle.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/db/drizzle.ts) — **Drizzle Client:** Connection pool configuration and ORM client initialization.
*   [drizzle.config.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/drizzle.config.ts) — **Drizzle Kit Config:** Controls schema migrations and code-generation outputs to local Supabase directory.
*   [supabase/migrations/0001_enable_rls.sql](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/supabase/migrations/0001_enable_rls.sql) — **Database Migration:** SQL script enabling Row-Level Security on loyalty_escrow.
*   [src/lib/midnight/mint-receipt.ts](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/lib/midnight/mint-receipt.ts) — **Midnight Mint Utility:** Connects to Midnight Wallet Connector and executes Compact token contract mints.

---

## 🔗 SYSTEM CONNECTIONS

- **Root MOC Registry:** [[INDEX|Root Index]]
- **Parent Directory Index:** [[10_PROJECTS/INDEX|Projects Index]]
- **Domain MOC Mapping:** [[11_001_PROJ_CARDANO_MERCH|Cardano Merch MOC]]
- **Underlying Core Axiom:** [[90_002_TECH_STACK|02 Tech Stack]]
