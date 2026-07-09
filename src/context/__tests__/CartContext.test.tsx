import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';

// Helper component to consume context
const TestComponent = () => {
  const { items, addToCart, updateQuantity, removeFromCart, clearCart, total } = useCart();
  return (
    <div>
      <div data-testid="items-length">{items.length}</div>
      <div data-testid="total">{total}</div>
      <button
        data-testid="add"
        onClick={() => addToCart({ sku: '123', quantity: 1, size: 'M', price: 10, title: 'Test Item' })}
      >
        Add
      </button>
      <button
        data-testid="update"
        onClick={() => updateQuantity('123', 0)}
      >
        Update to 0
      </button>
      <button
        data-testid="update-normal"
        onClick={() => updateQuantity('123', 2)}
      >
        Update to 2
      </button>
    </div>
  );
};

describe('CartContext', () => {
  it('removes item when quantity is updated to 0', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item
    act(() => {
      screen.getByTestId('add').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('10');

    // Update to 0
    act(() => {
      screen.getByTestId('update').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0');
  });

  it('updates quantity normally', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Add item
    act(() => {
      screen.getByTestId('add').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('10');

    // Update to 2
    act(() => {
      screen.getByTestId('update-normal').click();
    });

    expect(screen.getByTestId('items-length').textContent).toBe('1');
    expect(screen.getByTestId('total').textContent).toBe('20');
  });
});
