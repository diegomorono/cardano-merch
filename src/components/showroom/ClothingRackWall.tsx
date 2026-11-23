"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "./types";

interface ClothingRackWallProps {
  items: Product[];
  activeIndex: number;
  onChangeIndex: (nextIndex: number) => void;
  onInspectProduct: (product: Product) => void;
  isInspecting: boolean;
  isActiveWall: boolean;
}

export function ClothingRackWall({
  items,
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

  // Step helper clamped safely to catalog bounds
  const stepIndex = (delta: number) => {
    if (items.length === 0) return;
    const next = Math.max(0, Math.min(items.length - 1, activeIndex + delta));
    if (next !== activeIndex) {
      onChangeIndex(next);
    }
  };

  // Horizontal & vertical wheel scrubbing when Clothing wall is active and not inspecting
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!isActiveWall || isInspecting) return;
    const dominantDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(dominantDelta) < 18) return;

    const now = Date.now();
    if (now - wheelLockRef.current < 240) return;
    wheelLockRef.current = now;

    stepIndex(dominantDelta > 0 ? 1 : -1);
  };

  // Tactile horizontal pointer drag / touch swipe
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isInspecting) return;
    if (info.offset.x < -42 || info.velocity.x < -300) {
      stepIndex(1);
    } else if (info.offset.x > 42 || info.velocity.x > 300) {
      stepIndex(-1);
    }
  };

  // Responsive physical rail spacing matching Talus-style dense flanking clothes on a horizontal bar
  const centerGap = isMobile ? 162 : isCompact ? 232 : 284;
  const flankStep = isMobile ? 96 : isCompact ? 132 : 162;

  const activeItem = items[activeIndex];
  const activePrice = activeItem?.variants[0]?.recommendPrice ?? 0;

  return (
    <section
      aria-label="Clothing Rack Wall"
      onWheel={handleWheel}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* ARCHITECTURAL WALL EMBLEM BEHIND THE RACK (dims smoothly in Inspection Mode) */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: isInspecting ? 0.08 : 0.9,
          scale: isInspecting ? 0.94 : 1,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute top-[11.5%] sm:top-[12%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
      >
        <span className="font-heading font-black text-4xl sm:text-6xl md:text-7xl tracking-[0.14em] uppercase text-white/[0.11] whitespace-nowrap">
          CARDANO
        </span>
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.65em] uppercase text-[#5B92FF]/45 -mt-1">
          DECENTRALIZED ARCHIVE
        </span>
      </motion.div>

      {/* CENTRAL OVERHEAD SPOTLIGHT RIM-GLOW BEHIND FOCUSED GARMENT */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: isInspecting ? 0.25 : 0.75 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute top-[26%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[460px] h-[380px] sm:h-[460px] rounded-full bg-[radial-gradient(circle,rgba(56,105,235,0.22)_0%,rgba(255,255,255,0.06)_38%,transparent_72%)] blur-2xl z-10"
      />

      {/* FULL-WIDTH HORIZONTAL BRUSHED-TITANIUM METAL RAIL */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-[25.5%] sm:top-[26%] z-20"
      >
        {/* Rail cast wall shadow */}
        <div className="absolute inset-x-0 top-3 h-4 bg-black/45 blur-md" />
        {/* Main cylindrical titanium bar */}
        <div className="relative h-[8px] sm:h-[10px] w-full vault-rail-bar" />
        {/* Architectural wall-mount steel brackets */}
        <div className="absolute left-[10%] -top-1.5 w-3 h-5 rounded-sm bg-[#272D3B] border border-white/15 shadow-lg" />
        <div className="absolute right-[10%] -top-1.5 w-3 h-5 rounded-sm bg-[#272D3B] border border-white/15 shadow-lg" />
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
            const offset = idx - activeIndex;
            const absOffset = Math.abs(offset);
            const isCenter = offset === 0;
            const sign = Math.sign(offset);

            // Compute exact 3D rack transform coordinates
            const baseX = isCenter
              ? 0
              : sign * (centerGap + (absOffset - 1) * flankStep);

            // When Inspection Mode activates, smoothly push non-focused garments off-screen
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
                : Math.max(0.58, 1 - absOffset * 0.11);

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
                  transformOrigin: "50% 6%",
                  willChange: "transform, opacity",
                }}
                className={`absolute left-1/2 -translate-x-1/2 top-[23.3%] sm:top-[23.8%] w-[235px] sm:w-[295px] md:w-[335px] lg:w-[365px] aspect-[3/4] flex items-start justify-center bg-transparent border-none p-0 focus:outline-none ${
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

      {/* SUBTLE LEFT / RIGHT RACK NAVIGATION CHEVRONS (Desktop + Touch fallback) */}
      {!isInspecting && items.length > 1 && (
        <>
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => stepIndex(-1)}
            aria-label="Previous garment on rack"
            className="hidden sm:flex absolute left-5 lg:left-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-[#10131C]/75 hover:bg-[#191F2E] border border-white/14 backdrop-blur-xl items-center justify-center text-white/80 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={activeIndex === items.length - 1}
            onClick={() => stepIndex(1)}
            aria-label="Next garment on rack"
            className="hidden sm:flex absolute right-5 lg:right-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-[#10131C]/75 hover:bg-[#191F2E] border border-white/14 backdrop-blur-xl items-center justify-center text-white/80 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* MINIMALIST CENTERED METADATA UNDERNEATH ACTIVE GARMENT */}
      <div className="pointer-events-none absolute bottom-[84px] sm:bottom-[104px] left-1/2 -translate-x-1/2 z-40 text-center w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          {activeItem && !isInspecting && (
            <motion.button
              key={activeItem.id}
              type="button"
              onClick={() => onInspectProduct(activeItem)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto inline-flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer group"
            >
              <span className="text-xs sm:text-sm font-semibold text-white tracking-wide group-hover:text-[#7BA8FF] transition-colors">
                {activeItem.title}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-white/55 tracking-wider">
                ${activePrice.toFixed(2)} USD
              </span>
              <span className="text-[9px] uppercase tracking-[0.28em] text-[#5B92FF]/80 mt-0.5 opacity-80 group-hover:opacity-100">
                Click garment to inspect
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
