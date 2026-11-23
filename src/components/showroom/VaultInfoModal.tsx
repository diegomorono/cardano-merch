"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Command, ShieldCheck, Sparkles, X } from "lucide-react";

interface VaultInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MATERIAL_SPECS = [
  "Premium Organic Cotton",
  "Heavyweight 220 GSM",
  "Eco-Friendly Print",
  "Ethical Production",
] as const;

const CONTROLS = [
  { key: "← / →", action: "Glide garments along the rail or step through items" },
  { key: "Click Center", action: "Enter Inspection Mode with live sizing & specs" },
  { key: "Drag / Wheel", action: "Tactile horizontal scrub across the rack" },
  { key: "Esc", action: "Exit Inspection Mode or close overlays" },
] as const;

export function VaultInfoModal({ isOpen, onClose }: VaultInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="About Cardano Merch Virtual Store"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-3xl bg-[#10131C]/95 border border-white/12 backdrop-blur-2xl shadow-[0_32px_100px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-white"
            >
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shrink-0">
                    <img
                      src="/logo.jpg"
                      alt="Cardano Merch Emblem"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4D88FF]">
                      Decentralized Wear · EST. 2026
                    </p>
                    <h2 className="font-heading text-xl font-black tracking-tight uppercase mt-0.5">
                      Cardano Merch Vault
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close vault information"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 pt-5">
                {/* Material Integrity */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4D88FF]" />
                    <span>Material Integrity</span>
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed border-l-2 border-[#0033AD] pl-4">
                    Global Cardano Commerce with Secure Digital Logistics. Every garment and hard-good artifact is engineered for cryptographic purists, Haskell/Plutus architects, and sovereign network participants.
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {MATERIAL_SPECS.map((spec) => (
                    <div
                      key={spec}
                      className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/8 px-3.5 py-2.5 text-xs text-white/75"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF] shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>

                {/* Spatial Navigation Controls */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/50">
                    <Command className="w-3.5 h-3.5 text-[#4D88FF]" />
                    <span>Showroom Controls</span>
                  </div>
                  <div className="rounded-2xl bg-black/30 border border-white/8 divide-y divide-white/8">
                    {CONTROLS.map((ctrl) => (
                      <div
                        key={ctrl.key}
                        className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs"
                      >
                        <kbd className="px-2 py-0.5 rounded-md bg-white/8 border border-white/12 font-mono text-[10px] text-white/90 shrink-0">
                          {ctrl.key}
                        </kbd>
                        <span className="text-white/55 text-right">{ctrl.action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Manifesto */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/35">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#4D88FF]" />
                    Verified Quality
                  </span>
                  <span>Built for the most badass, truly decentralized community alive.</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
