"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { COLOR_SWATCH_MAP, GarmentFit, Product, ProductVariant } from "./types";

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

function getInitialFit(product: Product): GarmentFit | undefined {
  if (product.fits && product.fits.length > 0) return product.fits[0];
  return product.variants[0]?.fit;
}

function getInitialColor(product: Product): string {
  if (product.availableColors && product.availableColors.length > 0) {
    return product.availableColors[0];
  }
  return product.variants[0]?.color ?? product.color;
}

function pickDefaultSize(variants: ProductVariant[]): string {
  const pref =
    variants.find((v) => v.size === "M") ||
    variants.find((v) => v.size === "L") ||
    variants[0];
  return pref?.size ?? "";
}

function InspectionDialogContent({
  product,
  siblingProducts,
  onClose,
  onSelectSibling,
  onAddToBag,
}: InspectionDialogContentProps) {
  const [selectedFit, setSelectedFit] = useState<GarmentFit | undefined>(() =>
    getInitialFit(product)
  );
  const [selectedColor, setSelectedColor] = useState<string>(() =>
    getInitialColor(product)
  );
  const [selectedSize, setSelectedSize] = useState<string>(() =>
    pickDefaultSize(product.variants)
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

  // Filter variants cleanly by selected Fit & Color
  const filteredVariants = useMemo(() => {
    const byFit = selectedFit
      ? product.variants.filter((v) => !v.fit || v.fit === selectedFit)
      : product.variants;
    const byColor = byFit.filter(
      (v) => v.color.toLowerCase() === selectedColor.toLowerCase()
    );
    if (byColor.length > 0) return byColor;
    if (byFit.length > 0) return byFit;
    return product.variants;
  }, [product.variants, selectedFit, selectedColor]);

  const activeVariant: ProductVariant | undefined = useMemo(() => {
    return (
      filteredVariants.find((v) => v.size === selectedSize) ||
      filteredVariants.find((v) => v.size === "M") ||
      filteredVariants[0]
    );
  }, [filteredVariants, selectedSize]);

  // Resolve gallery images for the currently selected colorway
  const activeGallery = useMemo(() => {
    const colorSet = product.colorImages?.[selectedColor];
    if (colorSet && colorSet.length > 0) return colorSet;
    return product.images;
  }, [product.colorImages, product.images, selectedColor]);

  const currentIdx = siblingProducts.findIndex((p) => p.id === product.id);

  const stepSibling = (delta: number) => {
    if (siblingProducts.length <= 1 || currentIdx === -1) return;
    const nextIdx =
      (currentIdx + delta + siblingProducts.length) % siblingProducts.length;
    onSelectSibling(siblingProducts[nextIdx]);
  };

  if (!activeVariant) return null;

  const handleSelectColor = (color: string) => {
    setSelectedColor(color);
    setActiveImageIdx(0);
  };

  const handleConfirmAdd = () => {
    const cartTitle =
      product.fits && product.fits.length > 1 && selectedFit
        ? `${product.title} (${selectedFit} · ${selectedColor})`
        : product.availableColors && product.availableColors.length > 1
          ? `${product.title} (${selectedColor})`
          : product.title;

    onAddToBag(
      { ...product, title: cartTitle, images: activeGallery },
      activeVariant,
      quantity,
      stageImageRef.current
    );
    setJustAdded(true);
    setQuantity(1);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setJustAdded(false);
    }, 1800);
  };

  const isApparel = product.category === "clothing";
  const colorOptions = product.availableColors ?? [];
  const fitOptions = product.fits ?? [];
  const viewLabels = ["Studio", "On Model", "Detail"];
  const safeImageIdx = Math.min(activeImageIdx, Math.max(0, activeGallery.length - 1));
  const isModelView = safeImageIdx > 0;

  return (
    <motion.div
      key="inspection-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${product.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 pointer-events-none flex flex-col md:flex-row items-center justify-center md:justify-between px-4 sm:px-8 lg:px-14 pt-16 sm:pt-20 pb-20 sm:pb-24 gap-4 md:gap-10"
    >
      {/* Backdrop Click-Out Layer */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="pointer-events-auto fixed inset-0 bg-[#07090F]/48 backdrop-blur-[3px] -z-10"
      />

      {/* LEFT-CENTER STAGE: Zoomed Garment/Artifact + Flanking Circular < > Steppers */}
      <div className="pointer-events-auto relative flex-1 w-full md:w-auto h-[37dvh] sm:h-[42dvh] md:h-[72dvh] flex flex-col items-center justify-center">
        {/* Subtle Spotlight Halo Behind Inspected Piece */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[260px] sm:w-[400px] h-[260px] sm:h-[400px] rounded-full bg-[radial-gradient(circle,rgba(0,85,255,0.22)_0%,rgba(255,255,255,0.06)_45%,transparent_72%)] blur-2xl"
        />

        {/* Previous Piece Arrow (<) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(-1)}
            aria-label="Inspect previous piece"
            className="absolute left-1 sm:left-3 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Zoomed Product Visual (exact source coordinates for Fly-to-Bag clone) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${product.id}-${selectedColor}-${safeImageIdx}`}
            ref={stageImageRef}
            initial={{ opacity: 0, scale: 0.9, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.93, x: 12 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 flex items-center justify-center ${
              isModelView
                ? "h-[84%] max-h-[480px] aspect-square rounded-3xl overflow-hidden bg-white/95 p-2 shadow-[0_28px_70px_rgba(0,0,0,0.75)] ring-1 ring-white/20"
                : isApparel
                  ? "h-[92%] max-h-[340px] sm:max-h-[400px] md:max-h-[540px] aspect-[3/4]"
                  : "h-[88%] max-h-[260px] sm:max-h-[330px] md:max-h-[430px] aspect-square"
            }`}
          >
            <img
              src={activeGallery[safeImageIdx] || product.images[0]}
              alt={`${product.title} — ${selectedColor}`}
              draggable={false}
              className={`w-full h-full object-contain ${
                isModelView ? "rounded-2xl" : "garment-active-shadow"
              }`}
            />
          </motion.div>
        </AnimatePresence>

        {/* Next Piece Arrow (>) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(1)}
            aria-label="Inspect next piece"
            className="absolute right-1 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Studio / On Model View Switcher Pill */}
        {activeGallery.length > 1 && (
          <div className="mt-2 sm:mt-3 z-20 inline-flex items-center gap-1 p-1 rounded-full bg-[#0E111A]/85 border border-white/14 backdrop-blur-xl">
            {activeGallery.map((_, i) => {
              const active = safeImageIdx === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  aria-label={`View ${viewLabels[i] ?? `Angle ${i + 1}`}`}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer border-none ${
                    active
                      ? "bg-white text-[#050505]"
                      : "bg-transparent text-white/60 hover:text-white"
                  }`}
                >
                  {viewLabels[i] ?? `View ${i + 1}`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT FLOATING PURCHASE CARD (Desktop) / COMPACT STACKED SHEET (Mobile <768px) */}
      <motion.div
        initial={{ opacity: 0, x: 36, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 28, scale: 0.97 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative w-full max-w-md md:w-[410px] lg:w-[435px] max-h-[46dvh] md:max-h-[74dvh] overflow-y-auto rounded-3xl bg-[#10131C]/94 border border-white/14 backdrop-blur-2xl shadow-[0_32px_90px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] p-5 sm:p-7 text-white shrink-0"
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

        {/* Header Block: Eyebrow -> Title -> Price */}
        <div className="pr-9 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#6CA0FF]">
            {product.eyebrow} · {product.era}
          </p>
          <h2 className="font-heading text-xl sm:text-2xl font-black tracking-tight uppercase leading-[1.12] text-white">
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
        </div>

        {/* Description */}
        <p className="mt-3 text-xs text-white/55 leading-relaxed line-clamp-2 md:line-clamp-3">
          {product.description}
        </p>

        {/* Colour & Fit Controls Row (Aligned cleanly side-by-side when both present) */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          {colorOptions.length > 1 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-white/60">
                Colour: <span className="font-semibold text-white">{selectedColor}</span>
              </div>
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Select colorway">
                {colorOptions.map((col) => {
                  const isSelected = col === selectedColor;
                  return (
                    <button
                      key={col}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`Select color ${col}`}
                      onClick={() => handleSelectColor(col)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all border ${
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#10131C] border-white/80 scale-110"
                          : "border-white/30 hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: COLOR_SWATCH_MAP[col] ?? product.colorHex }}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full border border-white/35 shrink-0"
                style={{ backgroundColor: COLOR_SWATCH_MAP[selectedColor] ?? product.colorHex }}
              />
              <span>
                Colour: <span className="font-semibold text-white">{selectedColor}</span>
              </span>
            </div>
          )}

          {/* Fit Toggle (Men / Women for paired POPCustoms shirts) */}
          {fitOptions.length > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Cut / Fit
              </span>
              <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-white/[0.05] border border-white/12">
                {fitOptions.map((fit) => {
                  const active = selectedFit === fit;
                  return (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => setSelectedFit(fit)}
                      aria-pressed={active}
                      className={`px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider transition-colors cursor-pointer border-none ${
                        active
                          ? "bg-white text-[#050505]"
                          : "bg-transparent text-white/65 hover:text-white"
                      }`}
                    >
                      {fit}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pill-Style Size / Specification Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Select {isApparel ? "size" : "specification"}
              </span>
              <span className="text-[10px] font-mono text-white/40 truncate">
                {product.fabricSpec}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {filteredVariants.map((variant) => {
                const isSelected = variant.sku === activeVariant.sku;
                return (
                  <button
                    key={variant.sku}
                    type="button"
                    onClick={() => setSelectedSize(variant.size)}
                    aria-pressed={isSelected}
                    className={`min-w-[44px] px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-white text-[#050505] border-white shadow-[0_6px_18px_rgba(255,255,255,0.22)]"
                        : "bg-white/[0.04] text-white/75 border-white/14 hover:border-white/35 hover:text-white"
                    }`}
                  >
                    {variant.size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quantity Stepper Row */}
        <div className="mt-4 flex items-center justify-between py-2.5 border-y border-white/10">
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

        {/* Full-Width Rounded-Full Primary CTA */}
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
          className="mt-4 w-full py-3.5 px-6 rounded-full font-heading text-xs sm:text-sm font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.45)] cursor-pointer border-none"
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
