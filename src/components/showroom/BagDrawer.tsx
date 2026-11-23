"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Product } from "./types";

interface BagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export function BagDrawer({ isOpen, onClose, products }: BagDrawerProps) {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const router = useRouter();

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const resolveProductThumb = (sku: string): string | null => {
    for (const p of products) {
      const variant = p.variants.find((v) => v.sku === sku);
      if (variant) {
        const fitImg =
          variant.fit && p.fitColorImages?.[variant.fit]?.[variant.color]?.[0];
        const colorImg = p.colorImages?.[variant.color]?.[0];
        return fitImg ?? colorImg ?? p.images[0] ?? null;
      }
    }
    return null;
  };

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-md bg-[#0C0E14]/95 border-l border-white/10 backdrop-blur-2xl shadow-[-24px_0_80px_rgba(0,0,0,0.7)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-sm font-bold tracking-[0.18em] uppercase text-white">
                    Vault Bag
                  </h2>
                  <p className="text-[11px] text-white/45 tracking-wide">
                    {totalCount} {totalCount === 1 ? "artifact" : "artifacts"} staged
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shopping bag"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Line Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white/30" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-heading text-sm uppercase tracking-[0.18em] text-white/75">
                      Your Bag Is Empty
                    </p>
                    <p className="text-xs text-white/40 max-w-[240px]">
                      Select any hanging garment or display artifact inside the vault to inspect and add.
                    </p>
                  </div>
                </div>
              ) : (
                items.map((item) => {
                  const thumb = resolveProductThumb(item.sku);
                  return (
                    <div
                      key={item.sku}
                      className="flex gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10"
                    >
                      <div className="w-16 h-20 rounded-xl bg-[#161923] border border-white/10 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-5 h-5 text-white/25" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-white/45 mt-0.5 uppercase tracking-wider">
                              Size: {item.size} · SKU {item.sku}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.sku)}
                            aria-label={`Remove ${item.title}`}
                            className="text-white/35 hover:text-red-400 transition-colors p-1 cursor-pointer bg-transparent border-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-heading text-sm font-bold text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-white/10 bg-[#090B10]/90 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                  Estimated Subtotal
                </span>
                <span className="font-heading text-xl font-black text-white">
                  ${total.toFixed(2)} <span className="text-xs font-normal text-white/40">USD</span>
                </span>
              </div>
              <p className="text-[11px] text-white/40">
                Global POPCustoms fulfillment &amp; live shipping rates calculated at checkout.
              </p>
              <button
                type="button"
                disabled={items.length === 0}
                onClick={handleCheckout}
                className="w-full py-3.5 px-6 rounded-full bg-white text-[#050505] font-heading text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
