"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClothingFilter, COLOR_SWATCH_MAP, Product } from "./types";

interface ClothingRackWallProps {
  items: Product[];
  allClothingCount: number;
  shirtCount: number;
  hoodieCount: number;
  filter: ClothingFilter;
  onChangeFilter: (next: ClothingFilter) => void;
  activeIndex: number;
  onChangeIndex: (nextIndex: number) => void;
  onInspectProduct: (product: Product) => void;
  isInspecting: boolean;
  isActiveWall: boolean;
}

export function ClothingRackWall({
  items,
  allClothingCount,
  shirtCount,
  hoodieCount,
  filter,
  onChangeFilter,
  activeIndex,
  onChangeIndex,
  onInspectProduct,
  isInspecting,
  isActiveWall,
}: ClothingRackWallProps) {
  const [viewportWidth, setViewportWidth] = useState<number>(1280);
  const wheelLockRef = useRef<number>(0);

  useEffect(() => {
    const syncWidth = () => setViewportWidth(window.innerWidth);
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  const isMobile = viewportWidth < 768;
  const isCompact = viewportWidth < 1024;

  const safeIndex = Math.min(activeIndex, Math.max(0, items.length - 1));

  const stepIndex = (delta: number) => {
    if (items.length === 0) return;
    const next = Math.max(0, Math.min(items.length - 1, safeIndex + delta));
    if (next !== safeIndex) {
      onChangeIndex(next);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isActiveWall || isInspecting) return;
    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(dominantDelta) < 18) return;

    const now = Date.now();
    if (now - wheelLockRef.current < 220) return;
    wheelLockRef.current = now;

    stepIndex(dominantDelta > 0 ? 1 : -1);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isInspecting) return;
    if (info.offset.x < -42 || info.velocity.x < -300) {
      stepIndex(1);
    } else if (info.offset.x > 42 || info.velocity.x > 300) {
      stepIndex(-1);
    }
  };

  // Responsive physical rail spacing mimicking clothes hung tightly along a horizontal bar
  const centerGap = isMobile ? 164 : isCompact ? 236 : 292;
  const flankStep = isMobile ? 96 : isCompact ? 132 : 162;

  const activeItem = items[safeIndex];
  const activePrice = activeItem?.variants[0]?.recommendPrice ?? 0;
  const activeColors = activeItem?.availableColors ?? [activeItem?.color ?? "Black"];

  const filterTabs: Array<{ id: ClothingFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: allClothingCount },
    { id: "shirt", label: "Shirts", count: shirtCount },
    { id: "hoodie", label: "Hoodies", count: hoodieCount },
  ];

  return (
    <section
      aria-label="Clothing Rack Wall"
      onWheel={handleWheel}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* SUB-CATEGORY FILTER BAR (All / Shirts / Hoodies) — Centered cleanly below HUD & above rail */}
      <motion.div
        animate={{
          opacity: isInspecting ? 0 : 1,
          y: isInspecting ? -10 : 0,
        }}
        transition={{ duration: 0.3 }}
        className={`absolute top-[74px] sm:top-[86px] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 ${
          isInspecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <div
          role="tablist"
          aria-label="Filter clothing rack by garment type"
          className="inline-flex items-center gap-0.5 p-1 rounded-full bg-[#0E111A]/80 border border-white/12 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        >
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onChangeFilter(tab.id)}
                className={`relative px-3 sm:px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-colors cursor-pointer border-none bg-transparent whitespace-nowrap ${
                  isSelected ? "text-[#050505]" : "text-white/60 hover:text-white"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="clothing-subfilter-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? "text-black/55" : "text-white/35"
                    }`}
                  >
                    {tab.count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Position Counter */}
        {items.length > 0 && (
          <div className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-[#0E111A]/70 border border-white/10 text-[10px] font-mono tracking-[0.18em] text-white/55">
            {String(safeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </div>
        )}
      </motion.div>

      {/* ARCHITECTURAL WALL WATERMARK BEHIND THE RAIL */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: isInspecting ? 0.04 : 0.72,
          scale: isInspecting ? 0.95 : 1,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute top-[15.5%] sm:top-[16.5%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
      >
        <span className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-[0.16em] uppercase text-white/[0.08] whitespace-nowrap">
          CARDANO
        </span>
      </motion.div>

      {/* CENTRAL OVERHEAD SPOTLIGHT RIM-GLOW BEHIND FOCUSED GARMENT */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: isInspecting ? 0.2 : 0.78 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute top-[24%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full bg-[radial-gradient(circle,rgba(56,105,235,0.22)_0%,rgba(255,255,255,0.06)_38%,transparent_72%)] blur-2xl z-10"
      />

      {/* FULL-WIDTH HORIZONTAL BRUSHED-TITANIUM METAL RAIL */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-[22.5%] sm:top-[23%] z-20"
      >
        <div className="absolute inset-x-0 top-3 h-4 bg-black/50 blur-md" />
        <div className="relative h-[8px] sm:h-[9px] w-full vault-rail-bar" />
        <div className="absolute left-[9%] -top-1.5 w-3 h-5 rounded-sm bg-[#272D3B] border border-white/15 shadow-lg" />
        <div className="absolute right-[9%] -top-1.5 w-3 h-5 rounded-sm bg-[#272D3B] border border-white/15 shadow-lg" />
      </div>

      {/* 3D INTERACTIVE GARMENT RACK STAGE */}
      <motion.div
        drag={isInspecting ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragEnd={handleDragEnd}
        className="relative w-full h-full rack-perspective-stage z-30 cursor-grab active:cursor-grabbing"
      >
        <div className="relative w-full h-full rack-preserve-3d">
          {items.map((item, idx) => {
            const offset = idx - safeIndex;
            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;
            const sign = Math.sign(offset);

            const baseX = isCenter
              ? 0
              : sign * (centerGap + (absOffset - 1) * flankStep);

            const x = isInspecting
              ? isCenter
                ? 0
                : sign * (Math.abs(baseX) + viewportWidth * 0.58)
              : baseX;

            const rotateY = isCenter ? 0 : -sign * (isMobile ? 36 : 42);
            const scale = isCenter
              ? 1
              : Math.max(0.74, (isMobile ? 0.84 : 0.88) - (absOffset - 1) * 0.035);
            const zIndex = isCenter ? 35 : Math.max(1, 25 - absOffset);
            const opacity = isInspecting
              ? 0
              : absOffset > (isMobile ? 2 : 4)
                ? 0
                : Math.max(0.54, 1 - absOffset * 0.11);

            const isVisibleOnRail = absOffset <= (isMobile ? 3 : 5);
            if (!isVisibleOnRail && !isCenter) return null;

            return (
              <motion.button
                key={item.id}
                type="button"
                data-testid={`rack-garment-${item.id}`}
                aria-label={
                  isCenter
                    ? `Inspect ${item.title}`
                    : `Focus ${item.title} on rack`
                }
                aria-pressed={isCenter}
                onClick={() => {
                  if (isInspecting) return;
                  if (isCenter) {
                    onInspectProduct(item);
                  } else {
                    onChangeIndex(idx);
                  }
                }}
                initial={false}
                animate={{
                  x,
                  rotateY,
                  scale,
                  opacity,
                }}
                transition={{
                  type: "spring",
                  stiffness: 230,
                  damping: 27,
                  mass: 0.9,
                }}
                style={{
                  zIndex,
                  transformOrigin: "50% 5%",
                  willChange: "transform, opacity",
                }}
                className={`absolute left-1/2 -translate-x-1/2 top-[20.2%] sm:top-[20.7%] h-[49dvh] sm:h-[52dvh] max-h-[520px] min-h-[260px] aspect-[3/4] flex items-start justify-center bg-transparent border-none p-0 focus:outline-none ${
                  isInspecting ? "pointer-events-none" : "cursor-pointer"
                } group`}
              >
                <img
                  src={item.images[0]}
                  alt={item.title}
                  draggable={false}
                  className={`w-full h-full object-contain transition-[filter] duration-300 ${
                    isCenter
                      ? "garment-active-shadow group-hover:brightness-110"
                      : "garment-contact-shadow brightness-90 group-hover:brightness-105"
                  }`}
                />
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* LEFT / RIGHT RACK NAVIGATION CHEVRONS */}
      {!isInspecting && items.length > 1 && (
        <>
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => stepIndex(-1)}
            aria-label="Previous garment on rack"
            className="flex absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#10131C]/80 hover:bg-white text-white/80 hover:text-[#050505] border border-white/14 backdrop-blur-xl items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={safeIndex === items.length - 1}
            onClick={() => stepIndex(1)}
            aria-label="Next garment on rack"
            className="flex absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#10131C]/80 hover:bg-white text-white/80 hover:text-[#050505] border border-white/14 backdrop-blur-xl items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* MINIMALIST CENTERED METADATA UNDERNEATH ACTIVE GARMENT — Strictly aligned above dock */}
      <div className="pointer-events-none absolute bottom-[78px] sm:bottom-[94px] left-1/2 -translate-x-1/2 z-40 text-center w-full max-w-lg px-6">
        <AnimatePresence mode="wait">
          {activeItem && !isInspecting && (
            <motion.button
              key={activeItem.id}
              type="button"
              onClick={() => onInspectProduct(activeItem)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto inline-flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer group max-w-full"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#6CA0FF]">
                {activeItem.eyebrow}
              </span>
              <span className="text-sm sm:text-base font-semibold text-white tracking-tight group-hover:text-[#8BB4FF] transition-colors truncate max-w-[84vw] sm:max-w-md">
                {activeItem.title}
              </span>
              <div className="flex items-center justify-center gap-3 mt-0.5">
                <span className="text-xs font-medium text-white/65 tracking-wider">
                  ${activePrice.toFixed(2)} USD
                </span>
                <span className="w-1 h-1 rounded-full bg-white/25" aria-hidden="true" />
                <div className="inline-flex items-center gap-1.5" aria-label="Available colorways">
                  {activeColors.map((col) => (
                    <span
                      key={col}
                      title={col}
                      className="w-2.5 h-2.5 rounded-full border border-white/35 shadow-sm"
                      style={{ backgroundColor: COLOR_SWATCH_MAP[col] ?? activeItem.colorHex }}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
