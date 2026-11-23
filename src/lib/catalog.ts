import { Product, ProductVariant, ShowroomCategory } from "@/components/showroom/types";

export type { Product, ProductVariant, ShowroomCategory };

function buildApparelVariants(
  prefix: string,
  color: string,
  baseDrop: number,
  baseRetail: number,
  baseWeight: number
): ProductVariant[] {
  const sizes: Array<{ size: string; deltaDrop: number; deltaRetail: number; weightStep: number }> = [
    { size: "XS", deltaDrop: 0, deltaRetail: 0, weightStep: -20 },
    { size: "S", deltaDrop: 0, deltaRetail: 0, weightStep: 0 },
    { size: "M", deltaDrop: 0, deltaRetail: 0, weightStep: 20 },
    { size: "L", deltaDrop: 0, deltaRetail: 0, weightStep: 40 },
    { size: "XL", deltaDrop: 0, deltaRetail: 0, weightStep: 60 },
    { size: "2XL", deltaDrop: 2, deltaRetail: 4, weightStep: 80 },
  ];

  return sizes.map((entry, idx) => ({
    sku: `${prefix}-${idx + 1}`,
    size: entry.size,
    color,
    weight: baseWeight + entry.weightStep,
    dropshippingPrice: Number((baseDrop + entry.deltaDrop).toFixed(2)),
    recommendPrice: Number((baseRetail + entry.deltaRetail).toFixed(2)),
  }));
}

export const productsCatalog: Product[] = [
  // =========================================================================
  // CLOTHING WALL (7 Hanger-Aligned Garments)
  // =========================================================================
  {
    id: "cardano-black-shirt",
    title: "Cardano Doodle + Logo Design",
    description:
      "Made from soft, breathable, and pill-resistant cotton fabric. Ribbed knit neckline design and regular fit — comfortable, fashionable and versatile. 4 colors customized and printing on the front and back. Double-needle sewing technology adds durability, making it last for many wears and washes. Excellent color retention after washes.",
    color: "Obsidian Black",
    colorHex: "#181B22",
    category: "clothing",
    eyebrow: "Unisex Heavyweight Tee",
    era: "Genesis Flagship",
    fabricSpec: "100% American Cotton · 220 GSM",
    specs: [
      "Premium Organic Cotton",
      "Heavyweight 220 GSM",
      "Double-Needle Construction",
      "300 DPI Archival DTG Print",
    ],
    images: [
      "/showroom/products/tee-cardano-doodle.png",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-1-Q4py2wJnDb.jpeg",
      "https://samples.popcustoms.com/23551/GLD_C5-M/20240703/1720007326-4-Q4py2wJnDb.jpeg",
    ],
    variants: [
      { sku: "N79G24RY-3", size: "S", color: "Black", weight: 160, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-4", size: "M", color: "Black", weight: 180, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-1", size: "L", color: "Black", weight: 200, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-2", size: "XL", color: "Black", weight: 220, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-5", size: "2XL", color: "Black", weight: 240, dropshippingPrice: 12.39, recommendPrice: 24.78 },
      { sku: "N79G24RY-6", size: "3XL", color: "Black", weight: 260, dropshippingPrice: 13.39, recommendPrice: 26.78 },
    ],
  },
  {
    id: "midnight-privacy-hoodie",
    title: "Midnight Privacy Crescent",
    description:
      "Engineered for zero-knowledge sovereignty. Heavyweight brushed fleece pullover featuring the Midnight Privacy Crescent emblem printed with binary-opacity archival inks for zero-halo longevity.",
    color: "Void Obsidian",
    colorHex: "#161922",
    category: "clothing",
    eyebrow: "Heavyweight Pullover Hoodie",
    era: "Basho · Midnight Partner Chain",
    fabricSpec: "Heavy Poly-Cotton Fleece · 350 GSM",
    specs: [
      "350 GSM Structured Fleece",
      "Double-Lined Hood & Metal Aglets",
      "CMYK-Proofed Archival Ink",
      "Reinforced Kangaroo Pocket",
    ],
    images: ["/showroom/products/hoodie-midnight-privacy.png"],
    variants: buildApparelVariants("CM-MDP-HD", "Void Obsidian", 28.5, 58.0, 480),
  },
  {
    id: "haskell-lambda-tee",
    title: "Sovereign Compiler Haskell λ",
    description:
      "Fragile smart contracts on other chains drain user funds daily, while side-effect-free functional programming compiles mathematical validation logic. Printed on architectural Concrete Mist 100% cotton.",
    color: "Concrete Mist",
    colorHex: "#C4CAD6",
    category: "clothing",
    eyebrow: "Functional Core Tee",
    era: "Goguen · Plutus Era",
    fabricSpec: "100% Ring-Spun Cotton · 230 GSM",
    specs: [
      "230 GSM Boxy Architectural Cut",
      "Hard-Edge Vector Geometry Print",
      "Pre-Shrunk Ribbed Collar",
      "Side-Effect Free Status Signal",
    ],
    images: ["/showroom/products/tee-haskell-lambda.png"],
    variants: buildApparelVariants("CM-HSK-TE", "Concrete Mist", 14.5, 32.0, 210),
  },
  {
    id: "ouroboros-pos-hoodie",
    title: "Ouroboros Infinity Consensus",
    description:
      "Peer-reviewed mathematical consensus rendered as a wearable monument. Deep Cardano Midnight Navy pullover hoodie showcasing the recursive Ouroboros proof-of-stake seal.",
    color: "Midnight Navy",
    colorHex: "#152448",
    category: "clothing",
    eyebrow: "Consensus Pullover Hoodie",
    era: "Shelley · Ouroboros Praos",
    fabricSpec: "Heavy Brushed Fleece · 340 GSM",
    specs: [
      "Cardano Midnight Navy Dye",
      "340 GSM Structured Drape",
      "Ribbed Waistband & Wrist Cuffs",
      "Zero-Slashing Consensus Lore",
    ],
    images: ["/showroom/products/hoodie-ouroboros-pos.png"],
    variants: buildApparelVariants("CM-OUR-HD", "Midnight Navy", 29.0, 62.0, 490),
  },
  {
    id: "ghost-matrix-tee",
    title: "Ghost in the Matrix — 100% Uptime",
    description:
      "Weaponizing out-group slurs into a badge of operational supremacy. Retro-futuristic stipple halftone print celebrating 100% uninterrupted mainnet uptime since Genesis on mineral-washed graphite cotton.",
    color: "Washed Graphite",
    colorHex: "#2A2F3A",
    category: "clothing",
    eyebrow: "Mineral-Washed Graphic Tee",
    era: "Defiance Archive",
    fabricSpec: "Vintage Washed Cotton · 230 GSM",
    specs: [
      "230 GSM Mineral-Washed Cotton",
      "Dithered Halftone Stipple Print",
      "Oversized Sovereign Drop Shoulder",
      "100% Uptime Since Genesis",
    ],
    images: ["/showroom/products/tee-ghost-matrix.png"],
    variants: buildApparelVariants("CM-GHM-TE", "Washed Graphite", 15.0, 32.0, 220),
  },
  {
    id: "elected-drep-tee",
    title: "Elected DRep — CIP-1694 Seal",
    description:
      "Built for active constitutional governance participants and on-chain Delegate Representatives. Features the Voltaire civic seal on heavyweight Slate Cobalt cotton.",
    color: "Slate Cobalt",
    colorHex: "#1A284A",
    category: "clothing",
    eyebrow: "Governance Issue Tee",
    era: "Voltaire · CIP-1694",
    fabricSpec: "100% American Cotton · 220 GSM",
    specs: [
      "220 GSM Heavyweight Cotton",
      "Constitutional Seal Front Print",
      "Breathable Structured Fit",
      "On-Chain Treasury Civic Signal",
    ],
    images: ["/showroom/products/tee-elected-drep.png"],
    variants: buildApparelVariants("CM-DRP-TE", "Slate Cobalt", 15.5, 34.0, 210),
  },
  {
    id: "mithril-shield-hoodie",
    title: "Mithril Light Client Shield",
    description:
      "Multi-signature stake-based proof aggregation crystallized into heavyweight matte charcoal fleece. Precision-placed chest emblem calibrated to optical center gravity.",
    color: "Stealth Charcoal",
    colorHex: "#20252F",
    category: "clothing",
    eyebrow: "Protocol Armor Hoodie",
    era: "Basho · Mithril Protocol",
    fabricSpec: "Heavyweight Fleece · 340 GSM",
    specs: [
      "340 GSM Matte Charcoal Fleece",
      "Optical-Centroid Chest Placement",
      "Double-Stitch Reinforced Seams",
      "Cold-Wash Colorfast Ink",
    ],
    images: ["/showroom/products/hoodie-mithril-shield.png"],
    variants: buildApparelVariants("CM-MTH-HD", "Stealth Charcoal", 28.5, 60.0, 485),
  },

  // =========================================================================
  // DRINKWARE WALL (4 Architectural Vessels)
  // =========================================================================
  {
    id: "compiler-fuel-tumbler",
    title: "Compiler Fuel 500ml Tumbler",
    description:
      "Double-wall vacuum-insulated 500ml stainless steel cola-can tumbler wrapped in dithered retro-futuristic Plutus compiler telemetry. Keeps espresso hot through multi-epoch compilation cycles.",
    color: "Matte Obsidian Steel",
    colorHex: "#1A1E26",
    category: "drinkware",
    eyebrow: "500ml Insulated Steel Vessel",
    era: "Goguen · Haskell Plutus",
    fabricSpec: "304 Stainless Steel · 360° Sublimation",
    specs: [
      "500ml Double-Wall Vacuum Seal",
      "360° Cylindrical Sublimation Wrap",
      "Brushed Titanium Rim & Leak Cap",
      "Dishwasher Safe Finish",
    ],
    images: ["/showroom/products/drinkware-compiler-fuel-tumbler.png"],
    variants: [
      { sku: "CM-JJ86-500", size: "500ML", color: "Matte Obsidian", weight: 320, dropshippingPrice: 13.5, recommendPrice: 28.0 },
    ],
  },
  {
    id: "ouroboros-epoch-mug",
    title: "Ouroboros Epoch 12oz Mug",
    description:
      "12oz insulated stainless steel studio coffee mug featuring the five-era Ouroboros clockwork wheel from Byron through Voltaire. Precision handle-clear sublimation layout.",
    color: "Matte Slate Steel",
    colorHex: "#1E222C",
    category: "drinkware",
    eyebrow: "12oz Thermal Desk Mug",
    era: "Byron → Voltaire",
    fabricSpec: "Stainless Steel · Thermal Lid",
    specs: [
      "12oz Insulated Thermal Core",
      "Ergonomic Matte Side Handle",
      "Clear Press-Fit Travel Lid",
      "High-Contrast Clockwork Print",
    ],
    images: ["/showroom/products/drinkware-ouroboros-mug.png"],
    variants: [
      { sku: "CM-JJ98-12OZ", size: "12OZ", color: "Matte Slate", weight: 290, dropshippingPrice: 11.5, recommendPrice: 24.0 },
    ],
  },
  {
    id: "midnight-zk-glass",
    title: "Zero-Knowledge 16oz Frosted Glass",
    description:
      "16oz frosted borosilicate can tumbler topped with a sealed natural bamboo lid and steel straw. Printed with high-contrast Midnight zero-knowledge cipher geometry engineered for translucency.",
    color: "Smoked Frost + Bamboo",
    colorHex: "#8C9AB0",
    category: "drinkware",
    eyebrow: "16oz Frosted Glass Tumbler",
    era: "Midnight Sidechain",
    fabricSpec: "Frosted Glass · Natural Bamboo",
    specs: [
      "16oz Frosted Glass Cylinder",
      "Natural Bamboo Silicone-Seal Lid",
      "Reusable Stainless Steel Straw",
      "High-Contrast Dark Cipher Ink",
    ],
    images: ["/showroom/products/drinkware-midnight-zk-glass.png"],
    variants: [
      { sku: "CM-JJ27-16OZ", size: "16OZ", color: "Smoked Frost", weight: 340, dropshippingPrice: 10.5, recommendPrice: 22.0 },
    ],
  },
  {
    id: "mithril-bamboo-vessel",
    title: "Mithril Light Client 16oz Vessel",
    description:
      "Minimalist frosted glass desk vessel bearing the concentric Mithril multi-signature aggregation seal. Designed with crisp dark linework that stays razor-sharp against any cold brew or tonic.",
    color: "Crystal Frost + Bamboo",
    colorHex: "#A8B4C6",
    category: "drinkware",
    eyebrow: "16oz Studio Glass Vessel",
    era: "Mithril Multi-Sig",
    fabricSpec: "Frosted Glass · Bamboo Cap",
    specs: [
      "16oz Heavy-Base Glass Body",
      "Bamboo Lid & Steel Straw Included",
      "Intricate Stencil Line-Art",
      "Zero-Fade Kiln Sublimation",
    ],
    images: ["/showroom/products/drinkware-mithril-vessel.png"],
    variants: [
      { sku: "CM-JJ26-16OZ", size: "16OZ", color: "Crystal Frost", weight: 335, dropshippingPrice: 10.5, recommendPrice: 22.0 },
    ],
  },

  // =========================================================================
  // GEAR WALL (5 Sovereign Carry & Desk Artifacts)
  // =========================================================================
  {
    id: "eutxo-tote-bag",
    title: "eUTXO Parallel Engine Tote",
    description:
      "Heavy-duty 100% cotton canvas carryall stamped with the high-contrast eUTXO Parallel Transaction Engine schematic. Built for hardware wallets, laptops, and conference carry.",
    color: "Obsidian Canvas",
    colorHex: "#1C2028",
    category: "gear",
    eyebrow: "100% Cotton Utility Tote",
    era: "Basho · Concurrency",
    fabricSpec: "Heavyweight 100% Cotton Canvas",
    specs: [
      "Reinforced Twin Webbing Handles",
      "High-Contrast Comic Ink DTG",
      "Fits 16-Inch Laptop + Hardware",
      "1-Inch Safe-Seam Print Margin",
    ],
    images: ["/showroom/products/gear-eutxo-tote.png"],
    variants: [
      { sku: "CM-BD1-OS", size: "ONE SIZE", color: "Obsidian Canvas", weight: 240, dropshippingPrice: 11.8, recommendPrice: 26.0 },
    ],
  },
  {
    id: "daedalus-iphone-case",
    title: "Daedalus Synced iPhone 15 Pro Case",
    description:
      "Impact-resistant matte polycarbonate shell featuring the vintage Daedalus full-node 99.9% sync terminal graphic, precision-aligned below the triple-lens camera array.",
    color: "Matte Titanium Black",
    colorHex: "#14171E",
    category: "gear",
    eyebrow: "Protective Polycarbonate Shell",
    era: "Byron · Daedalus Node",
    fabricSpec: "Matte PC Shell · UV Flatbed Print",
    specs: [
      "Raised Camera Bezel Protection",
      "Anti-Fingerprint Matte Coat",
      "Scratch-Resistant UV Flatbed Ink",
      "Precision Tactile Side Buttons",
    ],
    images: ["/showroom/products/gear-daedalus-case.png"],
    variants: [
      { sku: "CM-ZC15P-15P", size: "iPhone 15 Pro", color: "Matte Black", weight: 65, dropshippingPrice: 12.2, recommendPrice: 29.0 },
      { sku: "CM-ZC15P-15PM", size: "15 Pro Max", color: "Matte Black", weight: 72, dropshippingPrice: 12.2, recommendPrice: 29.0 },
    ],
  },
  {
    id: "plutus-leather-journal",
    title: "Plutus Playground A5 Journal",
    description:
      "Hardcover PU leather A5 field notebook engineered for drafting formal Plutus validators, governance rationales, and cold-storage architecture diagrams.",
    color: "Espresso Obsidian",
    colorHex: "#2C221E",
    category: "gear",
    eyebrow: "Laser-Engraved A5 Notebook",
    era: "Goguen · Ada Lovelace",
    fabricSpec: "PU Leather Cover · 192 Ruled Pages",
    specs: [
      "Precision Laser-Engraved Cover",
      "Heavy Elastic Closure Band",
      "Lay-Flat Stitched Spine Binding",
      "A5 Architect Format",
    ],
    images: ["/showroom/products/gear-plutus-journal.png"],
    variants: [
      { sku: "CM-JJ20Z-A5", size: "A5", color: "Espresso Obsidian", weight: 310, dropshippingPrice: 15.5, recommendPrice: 34.0 },
    ],
  },
  {
    id: "sovereign-key-flask",
    title: "The Sovereign Key 6oz Flask",
    description:
      "6oz stainless steel pocket reserve wrapped in dark charcoal PU leather with knurled steel screw cap. Engraved with the Private Key Reserve heraldic seal.",
    color: "Charcoal Leather + Steel",
    colorHex: "#2A2628",
    category: "gear",
    eyebrow: "6oz Leather-Wrapped Hip Flask",
    era: "Byron · Sovereign Custody",
    fabricSpec: "304 Stainless Steel · PU Leather",
    specs: [
      "6oz Food-Grade Stainless Core",
      "Laser-Ablated Charcoal Wrap",
      "Captive Knurled Screw Cap",
      "Arrives in Presentation Box",
    ],
    images: ["/showroom/products/gear-sovereign-flask.png"],
    variants: [
      { sku: "CM-JJ58-6OZ", size: "6OZ", color: "Charcoal Leather", weight: 210, dropshippingPrice: 16.0, recommendPrice: 36.0 },
    ],
  },
  {
    id: "hydra-desk-mat",
    title: "Hydra Head L2 LED Desk Mat",
    description:
      "Full-width low-friction rubber workstation mat bordered by Cardano Blue edge piping. Displays the isomorphic Hydra Head state-channel execution schematic in crisp high-contrast print.",
    color: "Carbon + Cardano Blue",
    colorHex: "#12151C",
    category: "gear",
    eyebrow: "Wide LED Workstation Mat",
    era: "Basho · Hydra L2",
    fabricSpec: "Micro-Weave Rubber · 800×300mm",
    specs: [
      "800×300mm Full Keyboard Surface",
      "Cardano Blue LED Fiber Edge",
      "Anti-Slip Vulcanized Rubber Base",
      "Full-Bleed 5700px Master Print",
    ],
    images: ["/showroom/products/gear-hydra-deskmat.png"],
    variants: [
      { sku: "CM-JJ11-XL", size: "800×300MM", color: "Carbon Blue", weight: 580, dropshippingPrice: 19.5, recommendPrice: 42.0 },
    ],
  },
];
