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
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});
  const [loadedSrcs, setLoadedSrcs] = useState<Record<string, boolean>>({});

  const stageImageRef = useRef<HTMLDivElement | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  // Filter variants cleanly by selected Fit (Men / Women / Unisex) & Color
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

  // Resolve gallery images for the currently selected Fit (Men/Women) + Colorway
  const activeGallery = useMemo(() => {
    if (selectedFit && product.fitColorImages?.[selectedFit]?.[selectedColor]?.length) {
      return product.fitColorImages[selectedFit][selectedColor];
    }
    const colorSet = product.colorImages?.[selectedColor];
    if (colorSet && colorSet.length > 0) return colorSet;
    return product.images;
  }, [product.fitColorImages, product.colorImages, product.images, selectedFit, selectedColor]);

  // Eagerly warm browser image cache for all angles of the active Fit + Colorway
  useEffect(() => {
    if (typeof window === "undefined") return;
    activeGallery.forEach((src) => {
      const preload = new window.Image();
      preload.onload = () => {
        setLoadedSrcs((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
      };
      preload.onerror = () => {
        setFailedSrcs((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
      };
      preload.src = src;
    });
  }, [activeGallery]);

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
  };

  const handleSelectFit = (fit: GarmentFit) => {
    setSelectedFit(fit);
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
  const isHoodie = product.garmentType === "hoodie";
  const colorOptions = product.availableColors ?? [];
  const fitOptions = product.fits ?? [];

  const viewLabels = isHoodie
    ? ["Studio", "Men Model", "Women Model"]
    : ["Studio", selectedFit === "Women" ? "Women Model" : "Men Model", "Detail"];

  const safeImageIdx = Math.min(activeImageIdx, Math.max(0, activeGallery.length - 1));
  const desiredSrc = activeGallery[safeImageIdx] || product.images[0];
  const fallbackStudioSrc = activeGallery[0] || product.images[0];
  const resolvedSrc = failedSrcs[desiredSrc] ? fallbackStudioSrc : desiredSrc;
  const isModelView = safeImageIdx > 0 && !failedSrcs[desiredSrc];
  const isRemoteLoading = isModelView && !loadedSrcs[resolvedSrc];

  return (
    <motion.div
      key="inspection-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${product.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-40 pointer-events-none flex flex-col md:flex-row items-center justify-between md:justify-between px-3.5 sm:px-8 lg:px-14 pt-[76px] sm:pt-[88px] pb-[76px] sm:pb-[92px] gap-2.5 sm:gap-4 md:gap-10"
    >
      {/* Backdrop Click-Out Layer */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="pointer-events-auto fixed inset-0 bg-[#07090F]/52 backdrop-blur-[3px] -z-10"
      />

      {/* LEFT-CENTER STAGE: Zoomed Garment/Artifact + Flanking Circular < > Steppers */}
      <div className="pointer-events-auto relative flex-1 min-h-0 w-full md:w-auto h-[33dvh] sm:h-[38dvh] md:h-[72dvh] flex flex-col items-center justify-center">
        {/* Subtle Spotlight Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[220px] sm:w-[380px] h-[220px] sm:h-[380px] rounded-full bg-[radial-gradient(circle,rgba(0,85,255,0.22)_0%,rgba(255,255,255,0.06)_45%,transparent_72%)] blur-2xl"
        />

        {/* Previous Piece Arrow (<) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(-1)}
            aria-label="Inspect previous piece"
            className="absolute left-0.5 sm:left-3 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Zoomed Product Visual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${product.id}-${selectedFit ?? "default"}-${selectedColor}-${safeImageIdx}`}
            ref={stageImageRef}
            initial={{ opacity: 0, scale: 0.92, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, x: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 flex items-center justify-center ${
              isModelView
                ? "h-[82%] max-h-[250px] sm:max-h-[340px] md:max-h-[460px] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-white/95 p-1.5 sm:p-2 shadow-[0_28px_70px_rgba(0,0,0,0.75)] ring-1 ring-white/20"
                : isApparel
                  ? "h-[86%] max-h-[260px] sm:max-h-[340px] md:max-h-[520px] aspect-[3/4]"
                  : "h-[84%] max-h-[220px] sm:max-h-[300px] md:max-h-[420px] aspect-square"
            }`}
          >
            {isRemoteLoading && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[#141824] animate-pulse flex items-center justify-center"
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">
                  Loading Preview…
                </span>
              </div>
            )}
            <img
              src={resolvedSrc}
              alt={`${product.title} — ${selectedFit ? `${selectedFit} · ` : ""}${selectedColor}`}
              draggable={false}
              onLoad={() =>
                setLoadedSrcs((prev) =>
                  prev[resolvedSrc] ? prev : { ...prev, [resolvedSrc]: true }
                )
              }
              onError={() =>
                setFailedSrcs((prev) =>
                  prev[desiredSrc] ? prev : { ...prev, [desiredSrc]: true }
                )
              }
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isRemoteLoading ? "opacity-0" : "opacity-100"
              } ${isModelView ? "rounded-xl sm:rounded-2xl" : "garment-active-shadow"}`}
            />
          </motion.div>
        </AnimatePresence>

        {/* Next Piece Arrow (>) */}
        {siblingProducts.length > 1 && (
          <button
            type="button"
            onClick={() => stepSibling(1)}
            aria-label="Inspect next piece"
            className="absolute right-0.5 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#111520]/85 hover:bg-white text-white hover:text-[#050505] border border-white/16 backdrop-blur-xl flex items-center justify-center shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Studio / On Model View Switcher Pill */}
        {activeGallery.length > 1 && (
          <div className="mt-1.5 sm:mt-3 z-20 inline-flex items-center gap-1 p-1 rounded-full bg-[#0E111A]/85 border border-white/14 backdrop-blur-xl shrink-0">
            {activeGallery.map((_, i) => {
              const active = safeImageIdx === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  aria-label={`View ${viewLabels[i] ?? `Angle ${i + 1}`}`}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors cursor-pointer border-none whitespace-nowrap ${
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

      {/* RIGHT FLOATING PURCHASE CARD — Sticky-Footer Sheet so ADD TO BAG is ALWAYS visible without scrolling */}
      <motion.div
        initial={{ opacity: 0, x: 32, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24, scale: 0.97 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto relative w-full max-w-md md:w-[415px] lg:w-[440px] max-h-[47dvh] md:max-h-[76dvh] flex flex-col overflow-hidden rounded-3xl bg-[#10131C]/95 border border-white/14 backdrop-blur-2xl shadow-[0_32px_90px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.08)] text-white shrink-0"
      >
        {/* Close Button (×) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product inspection"
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-white/[0.07] hover:bg-white/16 border border-white/12 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Upper Product Details & Variant Selectors */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-6 pt-4 sm:pt-5 pb-3 space-y-3">
          {/* Header Block */}
          <div className="pr-9 space-y-1">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.24em] text-[#6CA0FF]">
              {product.eyebrow} · {product.era}
            </p>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <h2 className="font-heading text-lg sm:text-[22px] font-black tracking-tight uppercase leading-[1.12] text-white">
                {product.title}
              </h2>
              <div className="flex items-baseline gap-1.5 shrink-0">
                <span className="font-heading text-xl sm:text-[22px] font-black text-white">
                  ${activeVariant.recommendPrice.toFixed(2)}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">
                  USD
                </span>
              </div>
            </div>
          </div>

          {/* Concise 2-line description so all 8 sizes stay visible without scroll even on 720p laptops */}
          <p className="text-[11px] sm:text-xs text-white/55 leading-relaxed line-clamp-2">
            {product.description}
          </p>

          {/* Configuration Controls: Fit (Men / Women) -> Colour -> Size */}
          <div className="pt-2.5 border-t border-white/10 space-y-2.5 sm:space-y-3">
            {/* Prominent Men / Women Cut Selector */}
            {fitOptions.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                    Select Fit
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    {selectedFit === "Women" ? "Women's Fit" : "Men's Fit"}
                  </span>
                </div>
                <div
                  role="radiogroup"
                  aria-label="Select Men or Women fit"
                  className="grid grid-cols-2 gap-2"
                >
                  {fitOptions.map((fit) => {
                    const active = selectedFit === fit;
                    return (
                      <button
                        key={fit}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        data-testid={`fit-option-${fit.toLowerCase()}`}
                        onClick={() => handleSelectFit(fit)}
                        className={`py-1.5 sm:py-2 px-4 rounded-full text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer border ${
                          active
                            ? "bg-white text-[#050505] border-white shadow-[0_6px_18px_rgba(255,255,255,0.22)]"
                            : "bg-white/[0.04] text-white/70 border-white/14 hover:border-white/35 hover:text-white"
                        }`}
                      >
                        {fit}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colour Selector */}
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

            {/* Pill-Style Size / Specification Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                  Select {isApparel ? "size" : "specification"}
                </span>
                <span className="text-[10px] font-mono text-white/40 truncate">
                  {product.fabricSpec}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {filteredVariants.map((variant) => {
                  const isSelected = variant.sku === activeVariant.sku;
                  return (
                    <button
                      key={variant.sku}
                      type="button"
                      onClick={() => setSelectedSize(variant.size)}
                      aria-pressed={isSelected}
                      className={`min-w-[42px] px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 cursor-pointer border ${
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
        </div>

        {/* PINNED STICKY ACTION FOOTER: Quantity + Add to Bag ALWAYS visible on Mobile & Laptop */}
        <div className="shrink-0 border-t border-white/10 bg-[#0C0F18]/98 px-4 sm:px-7 py-3 sm:py-4 flex items-center gap-2.5 md:flex-col md:items-stretch md:gap-3">
          {/* Quantity Stepper */}
          <div className="flex items-center justify-between md:w-full">
            <span className="hidden md:inline text-xs font-medium text-white/65">Quantity</span>
            <div className="inline-flex items-center rounded-full bg-white/[0.06] border border-white/14 p-0.5 shrink-0">
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
                className="w-7 text-center text-xs font-bold text-white"
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
            className="flex-1 md:flex-none md:w-full py-3 sm:py-3.5 px-5 rounded-full font-heading text-xs sm:text-sm font-bold uppercase tracking-[0.18em] flex items-center justify-center gap-2 transition-colors duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.45)] cursor-pointer border-none"
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
        </div>
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
