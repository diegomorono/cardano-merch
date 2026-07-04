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

interface ZoneRateConfig {
  standardAvailable: boolean;
  standardFirst: number;
  standardNext: number;
  expressAvailable: boolean;
  expressFirst: number;
  expressNext: number;
}

// Exact shipping quotes configured from the benchmark POPCustoms sheet (YF61 / GLD_C5-M cotton shirts)
const ZONE_OVERRIDES: Record<string, ZoneRateConfig> = {
  "United States": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 21.00,
    expressNext: 0
  },
  "Canada": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 30.80,
    expressNext: 11.80
  },
  "Europe": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 30.30,
    expressNext: 0.10
  },
  "Rest of Europe": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 30.30,
    expressNext: 0.10
  },
  "JP": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 21.00,
    expressNext: 0
  },
  "CN": {
    standardAvailable: true,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 5.00,
    expressNext: 0
  },
  "Oceania": {
    standardAvailable: true,
    standardFirst: 6.00,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 26.00,
    expressNext: 0
  },
  "Middle East": {
    standardAvailable: true,
    standardFirst: 5.00,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 35.00,
    expressNext: 0
  },
  "Mexico": {
    standardAvailable: true,
    standardFirst: 3.00,
    standardNext: 3.00, // Mexico standard increases by $3.00 for each additional item
    expressAvailable: true,
    expressFirst: 35.00, // Mexico express is $35.00
    expressNext: 0
  },
  "Asia": {
    standardAvailable: true,
    standardFirst: 3.00,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 35.00,
    expressNext: 0
  },
  "Rest Of World": {
    standardAvailable: false,
    standardFirst: 0,
    standardNext: 0,
    expressAvailable: true,
    expressFirst: 80.00,
    expressNext: 60.00
  }
};

export function getShippingZoneAndRates(countryCode: string): { zone: string; rates: ZoneRateConfig } {
  const upper = countryCode.toUpperCase();
  const data = deliveryData as any;
  const zones = data.manufacturerZones["pop"] || [];
  
  let matchedZone = null;
  for (const z of zones) {
    if (z.countries.includes(upper)) {
      matchedZone = z.zone;
      break;
    }
  }
  
  if (!matchedZone) {
    matchedZone = "Rest Of World";
  }
  
  const rates = ZONE_OVERRIDES[matchedZone] || ZONE_OVERRIDES["Rest Of World"];
  
  return {
    zone: matchedZone,
    rates
  };
}

export function getShippingOptions(cart: CartItem[], countryCode: string): ShippingOption[] {
  if (cart.length === 0) return [];

  const { rates } = getShippingZoneAndRates(countryCode);
  
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate Standard Cost: Only if standard is available in this region
  let standardCost = 0;
  if (rates.standardAvailable) {
    standardCost = rates.standardFirst + (totalItems - 1) * rates.standardNext;
  }
  
  // Calculate Express Cost: Always available
  const expressCost = rates.expressFirst + (totalItems - 1) * rates.expressNext;

  const options: ShippingOption[] = [];
  
  if (rates.standardAvailable) {
    options.push({
      id: "Standard",
      name: "Standard Delivery",
      cost: standardCost,
      estimated: "7-12 Business Days",
      description: standardCost === 0 ? "Free Standard Delivery" : `Standard Delivery ($${standardCost.toFixed(2)})`
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
  
  // Fallback to Express if method not available in this region
  const expressOption = options.find((opt) => opt.id === "Express");
  return expressOption ? expressOption.cost : 0;
}
