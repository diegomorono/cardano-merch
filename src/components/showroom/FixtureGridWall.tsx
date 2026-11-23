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
      className="relative w-full h-full flex flex-col items-center justify-center px-5 sm:px-10 pt-20 pb-24 select-none"
    >
      {/* Centered Wall Heading */}
      <motion.div
        animate={{ opacity: isInspecting ? 0.08 : 1 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-4 sm:mb-6"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.36em] text-[#6CA0FF]">
          {subtitle}
        </p>
        <h2 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
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
          <div className="space-y-5 sm:space-y-7">
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

                <div className="grid grid-cols-2 gap-4 sm:gap-10 px-6 sm:px-14 pb-2 relative z-10 items-end">
                  {shelfItems.map((item) => {
                    const price = item.variants[0]?.recommendPrice ?? 0;
                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        data-testid={`fixture-item-${item.id}`}
                        whileHover={{ y: -6, scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 320, damping: 24 }}
                        onClick={() => onInspectProduct(item)}
                        className="group relative flex flex-col items-center bg-transparent border-none p-1.5 cursor-pointer focus:outline-none"
                      >
                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-end justify-center">
                          <div
                            aria-hidden="true"
                            className="absolute bottom-1 w-24 h-4 rounded-full bg-black/75 blur-md"
                          />
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            draggable={false}
                            className="relative z-10 max-h-full max-w-full object-contain garment-contact-shadow group-hover:brightness-110 transition-[filter] duration-300"
                          />
                        </div>
                        <div className="mt-2 text-center min-h-[2.25rem] flex flex-col justify-start">
                          <p className="text-[11px] sm:text-xs font-semibold text-white/90 group-hover:text-[#8BB4FF] transition-colors line-clamp-1">
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

                <div className="relative h-3 sm:h-3.5 w-full rounded-full vault-shelf-ledge">
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
          <div className="vault-pegboard-panel rounded-3xl p-4 sm:p-7 border border-white/12 relative">
            <span aria-hidden="true" className="absolute top-3.5 left-3.5 w-2 h-2 rounded-full bg-white/25" />
            <span aria-hidden="true" className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-white/25" />
            <span aria-hidden="true" className="absolute bottom-3.5 left-3.5 w-2 h-2 rounded-full bg-white/25" />
            <span aria-hidden="true" className="absolute bottom-3.5 right-3.5 w-2 h-2 rounded-full bg-white/25" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5 items-stretch">
              {items.map((item) => {
                const price = item.variants[0]?.recommendPrice ?? 0;
                const isWide = item.id === "hydra-desk-mat";
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    data-testid={`fixture-item-${item.id}`}
                    whileHover={{ y: -5, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    onClick={() => onInspectProduct(item)}
                    className={`group relative rounded-2xl bg-[#0D1018]/78 hover:bg-[#131826]/92 border border-white/10 hover:border-[#0055FF]/55 p-3.5 sm:p-4 flex flex-col items-center justify-between gap-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.65)] transition-colors cursor-pointer focus:outline-none ${
                      isWide ? "col-span-2 sm:col-span-2" : ""
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-white/50 to-white/15 border border-black/60 shadow-sm"
                    />

                    <div
                      className={`relative flex items-center justify-center ${
                        isWide
                          ? "w-full h-24 sm:h-28"
                          : "w-24 h-24 sm:w-28 sm:h-28"
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
                      <p className="text-[11px] sm:text-xs font-semibold text-white/90 group-hover:text-[#8BB4FF] transition-colors truncate">
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
    </section>
  );
}
