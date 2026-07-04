# Cardano Merch: AI Context & Command Reference

This file primes the AI agent on codebase parameters, test suites, styling conventions, and secure API routing to ensure clean and framework-compliant code generation.

---

## 1. BUILD, TEST & LINT COMMANDS

Always use the following package-specific commands:

*   **Development Server:** `npm run dev`
*   **Production Build:** `npm run build`
*   **Start Build Server:** `npm run start`
*   **Lint Codebase:** `npm run lint`
*   **Run Jest Tests:** `npm run test`
*   **Run Jest in Watch Mode:** `npm run test:watch`
*   **Generate Coverage Report:** `npm run test:coverage`

---

## 2. PROJECT STACK BOUNDARIES

Do not introduce dependencies outside of these pre-approved versions:

*   **Core:** Next.js (v16.2.9), React (v19.2.4), TypeScript, Framer Motion (v12.40.0).
*   **Styling:** Tailwind CSS (v4) with `@tailwindcss/postcss` and PostCSS.
*   **Payments:** Stripe Node SDK (^22.3.0) and `@stripe/stripe-js` (^9.8.0).
*   **Icons:** Lucide React (^1.20.0).

---

## 3. STRICT CODING CONVENTIONS

*   **Zero Client Credentials:** Security is paramount. Do not write API keys, hashes, tokens, or credentials in client-side components. All integrations with POPCustoms, Twitter/X, and Stripe checkout APIs must route through serverless handler functions inside `src/app/api/*`.
*   **Type Safety:** Strict TypeScript typing. Avoid using `any`; define explicit interfaces for all API payloads and states.
*   **Tailwind CSS v4:** Styling must adhere strictly to TailwindCSS v4 tokens. Do not override layouts with custom arbitrary utilities unless approved.
*   **Shopping Cart State:** Persist shopping cart state in `localStorage` across page reloads.
*   **Zero-Hallucination Rule:** Complete file rendering from line 1 is required when modifying code. Precede all code modifications with a detailed pseudo-code logical map.

---

## 4. SYSTEM CONNECTIONS

*   **Operational Blueprint:** [11_001_PROJ_CARDANO_MERCH MOC](file:///C:/Users/User/.gemini/antigravity-ide/scratch/My%20Second%20Brain/vault/10_PROJECTS/11_CARDANO_MERCH/11_001_PROJ_CARDANO_MERCH.md)
*   **Core Tech Stack Axiom:** [90_002_TECH_STACK.md](file:///C:/Users/User/.gemini/antigravity-ide/scratch/My%20Second%20Brain/vault/90_NOTES/90_002_TECH_STACK.md)
*   **Main Code Registry:** [cardano-merch/INDEX.md](file:///c:/Users/User/.gemini/antigravity-ide/scratch/cardano-merch/INDEX.md)
