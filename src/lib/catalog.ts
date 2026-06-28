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

export const productsCatalog: Product[] = [
  {
    id: "cardano-black-shirt",
    title: "Cardano Doodle + Logo Design",
    description:
      "Made from soft, breathable, and pill-resistant cotton fabric. Ribbed knit neckline design and regular fit — comfortable, fashionable and versatile. 4 colors customized and printing on the front and back. Double-needle sewing technology adds durability, making it last for many wears and washes. Excellent color retention after washes.",
    color: "Black",
    images: [
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-1-Q4py2wJnDb.jpeg",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-4-Q4py2wJnDb.jpeg",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-7-Q4py2wJnDb.jpeg",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-10-Q4py2wJnDb.jpeg",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-13-Q4py2wJnDb.jpeg",
      "https://assets.popcustoms.com/galleries/20221028104137-5fapA7emlL.jpg",
      "https://assets.popcustoms.com/galleries/20221028104145-gC3lJ0tj4p.jpg",
    ],
    variants: [
      { sku: "N79G24RY-3", size: "S",   color: "Black", weight: 160, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-4", size: "M",   color: "Black", weight: 180, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-1", size: "L",   color: "Black", weight: 200, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-2", size: "XL",  color: "Black", weight: 220, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-5", size: "2XL", color: "Black", weight: 240, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-6", size: "3XL", color: "Black", weight: 260, dropshippingPrice: 13.39, recommendPrice: 26.78 },
      { sku: "N79G24RY-7", size: "4XL", color: "Black", weight: 280, dropshippingPrice: 13.39, recommendPrice: 26.78 },
      { sku: "N79G24RY-8", size: "5XL", color: "Black", weight: 300, dropshippingPrice: 13.39, recommendPrice: 26.78 },
    ],
  },
];
