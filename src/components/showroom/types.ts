export type ShowroomCategory = "clothing" | "drinkware" | "gear";

export type WallId = "store" | ShowroomCategory;

export type GarmentType = "shirt" | "hoodie";

export type GarmentFit = "Men" | "Women" | "Unisex";

export type ClothingFilter = "all" | GarmentType;

export const COLOR_SWATCH_MAP: Record<string, string> = {
  Black: "#17191F",
  Navy: "#162447",
  Gray: "#A7AEB8",
  White: "#ECEFF4",
};

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  fit?: GarmentFit;
  weight: number;
  dropshippingPrice: number;
  recommendPrice: number;
}

export interface Product {
  id: string;
  popcustomsId?: string;
  title: string;
  description: string;
  color: string;
  colorHex: string;
  availableColors?: string[];
  colorImages?: Record<string, string[]>;
  fitColorImages?: Record<string, Record<string, string[]>>;
  fits?: GarmentFit[];
  garmentType?: GarmentType;
  category: ShowroomCategory;
  eyebrow: string;
  era: string;
  fabricSpec: string;
  specs: string[];
  images: string[];
  variants: ProductVariant[];
}

export interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FlyCloneItem {
  id: string;
  src: string;
  alt: string;
  originRect: RectSnapshot;
  targetRect: RectSnapshot;
}

export interface WallDefinition {
  id: WallId;
  label: string;
  subtitle: string;
}

export const SHOWROOM_WALLS: readonly WallDefinition[] = [
  { id: "store", label: "Store", subtitle: "Cryptographic Vault Entrance" },
  { id: "clothing", label: "Clothing", subtitle: "Suspended Apparel Rail" },
  { id: "drinkware", label: "Drinkware", subtitle: "Thermal Vessels & Glass" },
  { id: "gear", label: "Gear", subtitle: "Sovereign Carry & Desk" },
] as const;
