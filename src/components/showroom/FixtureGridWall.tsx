"use client";

import { motion } from "framer-motion";
import { Product } from "./types";

interface FixtureGridWallProps {
  variant: "drinkware" | "gear";
  title: string;
  subtitle: string;
  items: Product[];
  onInspectProduct: (product: Product) => void;
  isInspecting: boolean;
}

export function FixtureGridWall({
  variant,
  title,
  subtitle,
  items,
  onInspectProduct,
  isInspecting,
}: FixtureGridWallProps) {
  const isDrinkware = variant === "drinkware";
  const topShelf = isDrinkware ? items.slice(0, 2) : [];
  const bottomShelf = isDrinkware ? items.slice(2) : [];

  return (
    <section
      aria-label={`${title} Display Wall`}
      className="relative w-full h-full flex flex-col items-center justify-center px-4 sm:px-10 pt-[84px] sm:pt-[94px] pb-[84px] sm:pb-[94px] overflow-y-auto no-scrollbar select-none"
    >
      <div className="w-full flex flex-col items-center justify-center my-auto">
        {/* Centered Wall Heading — Strictly bounded below Top HUD */}
        <motion.div
          animate={{ opacity: isInspecting ? 0.08 : 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-3 sm:mb-4 lg:mb-6 shrink-0"
        >
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.34em] text-[#6CA0FF]">
            {subtitle}
          </p>
          <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white mt-0.5">
            {title}
          </h2>
        </motion.div>

        <motion.div
          animate={{
            opacity: isInspecting ? 0 : 1,
            scale: isInspecting ? 0.94 : 1,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full ${isDrinkware ? "max-w-3xl" : "max-w-4xl"}`}
        >
          {isDrinkware ? (
            /* DRINKWARE WALL: Dual Floating Brushed-Steel Architectural Ledges */
            <div className="space-y-4 sm:space-y-5 lg:space-y-7">
              {[topShelf, bottomShelf].map((shelfItems, shelfIdx) => (
                <div key={shelfIdx} className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2 bottom-2 left-4 sm:left-8 w-[3px] bg-gradient-to-b from-white/15 via-white/8 to-transparent rounded-full"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2 bottom-2 right-4 sm:right-8 w-[3px] bg-gradient-to-b from-white/15 via-white/8 to-transparent rounded-full"
                  />

                  <div className="grid grid-cols-2 gap-3 sm:gap-10 px-4 sm:px-14 pb-1.5 relative z-10 items-end">
                    {shelfItems.map((item) => {
                      const price = item.variants[0]?.recommendPrice ?? 0;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          data-testid={`fixture-item-${item.id}`}
                          whileHover={{ y: -5, scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 320, damping: 24 }}
                          onClick={() => onInspectProduct(item)}
                          className="group relative flex flex-col items-center bg-transparent border-none p-1 cursor-pointer focus:outline-none"
                        >
                          <div className="relative w-[clamp(96px,16dvh,156px)] h-[clamp(96px,16dvh,156px)] flex items-end justify-center">
                            <div
                              aria-hidden="true"
                              className="absolute bottom-1 w-20 sm:w-24 h-3.5 rounded-full bg-black/75 blur-md"
                            />
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              draggable={false}
                              className="relative z-10 max-h-full max-w-full object-contain garment-contact-shadow group-hover:brightness-110 transition-[filter] duration-300"
                            />
                          </div>
                          <div className="mt-1.5 text-center w-full max-w-[175px] sm:max-w-[230px]">
                            <p className="text-[11px] sm:text-xs font-semibold text-white/90 group-hover:text-[#8BB4FF] transition-colors line-clamp-2 leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">
                              ${price.toFixed(2)}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="relative h-2.5 sm:h-3 w-full rounded-full vault-shelf-ledge">
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-10 -bottom-2 h-3 bg-[#0055FF]/20 blur-lg rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* GEAR WALL: Architectural Perforated Steel Pegboard Display Frame */
            <div className="vault-pegboard-panel rounded-3xl p-3.5 sm:p-5 lg:p-7 border border-white/12 relative">
              <span aria-hidden="true" className="absolute top-3 left-3 w-2 h-2 rounded-full bg-white/25" />
              <span aria-hidden="true" className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white/25" />
              <span aria-hidden="true" className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-white/25" />
              <span aria-hidden="true" className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-white/25" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-5 items-stretch">
                {items.map((item) => {
                  const price = item.variants[0]?.recommendPrice ?? 0;
                  const isWide = item.id === "hydra-desk-mat";
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      data-testid={`fixture-item-${item.id}`}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      onClick={() => onInspectProduct(item)}
                      className={`group relative rounded-2xl bg-[#0D1018]/78 hover:bg-[#131826]/92 border border-white/10 hover:border-[#0055FF]/55 p-3 sm:p-3.5 lg:p-4 flex flex-col items-center justify-between gap-2 shadow-[0_18px_40px_rgba(0,0,0,0.65)] transition-colors cursor-pointer focus:outline-none ${
                        isWide ? "col-span-2 sm:col-span-2" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-gradient-to-b from-white/50 to-white/15 border border-black/60 shadow-sm shrink-0"
                      />

                      <div
                        className={`relative flex items-center justify-center ${
                          isWide
                            ? "w-full h-[clamp(72px,13dvh,114px)]"
                            : "w-[clamp(74px,13dvh,114px)] h-[clamp(74px,13dvh,114px)]"
                        }`}
                      >
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          draggable={false}
                          className="max-h-full max-w-full object-contain garment-contact-shadow group-hover:brightness-110 transition-[filter] duration-300"
                        />
                      </div>

                      <div className="text-center w-full">
                        <p className="text-[11px] sm:text-xs font-semibold text-white/90 group-hover:text-[#8BB4FF] transition-colors line-clamp-2 leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-white/50 mt-0.5">
                          ${price.toFixed(2)}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
