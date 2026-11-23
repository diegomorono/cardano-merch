"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { productsCatalog } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import { BagDrawer } from "./BagDrawer";
import { ClothingRackWall } from "./ClothingRackWall";
import { FixtureGridWall } from "./FixtureGridWall";
import { FlyToBagPortal } from "./FlyToBagPortal";
import { InspectionOverlay } from "./InspectionOverlay";
import { ShowroomHUD } from "./ShowroomHUD";
import { StoreWall } from "./StoreWall";
import {
  ClothingFilter,
  FlyCloneItem,
  Product,
  ProductVariant,
  SHOWROOM_WALLS,
  WallId,
} from "./types";
import { VaultInfoModal } from "./VaultInfoModal";

interface SpatialRoomStageProps {
  initialProductId?: string | null;
}

function resolveInitialWall(initialProductId: string | null): WallId {
  if (!initialProductId) return "clothing";
  const matched = productsCatalog.find(
    (p) => p.id === initialProductId || p.popcustomsId === initialProductId
  );
  return matched ? matched.category : "clothing";
}

function resolveInitialRackIndex(initialProductId: string | null): number {
  const clothing = productsCatalog.filter((p) => p.category === "clothing");
  if (!initialProductId) return Math.min(2, Math.max(0, clothing.length - 1));
  const idx = clothing.findIndex(
    (p) => p.id === initialProductId || p.popcustomsId === initialProductId
  );
  return idx >= 0 ? idx : Math.min(2, Math.max(0, clothing.length - 1));
}

export function SpatialRoomStage({ initialProductId = null }: SpatialRoomStageProps) {
  const [catalog, setCatalog] = useState<Product[]>(productsCatalog);
  const [activeWall, setActiveWall] = useState<WallId>(() =>
    resolveInitialWall(initialProductId)
  );
  const [clothingFilter, setClothingFilter] = useState<ClothingFilter>("all");
  const [activeRackIndex, setActiveRackIndex] = useState<number>(() =>
    resolveInitialRackIndex(initialProductId)
  );
  const [inspectedProductId, setInspectedProductId] = useState<string | null>(() => {
    if (!initialProductId) return null;
    const matched = productsCatalog.find(
      (p) => p.id === initialProductId || p.popcustomsId === initialProductId
    );
    return matched ? matched.id : null;
  });
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [flyClones, setFlyClones] = useState<FlyCloneItem[]>([]);
  const [bagBounceTick, setBagBounceTick] = useState<number>(0);

  const cartIconRef = useRef<HTMLButtonElement | null>(null);
  const { items: cartItems, addToCart } = useCart();

  // Hydrate dynamically from /api/products while preserving instant zero-skeleton initial render
  useEffect(() => {
    let cancelled = false;
    async function syncCatalog() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setCatalog(data as Product[]);
        }
      } catch (error) {
        console.warn("[Showroom Catalog Sync]: Retaining compiled vault catalog.", error);
      }
    }
    syncCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Partition catalog cleanly into architectural walls & clothing sub-filters
  const allClothingItems = useMemo(
    () => catalog.filter((p) => p.category === "clothing"),
    [catalog]
  );
  const shirtCount = useMemo(
    () => allClothingItems.filter((p) => p.garmentType !== "hoodie").length,
    [allClothingItems]
  );
  const hoodieCount = useMemo(
    () => allClothingItems.filter((p) => p.garmentType === "hoodie").length,
    [allClothingItems]
  );
  const visibleClothingItems = useMemo(() => {
    if (clothingFilter === "all") return allClothingItems;
    if (clothingFilter === "hoodie") {
      return allClothingItems.filter((p) => p.garmentType === "hoodie");
    }
    return allClothingItems.filter((p) => p.garmentType !== "hoodie");
  }, [allClothingItems, clothingFilter]);

  const drinkwareItems = useMemo(
    () => catalog.filter((p) => p.category === "drinkware"),
    [catalog]
  );
  const gearItems = useMemo(
    () => catalog.filter((p) => p.category === "gear"),
    [catalog]
  );

  const inspectedProduct = useMemo(
    () => catalog.find((p) => p.id === inspectedProductId) ?? null,
    [catalog, inspectedProductId]
  );

  const inspectedSiblings = useMemo(() => {
    if (!inspectedProduct) return [];
    if (inspectedProduct.category === "clothing") return visibleClothingItems;
    if (inspectedProduct.category === "drinkware") return drinkwareItems;
    return gearItems;
  }, [inspectedProduct, visibleClothingItems, drinkwareItems, gearItems]);

  const totalCartItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const wallIndex = useMemo(
    () => SHOWROOM_WALLS.findIndex((w) => w.id === activeWall),
    [activeWall]
  );

  const handleSelectWall = useCallback((wall: WallId) => {
    setInspectedProductId(null);
    setActiveWall(wall);
  }, []);

  const handleChangeClothingFilter = useCallback(
    (nextFilter: ClothingFilter) => {
      setClothingFilter(nextFilter);
      const nextCount =
        nextFilter === "all"
          ? allClothingItems.length
          : nextFilter === "hoodie"
            ? hoodieCount
            : shirtCount;
      setActiveRackIndex(Math.min(2, Math.max(0, nextCount - 1)));
    },
    [allClothingItems.length, hoodieCount, shirtCount]
  );

  const handleInspectProduct = useCallback(
    (product: Product) => {
      if (product.category === "clothing") {
        const idx = visibleClothingItems.findIndex((p) => p.id === product.id);
        if (idx >= 0) {
          setActiveRackIndex(idx);
        } else {
          setClothingFilter("all");
          const allIdx = allClothingItems.findIndex((p) => p.id === product.id);
          if (allIdx >= 0) setActiveRackIndex(allIdx);
        }
      }
      setActiveWall(product.category);
      setInspectedProductId(product.id);
    },
    [visibleClothingItems, allClothingItems]
  );

  const handleSelectSibling = useCallback(
    (sibling: Product) => {
      setInspectedProductId(sibling.id);
      if (sibling.category === "clothing") {
        const idx = visibleClothingItems.findIndex((p) => p.id === sibling.id);
        if (idx >= 0) setActiveRackIndex(idx);
      }
    },
    [visibleClothingItems]
  );

  // Global keyboard shortcuts: ArrowLeft / ArrowRight for rack & inspection stepping, Escape to close
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isBagOpen) {
          setIsBagOpen(false);
        } else if (isInfoOpen) {
          setIsInfoOpen(false);
        } else if (inspectedProductId) {
          setInspectedProductId(null);
        }
        return;
      }

      if (isBagOpen || isInfoOpen) return;

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const delta = event.key === "ArrowRight" ? 1 : -1;

        if (inspectedProduct && inspectedSiblings.length > 1) {
          event.preventDefault();
          const curIdx = inspectedSiblings.findIndex((p) => p.id === inspectedProduct.id);
          if (curIdx !== -1) {
            const next =
              inspectedSiblings[
                (curIdx + delta + inspectedSiblings.length) % inspectedSiblings.length
              ];
            handleSelectSibling(next);
          }
          return;
        }

        if (activeWall === "clothing" && visibleClothingItems.length > 0) {
          event.preventDefault();
          setActiveRackIndex((prev) =>
            Math.max(0, Math.min(visibleClothingItems.length - 1, prev + delta))
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeWall,
    visibleClothingItems.length,
    inspectedProduct,
    inspectedProductId,
    inspectedSiblings,
    isBagOpen,
    isInfoOpen,
    handleSelectSibling,
  ]);

  const handleAddToBag = useCallback(
    (
      product: Product,
      variant: ProductVariant,
      quantity: number,
      sourceEl: HTMLElement | null
    ) => {
      addToCart({
        sku: variant.sku,
        quantity,
        size: variant.size,
        price: variant.recommendPrice,
        title: product.title,
      });

      const targetEl = cartIconRef.current;
      if (sourceEl && targetEl) {
        const origin = sourceEl.getBoundingClientRect();
        const target = targetEl.getBoundingClientRect();
        const cloneId = `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        setFlyClones((prev) => [
          ...prev,
          {
            id: cloneId,
            src: product.images[0],
            alt: product.title,
            originRect: {
              left: origin.left,
              top: origin.top,
              width: origin.width,
              height: origin.height,
            },
            targetRect: {
              left: target.left,
              top: target.top,
              width: target.width,
              height: target.height,
            },
          },
        ]);
      } else {
        setBagBounceTick((t) => t + 1);
      }
    },
    [addToCart]
  );

  const handleFlyCloneComplete = useCallback((id: string) => {
    setFlyClones((prev) => prev.filter((clone) => clone.id !== id));
    setBagBounceTick((t) => t + 1);
  }, []);

  const handleResetHome = useCallback(() => {
    setInspectedProductId(null);
    setActiveWall("store");
  }, []);

  return (
    <main
      data-testid="spatial-showroom-stage"
      className="relative h-[100dvh] w-screen overflow-hidden bg-[#0E1017] text-white font-body selection:bg-[#0033AD] selection:text-white"
    >
      {/* ARCHITECTURAL ROOM SHELL: Continuous 4-Wall Horizontal Panning Track */}
      <motion.div
        animate={{ x: `-${wallIndex * 100}vw` }}
        transition={{
          duration: 0.72,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ willChange: "transform" }}
        className="relative flex h-full w-[400vw]"
      >
        {SHOWROOM_WALLS.map((wall, idx) => (
          <div
            key={wall.id}
            data-testid={`showroom-wall-${wall.id}`}
            className="relative h-full w-screen shrink-0 overflow-hidden vault-wall-surface"
          >
            {/* Architectural Concrete Grain */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 vault-concrete-grain opacity-70"
            />

            {/* Overhead Ceiling Spotlight Cone */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[72vw] h-[44vh] bg-[radial-gradient(ellipse_at_top,rgba(148,180,255,0.16)_0%,rgba(0,51,173,0.06)_45%,transparent_76%)]"
            />

            {/* Architectural Room Corner Seams (desktop/tablet wall junctions only; hidden on mobile to prevent bleed through translucent flanking garments) */}
            {idx > 0 && (
              <div
                aria-hidden="true"
                className="hidden sm:block pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/45 via-black/15 to-transparent border-l border-white/[0.06] z-[12]"
              />
            )}
            {idx < SHOWROOM_WALLS.length - 1 && (
              <div
                aria-hidden="true"
                className="hidden sm:block pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/45 via-black/15 to-transparent border-r border-white/[0.06] z-[12]"
              />
            )}

            {/* Floor / Wall Horizon Separation */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] vault-floor-surface border-t border-white/[0.09] z-10"
            >
              <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/65 to-transparent" />
            </div>

            {/* Wall-Specific Architecture */}
            <div className="relative z-20 w-full h-full">
              {wall.id === "store" && (
                <StoreWall
                  products={catalog}
                  onNavigateWall={handleSelectWall}
                  onInspectProduct={handleInspectProduct}
                  isDimmed={Boolean(inspectedProduct)}
                />
              )}

              {wall.id === "clothing" && (
                <ClothingRackWall
                  items={visibleClothingItems}
                  allClothingCount={allClothingItems.length}
                  shirtCount={shirtCount}
                  hoodieCount={hoodieCount}
                  filter={clothingFilter}
                  onChangeFilter={handleChangeClothingFilter}
                  activeIndex={Math.min(
                    activeRackIndex,
                    Math.max(0, visibleClothingItems.length - 1)
                  )}
                  onChangeIndex={setActiveRackIndex}
                  onInspectProduct={handleInspectProduct}
                  isInspecting={Boolean(inspectedProduct)}
                  isActiveWall={activeWall === "clothing"}
                />
              )}

              {wall.id === "drinkware" && (
                <FixtureGridWall
                  variant="drinkware"
                  title="Drinkware"
                  subtitle="Architectural Steel & Frosted Vessels"
                  items={drinkwareItems}
                  onInspectProduct={handleInspectProduct}
                  isInspecting={Boolean(inspectedProduct)}
                />
              )}

              {wall.id === "gear" && (
                <FixtureGridWall
                  variant="gear"
                  title="Gear"
                  subtitle="Sovereign Carry & Desk Hardware"
                  items={gearItems}
                  onInspectProduct={handleInspectProduct}
                  isInspecting={Boolean(inspectedProduct)}
                />
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* PRODUCT INSPECTION MODE OVERLAY */}
      <InspectionOverlay
        product={inspectedProduct}
        siblingProducts={inspectedSiblings}
        onClose={() => setInspectedProductId(null)}
        onSelectSibling={handleSelectSibling}
        onAddToBag={handleAddToBag}
      />

      {/* PERSISTENT MINIMAL HUD */}
      <ShowroomHUD
        activeWall={activeWall}
        onSelectWall={handleSelectWall}
        totalCartItems={totalCartItems}
        bagBounceTick={bagBounceTick}
        cartIconRef={cartIconRef}
        onOpenBag={() => {
          setIsInfoOpen(false);
          setIsBagOpen(true);
        }}
        onOpenInfo={() => {
          setIsBagOpen(false);
          setIsInfoOpen(true);
        }}
        onResetHome={handleResetHome}
      />

      {/* FLY-TO-BAG GHOST CLONE PORTAL */}
      <FlyToBagPortal
        clones={flyClones}
        onCloneComplete={handleFlyCloneComplete}
      />

      {/* SLIDE-OVER VAULT BAG DRAWER */}
      <BagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        products={catalog}
      />

      {/* VAULT INFO MODAL */}
      <VaultInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </main>
  );
}
