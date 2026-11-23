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

describe("Spatial Virtual Showroom & POPCustoms Catalog Invariants", () => {
  test("1. Showroom renders fixed 100dvh stage without legacy badge regression", () => {
    render(<Home />);

    expect(screen.queryByText(/Official Merch \/ 2026/i)).not.toBeInTheDocument();

    const stage = screen.getByTestId("spatial-showroom-stage");
    expect(stage).toBeInTheDocument();
    expect(stage.className).toContain("h-[100dvh]");
    expect(stage.className).toContain("overflow-hidden");
  });

  test("2. All four showroom walls, floating dock tabs, and Shirts/Hoodies rack filters render", () => {
    render(<Home />);

    expect(screen.getByTestId("showroom-wall-store")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-clothing")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-drinkware")).toBeInTheDocument();
    expect(screen.getByTestId("showroom-wall-gear")).toBeInTheDocument();

    expect(screen.getByRole("navigation", { name: /Showroom Wall Navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Shirts/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Hoodies/i })).toBeInTheDocument();
  });

  test("3. Clicking centered POPCustoms garment opens Inspection Mode, adds real SKU to bag, and Escape exits", () => {
    render(<Home />);

    const firstClothing = productsCatalog.find((p) => p.category === "clothing");
    expect(firstClothing).toBeDefined();

    const centerGarment = screen.getByTestId(`rack-garment-${firstClothing!.id}`);
    fireEvent.click(centerGarment);

    const dialog = screen.getByRole("dialog", { name: new RegExp(`Inspect ${firstClothing!.title}`, "i") });
    expect(dialog).toBeInTheDocument();

    const addToBagBtn = screen.getByTestId("add-to-bag-cta");
    fireEvent.click(addToBagBtn);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("add-to-bag-cta")).toHaveTextContent(/Added to bag/i);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: new RegExp(`Inspect ${firstClothing!.title}`, "i") })
    ).not.toBeInTheDocument();
  });

  test("4. Dual-fit POPCustoms shirts expose Men/Women selector switching fit SKU and photo", () => {
    render(<Home />);

    const dualFitShirt = productsCatalog.find(
      (p) => p.category === "clothing" && p.fits && p.fits.includes("Men") && p.fits.includes("Women")
    );
    expect(dualFitShirt).toBeDefined();

    // Filter to Shirts so dual-fit shirt is immediately accessible on the rack
    fireEvent.click(screen.getByRole("tab", { name: /Shirts/i }));
    const rackBtn = screen.getByTestId(`rack-garment-${dualFitShirt!.id}`);
    // Click once to focus if not centered, then click again to open Inspection Mode
    fireEvent.click(rackBtn);
    if (!screen.queryByRole("dialog")) {
      fireEvent.click(screen.getByTestId(`rack-garment-${dualFitShirt!.id}`));
    }

    const menBtn = screen.getByTestId("fit-option-men");
    const womenBtn = screen.getByTestId("fit-option-women");
    expect(menBtn).toHaveAttribute("aria-checked", "true");
    expect(womenBtn).toHaveAttribute("aria-checked", "false");

    fireEvent.click(womenBtn);
    expect(womenBtn).toHaveAttribute("aria-checked", "true");
    expect(menBtn).toHaveAttribute("aria-checked", "false");

    fireEvent.click(screen.getByTestId("add-to-bag-cta"));
    expect(mockAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringMatching(/Women/i),
      })
    );
  });

  test("5. Checkout page logo retains hover effects, grayscale transition, and motion wrapper", () => {
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
