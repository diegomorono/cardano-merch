import { productsCatalog } from "./src/lib/catalog";

// Simulate the logic in route.ts
function runBaseline(cart: { sku: string; quantity: number }[]) {
  const start = process.hrtime.bigint();

  const validatedCartDetails = [];

  for (const item of cart) {
    const match = productsCatalog
      .map((p) => {
        const variant = p.variants.find((v) => v.sku === item.sku);
        if (variant) {
          return {
            title: `${p.title} (${variant.size})`,
            price: variant.recommendPrice,
            sku: variant.sku,
          };
        }
        return null;
      })
      .find((x) => x !== null);

    if (match) {
      validatedCartDetails.push(match);
    }
  }

  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // ms
}

function runOptimized(cart: { sku: string; quantity: number }[]) {
  const start = process.hrtime.bigint();

  const validatedCartDetails = [];

  // Create index
  const catalogMap = new Map<string, { title: string, price: number, sku: string }>();
  for (const p of productsCatalog) {
    for (const v of p.variants) {
      catalogMap.set(v.sku, {
        title: `${p.title} (${v.size})`,
        price: v.recommendPrice,
        sku: v.sku,
      });
    }
  }

  for (const item of cart) {
    const match = catalogMap.get(item.sku);
    if (match) {
      validatedCartDetails.push(match);
    }
  }

  const end = process.hrtime.bigint();
  return Number(end - start) / 1e6; // ms
}

// Generate a large catalog for testing
const originalCatalog = [...productsCatalog];
for (let i = 0; i < 1000; i++) {
  productsCatalog.push({
    id: `dummy-${i}`,
    title: `Dummy ${i}`,
    description: "...",
    color: "Black",
    images: [],
    variants: Array.from({ length: 10 }, (_, j) => ({
      sku: `DUMMY-${i}-${j}`,
      size: `${j}`,
      color: "Black",
      weight: 100,
      dropshippingPrice: 10,
      recommendPrice: 20
    }))
  });
}

const cart = [];
for (let i = 0; i < 1000; i++) {
  cart.push({ sku: `DUMMY-${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 10)}`, quantity: 1 });
}

console.log("Warming up...");
for (let i = 0; i < 10; i++) {
  runBaseline(cart);
  runOptimized(cart);
}

let baselineTotal = 0;
let optimizedTotal = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  baselineTotal += runBaseline(cart);
  optimizedTotal += runOptimized(cart);
}

console.log(`Baseline Avg: ${(baselineTotal / iterations).toFixed(4)} ms`);
console.log(`Optimized Avg: ${(optimizedTotal / iterations).toFixed(4)} ms`);
console.log(`Improvement: ${((baselineTotal - optimizedTotal) / baselineTotal * 100).toFixed(2)}%`);
