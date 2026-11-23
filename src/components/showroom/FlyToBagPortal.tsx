"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FlyCloneItem } from "./types";

interface FlyToBagPortalProps {
  clones: FlyCloneItem[];
  onCloneComplete: (id: string) => void;
}

export function FlyToBagPortal({ clones, onCloneComplete }: FlyToBagPortalProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[120] pointer-events-none overflow-hidden"
    >
      <AnimatePresence>
        {clones.map((clone) => {
          const originCenterX = clone.originRect.left + clone.originRect.width / 2;
          const originCenterY = clone.originRect.top + clone.originRect.height / 2;
          const targetCenterX = clone.targetRect.left + clone.targetRect.width / 2;
          const targetCenterY = clone.targetRect.top + clone.targetRect.height / 2;

          const deltaX = targetCenterX - originCenterX;
          const deltaY = targetCenterY - originCenterY;

          // Quadratic bezier curve control offset creating a natural upward arc toward the top-right bag
          const midX = deltaX * 0.48;
          const midY = Math.min(deltaY * 0.45, -110) - 70;

          return (
            <motion.div
              key={clone.id}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 0.85,
                rotate: 0,
              }}
              animate={{
                x: [0, midX, deltaX],
                y: [0, midY, deltaY],
                scale: [1, 0.56, 0.12],
                opacity: [0.85, 0.72, 0],
                rotate: [0, 8, 16],
              }}
              transition={{
                duration: 0.65,
                times: [0, 0.48, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => onCloneComplete(clone.id)}
              style={{
                position: "fixed",
                left: clone.originRect.left,
                top: clone.originRect.top,
                width: clone.originRect.width,
                height: clone.originRect.height,
                willChange: "transform, opacity",
              }}
              className="flex items-center justify-center"
            >
              <img
                src={clone.src}
                alt={clone.alt}
                className="w-full h-full object-contain drop-shadow-[0_18px_36px_rgba(0,51,173,0.45)]"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
