import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Home from "../page";
import CheckoutPage from "../checkout/page";
import { productsCatalog } from "@/lib/catalog";

const mockAddToCart = jest.fn();

jest.mock("@/context/CartContext", () => ({
  useCart: () => ({
    items: [],
    addToCart: mockAddToCart,
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
    total: 0,
  }),
  CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  mockAddToCart.mockClear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => productsCatalog,
  }) as unknown as typeof fetch;
});

describe("Spatial Virtual Showroom & Checkout Invariants", () => {
  test("1. Showroom renders fixed 100dvh stage without legacy badge regression", () => {
    render(<Home />);

    expect(screen.queryByText(/Official Merch \/ 2026/i)).not.toBeInTheDocument();

    const stage = screen.getByTestId("spatial-showroom-stage");
    expect(stage).toBeInTheDocument();
    expect(stage.className).toContain("h-[100dvh]");
    expect(stage.className).toContain("overflow-hidden");
  });

  test("2. All four architectural showroom walls and floating dock tabs exist", () => {
    render(<Home />);

    expect(screen.getByTestId("showroom-wall-store")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-clothing")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-drinkware")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-gear")).toBeInTheDocument();

    const dockNav = screen.getByRole("navigation", { name: /Showroom Wall Navigation/i });
    expect(dockNav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Store$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Clothing$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Drinkware$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Gear$/i })).toBeInTheDocument();
  });

  test("3. Clicking centered rack garment enters Inspection Mode, adds to bag, and Escape exits", () => {
    render(<Home />);

    // Default activeRackIndex is 1 (midnight-privacy-hoodie)
    const centerGarment = screen.getByTestId("rack-garment-midnight-privacy-hoodie");
    fireEvent.click(centerGarment);

    const dialog = screen.getByRole("dialog", { name: /Inspect Midnight Privacy Crescent/i });
    expect(dialog).toBeInTheDocument();

    const addToBagBtn = screen.getByTestId("add-to-bag-cta");
    fireEvent.click(addToBagBtn);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(addToBagBtn).toHaveTextContent(/Added to bag/i);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: /Inspect Midnight Privacy Crescent/i })).not.toBeInTheDocument();
  });

  test("4. Checkout page logo retains hover effects, grayscale transition, and motion wrapper", () => {
    const { container: checkoutContainer } = render(<CheckoutPage />);

    const checkoutLogoContainer = checkoutContainer.querySelector(".cursor-pointer.group");
    const checkoutHasHoverEffects = checkoutLogoContainer?.className.includes("group") || false;

    const checkoutLogoImg = checkoutContainer.querySelector('img[alt="Logo"]');
    const hasGrayscaleTransition =
      Boolean(checkoutLogoImg?.className.includes("grayscale")) &&
      Boolean(checkoutLogoImg?.className.includes("group-hover:grayscale-0"));

    expect(checkoutHasHoverEffects).toBe(true);
    expect(hasGrayscaleTransition).toBe(true);

    const hasMotionDiv =
      checkoutContainer.querySelector("motion-div") ||
      checkoutContainer.querySelector('[class*="motion"]');
    expect(hasMotionDiv).toBeTruthy();
  });
});
