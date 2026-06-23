---
name: cardano-merch
description: Página web de e-commerce integrada con API de POPCustoms y pasarela de pago para crear, gestionar y listar productos "merchandise" con un enfoque en la comunidad de blockchain de Cardano y automatización de redes sociales.
---

# CARDANO-MERCH

## OVERVIEW
Este proyecto es la evolución del antiguo ecosistema de WordPress/WooCommerce hacia una arquitectura web moderna, ligera y propia (desplegada en Vercel). El objetivo principal es vender mercancía temática de Cardano automatizando la manufactura, el envío a través de POPCustoms y la promoción en la red social X (Twitter) sin intervención manual.

## 1. CORE DIRECTIVE
Establish and maintain a fully autonomous, secure, mobile-first e-commerce and marketing pipeline that synchronizes merchandise inventory via the POPCustoms/POPStandard API, processes payments, fulfills orders, and automates promotional publishing on X (Twitter) without manual intervention.

## 2. INGESTION LOGIC
When this skill is triggered, the AI must verify, locate, and read the following environmental and project inputs:

Target Workspace Directories: Locate the src/app/, src/lib/, src/context/, productos/ (containing source catalog references like 

cardano-black-shirt.xlsx
), and configurations (package.json, next.config.ts).
Infrastructure Configuration Variables:
POPCUSTOMS_API_KEY: Authentication key for backend requests to the POPStandard/POPCustoms system.
POPCUSTOMS_STORE_ID: Identifier of the target merchant store.
POPCUSTOMS_ACCOUNT & POPCUSTOMS_PASSWORD: Access credentials for obtaining authorization tokens.
X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET: Developer keys for publishing tweets via the X API v2.
PAYMENT_GATEWAY_CONFIG: Stripe keys, Coinbase Commerce endpoints, or Web3 Cardano Wallet connection protocols.
Documentation Context: Ingest rules from AGENTS.md
 to align Next.js version-specific guidelines (Next.js 16+).

## 3. BOUNDARY CONSTRAINTS
Zero Client-Side Credentials: Hardcoding or exposing API keys, client secrets, accounts, or tokens in the client bundle, static HTML, or public JS files is permanently banned. All communications with POPCustoms/X must route through Vercel Serverless Functions (/api/*).
Immutable Copy: The original text content of the public site is treated as immutable. Any visual or structural updates must not alter, rewrite, or delete established user-facing copy.
No Placeholder Graphics: Do not use temporary placeholder images, empty boxes, or broken visual links. Real mockups or assets generated via generate_image must be displayed.
No Client-Side State Reset: Cart states must remain intact in localStorage across page reloads, tab closures, and navigation events.
No Unstyled Browser Defaults: Native buttons, dropdown select menus, color pickers, inputs, and browser scrollbars are banned. All elements must utilize the Cardano design system styles.
Strict Tailwind Usage: Use TailwindCSS v4 with PostCSS (configured via @tailwindcss/postcss) exclusively for styling. Do not use legacy Tailwind v3 directives.
Explicit Code Blocks: Do not output truncated, omitted, or abstract code snippets (e.g. // Rest of the code goes here). All code blocks must be complete and copy-paste ready.

## 4. OPERATIONAL ALGORITHM
[STEP 01: INITIALIZATION & ENVIRONMENT VALIDATION]
IF any critical variables (POPCUSTOMS_API_KEY, POPCUSTOMS_STORE_ID, POPCUSTOMS_ACCOUNT, POPCUSTOMS_PASSWORD) are undefined:
    THEN halt execution and report environment configuration failure.
ELSE:
    Proceed to [STEP 02].
[STEP 02: DYNAMIC CATALOG SYNCHRONIZATION]
IF client invokes catalog page OR admin modifies /productos files:
    THEN call Vercel Serverless login endpoint (https://i.popcustoms.com/api/v1/login).
    IF login succeeds:
        THEN use bearer token to query store info (https://i.popcustoms.com/api/v1/stores/{storeId}).
        THEN map products, sizes, prices, and active mockups.
        THEN update local application state cache.
    ELSE:
        THEN display user-friendly checkout error and fallback to cache.
[STEP 03: LIVE SHIPPING CALCULATION]
IF client enters address details in the checkout flow:
    THEN send asynchronous POST request to /api/orders.
    THEN backend calls POPCustoms API shipping calculator.
    IF shipping rate returns successfully:
        THEN add shipping rate to subtotal, update user-facing checkout total, and enable the payment button.
    ELSE:
        THEN display "Shipping not available for this region" and disable the payment button.
[STEP 04: TRANSACTION AND AUTOMATIC FULFILLMENT]
IF payment transaction succeeds (ADA wallet confirm OR Stripe/Coinbase payment):
    THEN dispatch order details payload to backend order routing.
    THEN backend sends order POST request to POPCustoms API endpoint.
    IF order creation succeeds:
        THEN clear client shopping cart in localStorage.
        THEN render the transaction success modal containing the tracking number.
        THEN trigger [STEP 05].
    ELSE:
        THEN alert admin dashboard of fulfillment failure and log payload for manual dispatch.
[STEP 05: MARKETING AUTOMATION]
IF order fulfills successfully OR new product is published to catalog:
    THEN trigger Serverless marketing worker (/api/post-tweet).
    THEN construct and authorize request to X API v2.
    THEN tweet status update containing product image and link (omitting customer PII).
## 5. SERIALIZATION PROTOCOL
When outputting code, documentation, or results, the output must comply with the following structural layout:

Direct File References: All file references must be formatted as clickable markdown links with the file:// scheme using absolute path structures (e.g., [globals.css](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/src/app/globals.css)).
Structural Headers: Maintain strict nested hierarchies: H1 (#), H2 (##), H3 (###), H4 (####).
Technical Spec Tables: Present tools, endpoints, and credentials in Markdown tables.
Complete Syntax Blocks: Fenced code blocks must specify language targets and show full, unabridged source code ready for immediate integration.
Prose Exclusion: Do not include introductory notes, pleasantries, greetings, or sign-offs. Output begins directly with the H1 header.

## 6. PROJECT STACK & RESOURCE MAP
Category	Technology / Destination
Frontend	Next.js 16+ (App Router), React 19, TailwindCSS v4, Framer Motion
Backend	Next.js Serverless Route Handlers (src/app/api/*)
Hosting	Vercel (Production Domain: https://cardano-merch.vercel.app)
Integrations	POPCustoms/POPStandard API (Fulfillment), X API v2 (Marketing)
Credentials	Stored securely in Vercel Environment Variables (process.env)
