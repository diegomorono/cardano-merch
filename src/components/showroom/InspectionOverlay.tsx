"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Product, ProductVariant } from "./types";

interface InspectionOverlayProps {
  product: Product | null;
  siblingProducts: Product[];
  onClose: () => void;
  onSelectSibling: (product: Product) => void;
  onAddToBag: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
    sourceEl: HTMLElement | null
  ) => void;
}

interface InspectionDialogContentProps {
  product: Product;
  siblingProducts: Product[];
  onClose: () => void;
  onSelectSibling: (product: Product) => void;
  onAddToBag: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
    sourceEl: HTMLElement | null
  ) => void;
}

function getDefaultVariantSku(product: Product): string {
  const defaultVariant =
    product.variants.find((v) => v.size === "M") ||
    product.variants.find((v) => v.size === "L") ||
    product.variants[0];
  return defaultVariant?.sku ?? "";
}

function InspectionDialogContent({
  product,
  siblingProducts,
  onClose,
  onSelectSibling,
  onAddToBag,
}: InspectionDialogContentProps) {
  const [selectedVariantSku, setSelectedVariantSku] = useState<string>(() =>
    getDefaultVariantSku(product)
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  const stageImageRef = useRef<HTMLDivElement | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const currentIdx = siblingProducts.findIndex((p) => p.id === product.id);

  const stepSibling = (delta: number) => {
    if (siblingProducts.length <= 1 || currentIdx === -1) return;
    const nextIdx =
      (currentIdx + delta + siblingProducts.length) % siblingProducts.length;
    onSelectSibling(siblingProducts[nextIdx]);
  };

  const activeVariant: ProductVariant | undefined =
    product.variants.find((v) => v.sku === selectedVariantSku) ||
    product.variants[0];

  if (!activeVariant) return null;

  const handleConfirmAdd = () => {
    onAddToBag(product, activeVariant, quantity, stageImageRef.current);
    setJustAdded(true);
    setQuantity(1);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const isApparel = product.category === "clothing";

  return (
    <motion.div
      key="inspection-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${product.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 pointer-events-none flex flex-col md:flex-row items-center justify-center md:justify-between px-4 sm:px-8 lg:px-14 pt-16 sm:pt-20 pb-20 sm:pb-24 gap-4 md:gap-8"
    >
      {/* Backdrop Click-Out Layer */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="pointer-events-auto fixed inset-0 bg-[#07090F]/38 backdrop-blur-[2px] -z-10"
      />

      {/* LEFT-CENTER STAGE: Zoomed Garment/Artifact + Flanking Circular < > Steppers */}
      <div className="pointer-events-auto relative flex-1 w-full md:w-auto h-[38dvh] sm:h-[44dvh] md:h-[72dvh] flex items-center justify-center">
        {/* Subtle Spotlight Halo Behind Inspected Piece */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[260px] sm:w-[380px] h-[260px] sm:h-[380px] rounded-full bg-[radial-gradient(circle,rgba(0,85,255,0.22)_0%,rgba(255,255,255,0.06)_45%,transparent_72%)] blur-2xl"
        />

        {/* Previous Piece Arrow (<) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(-1)}
            aria-label="Inspect previous piece"
            className="absolute left-1 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Zoomed Product Visual (exact source coordinates for Fly-to-Bag clone) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${product.id}-${activeImageIdx}`}
            ref={stageImageRef}
            initial={{ opacity: 0, scale: 0.88, x: -16 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.92, x: 16 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 flex items-center justify-center ${
              isApparel
                ? "h-full max-h-[340px] sm:max-h-[420px] md:max-h-[580px] aspect-[3/4]"
                : "h-full max-h-[260px] sm:max-h-[340px] md:max-h-[450px] aspect-square"
            }`}
          >
            <img
              src={product.images[activeImageIdx] || product.images[0]}
              alt={product.title}
              draggable={false}
              className="w-full h-full object-contain garment-active-shadow"
            />
          </motion.div>
        </AnimatePresence>

        {/* Next Piece Arrow (>) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(1)}
            aria-label="Inspect next piece"
            className="absolute right-1 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Optional Multi-View Dots when product has >1 photo */}
        {product.images.length > 1 && (
          <div className="absolute -bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E111A]/80 border border-white/12 backdrop-blur-md">
            {product.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImageIdx(i)}
                aria-label={`View angle ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer border-none ${
                  activeImageIdx === i
                    ? "w-5 bg-[#0055FF]"
                    : "w-1.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT FLOATING PURCHASE CARD (Desktop) / BOTTOM COMPACT SHEET (Mobile <768px) */}
      <motion.div
        initial={{ opacity: 0, x: 40, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 32, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative w-full max-w-md md:w-[390px] lg:w-[420px] max-h-[45dvh] md:max-h-[72dvh] overflow-y-auto rounded-3xl bg-[#10131C]/92 border border-white/14 backdrop-blur-2xl shadow-[0_32px_90px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(255,255,255,0.08)] p-5 sm:p-7 text-white shrink-0"
      >
        {/* Close Button (×) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product inspection"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/12 flex items-center justify-center text-white/65 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Eyebrow, Title, Price & Colorway */}
        <div className="pr-9 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#5B92FF]">
            {product.eyebrow} · {product.era}
          </p>
          <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight text-white">
            {product.title}
          </h2>
          <div className="flex items-baseline gap-2.5 pt-1">
            <span className="font-heading text-2xl font-black text-white">
              ${activeVariant.recommendPrice.toFixed(2)}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-white/40">
              USD
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5 text-xs text-white/55">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
              style={{ backgroundColor: product.colorHex }}
            />
            <span>Colour: {product.color}</span>
          </div>
        </div>

        {/* Compact Material Spec Line */}
        <p className="mt-3.5 text-xs text-white/50 leading-relaxed line-clamp-2 md:line-clamp-3">
          {product.description}
        </p>

        {/* Pill-Style Size / Specification Selector */}
        <div className="mt-4 sm:mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
              Select {isApparel ? "size" : "specification"}
            </span>
            <span className="text-[10px] font-mono text-white/35">
              {product.fabricSpec}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = variant.sku === activeVariant.sku;
              return (
                <button
                  key={variant.sku}
                  type="button"
                  onClick={() => setSelectedVariantSku(variant.sku)}
                  aria-pressed={isSelected}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? "bg-white text-[#050505] border-white shadow-[0_6px_20px_rgba(255,255,255,0.22)]"
                      : "bg-white/[0.04] text-white/75 border-white/14 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Stepper Row */}
        <div className="mt-4 sm:mt-5 flex items-center justify-between py-2.5 border-y border-white/10">
          <span className="text-xs font-medium text-white/65">Quantity</span>
          <div className="inline-flex items-center rounded-full bg-white/[0.05] border border-white/12 p-0.5">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span
              data-testid="inspection-quantity"
              className="w-8 text-center text-xs font-bold text-white"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Full-Width Rounded-Full Primary CTA (Add to bag -> Added to bag ✓) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirmAdd}
          data-testid="add-to-bag-cta"
          style={
            justAdded
              ? { backgroundColor: "#10B981", color: "#052E16" }
              : { backgroundColor: "#FFFFFF", color: "#050505" }
          }
          className="mt-4 sm:mt-5 w-full py-3.5 px-6 rounded-full font-heading text-xs sm:text-sm font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.45)] cursor-pointer border-none"
        >
          {justAdded ? (
            <>
              <span>Added to bag</span>
              <Check className="w-4 h-4 stroke-[2.6]" />
            </>
          ) : (
            <span>Add to bag</span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function InspectionOverlay({
  product,
  siblingProducts,
  onClose,
  onSelectSibling,
  onAddToBag,
}: InspectionOverlayProps) {
  return (
    <AnimatePresence>
      {product && (
        <InspectionDialogContent
          key={product.id}
          product={product}
          siblingProducts={siblingProducts}
          onClose={onClose}
          onSelectSibling={onSelectSibling}
          onAddToBag={onAddToBag}
        />
      )}
    </AnimatePresence>
  );
}
