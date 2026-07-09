import { calculateShippingCost, CartItem } from "../shipping";

describe("calculateShippingCost", () => {
  it("should return 0 for an empty cart", () => {
    expect(calculateShippingCost([], "US", "Standard")).toBe(0);
    expect(calculateShippingCost([], "US", "Express")).toBe(0);
  });

  describe("Standard Delivery", () => {
    it("should return correct standard cost for a single item (US - Free)", () => {
      const cart: CartItem[] = [{ sku: "item-1", quantity: 1 }];
      expect(calculateShippingCost(cart, "US", "Standard")).toBe(0);
    });

    it("should return correct standard cost for multiple items (Mexico)", () => {
      // Mexico: standardFirst: 3.00, standardNext: 3.00
      const cart: CartItem[] = [
        { sku: "item-1", quantity: 1 },
        { sku: "item-2", quantity: 1 },
      ];
      // 3.00 + (2 - 1) * 3.00 = 6.00
      expect(calculateShippingCost(cart, "MX", "Standard")).toBe(6.00);
    });

    it("should fallback to Express cost if Standard is not available (Rest Of World)", () => {
      // Rest Of World: standardAvailable: false, expressFirst: 80.00, expressNext: 60.00
      // "ZZ" is not in any zone, so it defaults to Rest Of World
      const cart: CartItem[] = [{ sku: "item-1", quantity: 1 }];
      expect(calculateShippingCost(cart, "ZZ", "Standard")).toBe(80.00);
    });
  });

  describe("Express Delivery", () => {
    it("should return correct express cost for a single item (US)", () => {
      // US: expressFirst: 21.00
      const cart: CartItem[] = [{ sku: "item-1", quantity: 1 }];
      expect(calculateShippingCost(cart, "US", "Express")).toBe(21.00);
    });

    it("should return correct express cost for multiple items (Canada)", () => {
      // Canada: expressFirst: 30.80, expressNext: 11.80
      const cart: CartItem[] = [
        { sku: "item-1", quantity: 2 },
      ];
      // 30.80 + (2 - 1) * 11.80 = 42.60
      // Due to floating point arithmetic, use toBeCloseTo
      expect(calculateShippingCost(cart, "CA", "Express")).toBeCloseTo(42.60);
    });
  });
});
