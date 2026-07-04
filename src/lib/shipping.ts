import deliveryData from "./delivery-data.json";

export interface CartItem {
  sku: string;
  quantity: number;
}

export interface ShippingOption {
  id: "Standard" | "Express";
  name: string;
  cost: number;
  estimated: string;
  description: string;
}

const SKU_TO_PRODUCT_CODE: Record<string, string> = {
  "N79G24RY": "GLD_C5-M",
};

export function getProductCode(sku: string): string {
  const prefix = sku.split("-")[0];
  return SKU_TO_PRODUCT_CODE[prefix] || "GLD_C5-M";
}

interface DeliveryRate {
  standard_first: number;
  standard_next: number;
  express_first: number;
  express_next: number;
}

interface ZoneDetails {
  productCode: string;
  manufacturer: string;
  zone: string;
  rates: DeliveryRate;
}

export function getShippingZoneAndRates(sku: string, countryCode: string): ZoneDetails {
  const productCode = getProductCode(sku);
  
  // Cast deliveryData to any to query products dynamically
  const data = deliveryData as any;
  const product = data.products[productCode];
  if (!product) {
    throw new Error(`Product code ${productCode} not found in delivery database.`);
  }
  
  const mfr = product.manufacturer;
  const zones = data.manufacturerZones[mfr] || [];
  
  const upperCountry = countryCode.toUpperCase();
  let matchedZone: string | null = null;
  
  for (const z of zones) {
    if (z.countries.includes(upperCountry)) {
      matchedZone = z.zone;
      break;
    }
  }
  
  if (!matchedZone) {
    matchedZone = "Rest Of World";
  }
  
  const rates = product.rates[matchedZone] || product.rates["Rest Of World"] || {
    standard_first: 0,
    standard_next: 0,
    express_first: 0,
    express_next: 0
  };
  
  return {
    productCode,
    manufacturer: mfr,
    zone: matchedZone,
    rates
  };
}

export function getShippingOptions(cart: CartItem[], countryCode: string): ShippingOption[] {
  if (cart.length === 0) return [];

  const itemsWithRates = cart.map(item => {
    const details = getShippingZoneAndRates(item.sku, countryCode);
    return {
      ...item,
      rates: details.rates
    };
  });
  
  // Standard is free only if standard_first === 0 for all items in the cart
  let standardIsFree = true;
  for (const item of itemsWithRates) {
    if (item.rates.standard_first > 0) {
      standardIsFree = false;
    }
  }
  
  // Helper to resolve express rates including fallbacks since GLD_C5-M lists 0 for express
  const getExpressRates = (item: typeof itemsWithRates[0]) => {
    let first = item.rates.express_first;
    let next = item.rates.express_next;
    if (first === 0) {
      // Fallback: Express is standard price + $20.00 (aligns with pop's YF61 rates)
      first = item.rates.standard_first + 20.0;
      next = item.rates.standard_next + 5.0;
    }
    return { first, next };
  };
  
  // Calculate express cost: highest express_first + next for all other quantities
  let highestExpressFirst = 0;
  let highestIndex = -1;
  
  itemsWithRates.forEach((item, idx) => {
    const expressRates = getExpressRates(item);
    if (expressRates.first > highestExpressFirst) {
      highestExpressFirst = expressRates.first;
      highestIndex = idx;
    }
  });
  
  let expressCost = 0;
  itemsWithRates.forEach((item, idx) => {
    const expressRates = getExpressRates(item);
    if (idx === highestIndex) {
      expressCost += expressRates.first + (item.quantity - 1) * expressRates.next;
    } else {
      expressCost += item.quantity * expressRates.next;
    }
  });
  
  const options: ShippingOption[] = [];
  
  if (standardIsFree) {
    options.push({
      id: "Standard",
      name: "Standard Delivery",
      cost: 0,
      estimated: "7-12 Business Days",
      description: "Free Standard Delivery"
    });
  }
  
  options.push({
    id: "Express",
    name: "Express Delivery",
    cost: expressCost,
    estimated: "3-5 Business Days",
    description: `Express Delivery ($${expressCost.toFixed(2)})`
  });
  
  return options;
}

export function calculateShippingCost(
  cart: CartItem[],
  countryCode: string,
  method: "Standard" | "Express"
): number {
  const options = getShippingOptions(cart, countryCode);
  const matched = options.find((opt) => opt.id === method);
  if (matched) return matched.cost;
  
  // If method was Standard but not available (not free), fallback to Express
  const expressOption = options.find((opt) => opt.id === "Express");
  return expressOption ? expressOption.cost : 0;
}
