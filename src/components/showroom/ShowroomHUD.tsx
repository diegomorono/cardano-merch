"use client";

import { RefObject } from "react";
import { motion } from "framer-motion";
import { Info, ShoppingBag } from "lucide-react";
import { SHOWROOM_WALLS, WallId } from "./types";

interface ShowroomHUDProps {
  activeWall: WallId;
  onSelectWall: (wall: WallId) => void;
  totalCartItems: number;
  bagBounceTick: number;
  cartIconRef: RefObject<HTMLButtonElement | null>;
  onOpenBag: () => void;
  onOpenInfo: () => void;
  onResetHome: () => void;
}

export function ShowroomHUD({
  activeWall,
  onSelectWall,
  totalCartItems,
  bagBounceTick,
  cartIconRef,
  onOpenBag,
  onOpenInfo,
  onResetHome,
}: ShowroomHUDProps) {
  return (
    <>
      {/* TOP BAR HUD: Top-Center Brand Mark + Top-Right Bag Button */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between">
        {/* Left spacer to keep brand mathematically centered */}
        <div className="w-11 sm:w-12" aria-hidden="true" />

        {/* Top-Center Brand Mark */}
        <button
          type="button"
          onClick={onResetHome}
          aria-label="Cardano Merch Virtual Store Home"
          className="pointer-events-auto group flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-[#0055FF] transition-colors duration-300 shadow-[0_0_20px_rgba(0,51,173,0.3)]">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <span className="font-heading font-black text-base sm:text-lg tracking-[0.12em] uppercase text-white">
              CARDANO
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.42em] uppercase text-white/45 group-hover:text-white/75 transition-colors">
            VIRTUAL STORE
          </span>
        </button>

        {/* Top-Right Minimalist Bag Icon with Live Badge & Bounce */}
        <motion.button
          ref={cartIconRef}
          type="button"
          onClick={onOpenBag}
          aria-label={`Open shopping bag (${totalCartItems} items)`}
          key={bagBounceTick}
          initial={bagBounceTick > 0 ? { scale: 1 } : false}
          animate={
            bagBounceTick > 0
              ? { scale: [1, 1.24, 0.94, 1.04, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#10131C]/80 hover:bg-[#171C29]/95 border border-white/14 backdrop-blur-xl flex items-center justify-center text-white shadow-[0_12px_32px_rgba(0,0,0,0.55)] transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={1.9} />
          {totalCartItems > 0 && (
            <span
              data-testid="bag-badge-count"
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#0055FF] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_16px_rgba(0,85,255,0.7)] ring-2 ring-[#0E1118]"
            >
              {totalCartItems}
            </span>
          )}
        </motion.button>
      </header>

      {/* BOTTOM-CENTER FLOATING PILL NAVIGATION DOCK */}
      <nav
        aria-label="Showroom Wall Navigation"
        className="fixed bottom-4 sm:bottom-7 left-1/2 -translate-x-1/2 z-50 max-w-[94vw]"
      >
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-[#0E111A]/88 border border-white/14 backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)]">
          {SHOWROOM_WALLS.map((wall) => {
            const isActive = activeWall === wall.id;
            return (
              <button
                key={wall.id}
                type="button"
                onClick={() => onSelectWall(wall.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-[13px] font-medium tracking-wide transition-colors cursor-pointer border-none bg-transparent whitespace-nowrap ${
                  isActive ? "text-[#050505]" : "text-white/65 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="showroom-active-dock-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-white shadow-[0_4px_18px_rgba(255,255,255,0.28)]"
                  />
                )}
                <span className="relative z-10 font-semibold">{wall.label}</span>
              </button>
            );
          })}

          {/* Subtle Vertical Divider */}
          <div className="w-px h-5 bg-white/14 mx-1" aria-hidden="true" />

          {/* Info Trigger (i) */}
          <button
            type="button"
            onClick={onOpenInfo}
            aria-label="Showroom information and specifications"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent shrink-0"
          >
            <Info className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </nav>
    </>
  );
}
