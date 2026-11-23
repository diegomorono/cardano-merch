"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Product, WallId } from "./types";

interface StoreWallProps {
  products: Product[];
  onNavigateWall: (wall: WallId) => void;
  onInspectProduct: (product: Product) => void;
  isDimmed: boolean;
}

export function StoreWall({
  products,
  onNavigateWall,
  onInspectProduct,
  isDimmed,
}: StoreWallProps) {
  const clothingList = products.filter((p) => p.category === "clothing");
  const drinkwareList = products.filter((p) => p.category === "drinkware");
  const gearList = products.filter((p) => p.category === "gear");

  const wings: Array<{
    wall: WallId;
    indexLabel: string;
    label: string;
    caption: string;
    count: number;
    hero: Product | undefined;
  }> = [
    {
      wall: "clothing",
      indexLabel: "01",
      label: "Clothing Rail",
      caption: "Heavyweight Tees & Pullover Hoodies",
      count: clothingList.length,
      hero: clothingList[0],
    },
    {
      wall: "drinkware",
      indexLabel: "02",
      label: "Drinkware Ledges",
      caption: "Insulated Steel & Frosted Glass",
      count: drinkwareList.length,
      hero: drinkwareList[0],
    },
    {
      wall: "gear",
      indexLabel: "03",
      label: "Gear Pegboard",
      caption: "Sovereign Carry & Desk Hardware",
      count: gearList.length,
      hero: gearList[0],
    },
  ];

  return (
    <section
      aria-label="Store Entrance Wall"
      className="relative w-full h-full flex flex-col items-center justify-center px-5 sm:px-10 pt-20 pb-24 select-none"
    >
      {/* Monumental Architectural Back-Wall Emblem */}
      <motion.div
        animate={{ opacity: isDimmed ? 0.1 : 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 sm:mb-9 max-w-2xl"
      >
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.42em] text-[#6CA0FF] mb-2">
          EPOCH 2026 · ARCHITECTURAL FLAGSHIP
        </p>
        <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl tracking-[-0.04em] uppercase text-white drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
          CARDANO MERCH
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-2.5 tracking-wide">
          Peer-reviewed apparel &amp; sovereign hardware. Enter a showroom wing or click any artifact to inspect.
        </p>
      </motion.div>

      {/* 3 Curated Vault Wing Portals — Strictly Equal-Height Baseline Alignment */}
      <motion.div
        animate={{
          opacity: isDimmed ? 0 : 1,
          scale: isDimmed ? 0.96 : 1,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 items-stretch gap-3.5 sm:gap-6"
      >
        {wings.map((wing, idx) => (
          <motion.div
            key={wing.wall}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-3xl bg-[#0F121B]/76 border border-white/10 hover:border-[#0055FF]/55 backdrop-blur-xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-stretch justify-between gap-4 shadow-[0_24px_60px_rgba(0,0,0,0.58)] transition-all duration-300"
          >
            {/* Overhead Cone Wash */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-[#0055FF]/12 blur-2xl opacity-50 group-hover:opacity-90 transition-opacity"
            />

            {/* Uniform Artifact Visual Stage */}
            <button
              type="button"
              onClick={() => (wing.hero ? onInspectProduct(wing.hero) : onNavigateWall(wing.wall))}
              className="relative w-24 h-24 sm:w-full sm:h-44 md:h-48 flex items-center justify-center shrink-0 cursor-pointer bg-transparent border-none p-0"
              aria-label={`Inspect featured ${wing.label} item`}
            >
              {wing.hero && (
                <img
                  src={wing.hero.images[0]}
                  alt={wing.hero.title}
                  className="max-h-full max-w-full object-contain garment-contact-shadow transition-transform duration-500 group-hover:scale-[1.06] group-hover:-translate-y-1"
                  draggable={false}
                />
              )}
            </button>

            {/* Wing Metadata & Baseline-Aligned Enter Wall CTA */}
            <div className="flex-1 flex flex-col justify-between gap-3 text-left">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.26em] text-[#6CA0FF]">
                  {wing.indexLabel} · {wing.count} Pieces
                </span>
                <h2 className="font-heading text-base sm:text-lg font-bold uppercase tracking-tight text-white">
                  {wing.label}
                </h2>
                <p className="text-[11px] sm:text-xs text-white/45 leading-snug">
                  {wing.caption}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateWall(wing.wall)}
                className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white text-white hover:text-[#050505] border border-white/10 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 cursor-pointer"
              >
                <span>Enter Wall</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
