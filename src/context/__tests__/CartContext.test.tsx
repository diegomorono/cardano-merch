import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart, CartItem } from '../CartContext';

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  const mockItem1: CartItem = {
    sku: 'SKU123',
    quantity: 1,
    size: 'M',
    price: 10,
    title: 'Test Item 1',
  };

  const mockItem2: CartItem = {
    sku: 'SKU456',
    quantity: 2,
    size: 'L',
    price: 15,
    title: 'Test Item 2',
  };

  // Mock console.error to suppress React's error boundary logs during the expected error test
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('throws error when useCart is used outside of CartProvider', () => {
    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');
  });

  it('provides empty initial state', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('adds an item to the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual(mockItem1);
    expect(result.current.total).toBe(10);
  });

  it('updates quantity when adding an existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(20);
  });

  it('removes an item from the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
      result.current.addToCart(mockItem2);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.removeFromCart(mockItem1.sku);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].sku).toBe(mockItem2.sku);
  });

  it('updates quantity of an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    act(() => {
      result.current.updateQuantity(mockItem1.sku, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.total).toBe(50);
  });

  it('removes item when quantity is updated to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    act(() => {
      result.current.updateQuantity(mockItem1.sku, 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('clears the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
      result.current.addToCart(mockItem2);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('loads cart from localStorage on mount', () => {
    window.localStorage.setItem('cart', JSON.stringify([mockItem1]));

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].sku).toBe(mockItem1.sku);
    expect(result.current.total).toBe(10);
  });

  it('saves cart to localStorage on change', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.addToCart(mockItem1);
    });

    const savedCart = JSON.parse(window.localStorage.getItem('cart') || '[]');
    expect(savedCart).toHaveLength(1);
    expect(savedCart[0].sku).toBe(mockItem1.sku);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    window.localStorage.setItem('cart', 'invalid-json');

    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      jest.runAllTimers();
    });

    expect(result.current.items).toHaveLength(0);
  });
});
