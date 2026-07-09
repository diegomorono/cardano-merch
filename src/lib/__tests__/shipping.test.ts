import { getShippingOptions, CartItem } from '../shipping';

describe('getShippingOptions', () => {
  it('should return an empty array if the cart is empty', () => {
    const emptyCart: CartItem[] = [];
    const options = getShippingOptions(emptyCart, 'US');
    expect(options).toEqual([]);
  });

  it('should return standard and express options for US', () => {
    const cart: CartItem[] = [
      { sku: 'TEST-SKU-1', quantity: 1 }
    ];
    const options = getShippingOptions(cart, 'US');

    expect(options).toHaveLength(2);
    expect(options[0].id).toBe('Standard');
    expect(options[1].id).toBe('Express');
    expect(options[0].cost).toBe(0); // US standard first is 0
    expect(options[1].cost).toBe(21); // US express first is 21
  });

  it('should calculate additional item costs for Express in Rest of World', () => {
    const cart: CartItem[] = [
      { sku: 'TEST-SKU-1', quantity: 2 }
    ];
    const options = getShippingOptions(cart, 'XX'); // Unknown code -> Rest Of World

    // Rest of world has no standard
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe('Express');
    // First is 80, next is 60 -> 140
    expect(options[0].cost).toBe(140);
  });
});
