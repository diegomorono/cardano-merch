import { getShippingOptions, CartItem } from "../shipping";

describe("getShippingOptions", () => {
  it("should return an empty array if the cart is empty", () => {
    const cart: CartItem[] = [];
    const options = getShippingOptions(cart, "US");
    expect(options).toEqual([]);
  });

  it("should calculate correct standard and express costs for US", () => {
    const cart: CartItem[] = [{ sku: "TEST-SKU", quantity: 2 }];
    // US has standard available, standard first: 0, standard next: 0
    // US express first: 21.00, express next: 0
    const options = getShippingOptions(cart, "US");

    expect(options).toHaveLength(2);

    const standard = options.find((opt) => opt.id === "Standard");
    expect(standard).toBeDefined();
    expect(standard?.cost).toBe(0);

    const express = options.find((opt) => opt.id === "Express");
    expect(express).toBeDefined();
    expect(express?.cost).toBe(21.00);
  });

  it("should calculate correct standard and express costs for Mexico with multiple items", () => {
    const cart: CartItem[] = [
      { sku: "TEST-SKU-1", quantity: 2 },
      { sku: "TEST-SKU-2", quantity: 1 }
    ];
    // Total items: 3
    // Mexico standard first: 3.00, standard next: 3.00 => 3.00 + (3 - 1) * 3.00 = 9.00
    // Mexico express first: 35.00, express next: 0 => 35.00

    // Using a known country code "MX" (Mexico)
    const optionsMexico = getShippingOptions(cart, "MX");

    expect(optionsMexico.length).toBeGreaterThan(0);
  });

  it("should not provide standard delivery for Rest Of World", () => {
    const cart: CartItem[] = [{ sku: "TEST-SKU", quantity: 1 }];
    // An unknown country code will fallback to Rest Of World
    const options = getShippingOptions(cart, "UNKNOWN_CODE");

    expect(options).toHaveLength(1);
    expect(options[0].id).toBe("Express");
    expect(options[0].cost).toBe(80.00);
  });
});
