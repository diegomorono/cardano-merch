import { productsCatalog } from "./catalog";

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  weight: number;
  dropshippingPrice: number;
  recommendPrice: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
  color: string;
}

export const products = productsCatalog;
