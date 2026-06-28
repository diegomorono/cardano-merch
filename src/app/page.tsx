"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ShoppingCart, ArrowRight, Star, Plus, Minus, Command } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { products } from "@/lib/products";
import { useCart } from "@/context/CartContext";

export default function Home() {
  const product = products[0];
  const [selectedVariant, setSelectedVariant] = useState(product.variants[2]); // Default L
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [orderStatus, setOrderStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const { items, addToCart } = useCart();
  const router = useRouter();

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const titleY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const imageScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);

  const handleAddToCart = () => {
    addToCart({
      sku: selectedVariant.sku,
      quantity,
      size: selectedVariant.size,
      price: selectedVariant.recommendPrice,
      title: product.title
    });
    setOrderStatus({ ok: true, msg: "ENTRY LOGGED & ADDED TO CART" });
    setQuantity(1);
    setTimeout(() => setOrderStatus(null), 3000);
  };

  const totalCartItems = items.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <main ref={containerRef} className="min-h-screen bg-charcoal text-white font-body selection:bg-cardano-blue selection:text-white">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vh] bg-cardano-blue liquid-blur rounded-full opacity-10"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vh] bg-cardano-light liquid-blur rounded-full opacity-10"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 md:px-10 md:py-8 flex justify-between items-center mix-blend-difference">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/20 group-hover:border-cardano-blue transition-colors duration-500">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
          </div>
          <div className="flex flex-col text-white">
            <span className="font-heading font-black text-xl md:text-2xl tracking-tighter leading-none">Cardano</span>
            <span className="text-[8px] md:text-[9px] font-bold tracking-[0.4em] uppercase text-white/50">Merch</span>
          </div>
        </motion.div>

        <div className="flex items-center gap-8">
          <button onClick={() => router.push("/checkout")} className="relative group cursor-pointer border-none bg-transparent">
            <div className="flex items-center gap-3 md:gap-4 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2.5 md:px-6 md:py-3 rounded-full group-hover:bg-white/10 transition-all duration-500">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
              <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-white">Cart</span>
              {totalCartItems > 0 && (
                <span className="bg-cardano-blue text-white w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black">
                  {totalCartItems}
                </span>
              )}
            </div>
          </button>
        </div>
      </nav>

      {/* Hero Spotlight Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-28 lg:pt-36 pb-16 lg:pb-24">
        <motion.div style={{ y: titleY }} className="absolute z-10 text-center pointer-events-none">
          <h2 className="text-[12vw] font-black tracking-tighter leading-[0.8] text-outline opacity-10 whitespace-nowrap">
            Decentralized Wear
          </h2>
        </motion.div>

        <div className="container mx-auto px-6 md:px-10 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center relative z-20">
          <motion.div
            style={{ scale: imageScale }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative pb-20"
          >
            {/* Vault Card Container - Updated to aspect-square configuration */}
            <div className="relative w-full aspect-square rounded-[2rem] md:rounded-[2.5rem] overflow-hidden vault-card">
              <div className="absolute inset-4 md:inset-8">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0, y: 20, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -20, rotate: 3 }}
                    transition={{ duration: 0.6 }}
                    src={product.images[selectedImage]}
                    alt={product.title}
                    /* Enforced perfect rounded square geometry using aspect-square, object-cover, and matching radii rules */
                    className="w-full h-full aspect-square object-cover block rounded-[1.75rem] md:rounded-[2.25rem] drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)] md:drop-shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Image Selector Strip */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex gap-2 md:gap-3 p-2 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 max-w-[95vw] overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-xl overflow-hidden border-2 transition-all duration-500 cursor-pointer flex-shrink-0 ${selectedImage === i ? "border-cardano-blue scale-110 shadow-lg shadow-cardano-blue/20" : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="space-y-8 lg:space-y-10"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter font-heading leading-none">
                {product.title}
              </h1>
              <div className="flex items-center gap-6 text-white/40">
                <div className="flex text-cardano-blue">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-cardano-blue" />)}
                </div>
                <span className="text-xs md:text-sm uppercase tracking-widest">Verified Quality</span>
              </div>
            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-5xl md:text-6xl font-heading font-black text-white">${selectedVariant.recommendPrice}</span>
              <span className="text-base md:text-xl text-white/30 font-light tracking-tighter">USD</span>
            </div>

            {/* Sizes */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Select Specification</h4>
              <div className="grid grid-cols-4 md:flex md:flex-wrap gap-3 md:gap-4">
                {product.variants.map((v) => (
                  <button
                    key={v.sku}
                    onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                    className={`w-full md:w-auto md:min-w-[70px] h-12 md:h-14 rounded-xl md:rounded-2xl font-heading font-bold text-base md:text-lg transition-all duration-500 border-2 cursor-pointer flex items-center justify-center ${selectedVariant.sku === v.sku
                      ? "bg-cardano-blue text-white border-cardano-blue size-active-shadow"
                      : "bg-white/5 border-white/10 hover:border-cardano-blue/50 text-white/60"
                      }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Control & Checkout Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-10">
              <div className="flex items-center justify-between bg-white/5 rounded-2xl border border-white/10 p-2 w-full sm:w-auto quantity-panel-shadow">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-12 text-center font-heading font-black text-xl">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer border-none bg-transparent"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                style={{ backgroundColor: "#ffffff", color: "#050505" }}
                className="flex-1 h-14 sm:h-20 bg-white text-charcoal rounded-2xl sm:rounded-3xl font-heading font-black text-base sm:text-xl flex items-center justify-center gap-4 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] cursor-pointer group border-none"
              >
                <span>ADD TO CART</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>

            <AnimatePresence>
              {orderStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-cardano-blue/10 border border-cardano-blue/30 p-4 rounded-2xl flex items-center gap-4 justify-center"
                >
                  <Command className="w-4 h-4 text-cardano-blue animate-pulse" />
                  <span className="text-cardano-blue font-heading font-bold text-xs tracking-widest">{orderStatus.msg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="py-20 border-y border-white/5 bg-obsidian overflow-hidden">
        <div className="animate-marquee">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 px-10">
              <span className="text-4xl font-heading font-black tracking-tighter opacity-10 uppercase">Global Cardano Commerce</span>
              <div className="w-2 h-2 bg-cardano-blue rounded-full" />
              <span className="text-4xl font-heading font-black tracking-tighter opacity-10 uppercase">Secure Digital Logistics</span>
              <div className="w-2 h-2 bg-cardano-light rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Description / Tech Specs */}
      <section className="py-40 container mx-auto px-10">
        <div className="grid lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2 space-y-10">
            <h3 className="text-4xl font-black font-heading">Material Integrity</h3>
            <p className="text-2xl text-white/50 leading-relaxed font-light italic border-l-4 border-cardano-blue pl-10">
              {product.description}
            </p>
          </div>
          <div className="vault-card p-10 rounded-[2.5rem] space-y-8">
            <h4 className="font-heading font-black text-xl border-b border-white/10 pb-4">Specifications</h4>
            <div className="space-y-4">
              {["Premium Organic Cotton", "Heavyweight 220 GSM", "Eco-Friendly Print", "Ethical Production"].map((spec, i) => (
                <div key={i} className="flex items-center gap-4 text-sm text-white/40">
                  <div className="w-1.5 h-1.5 bg-cardano-blue rounded-full" />
                  {spec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="py-20 border-t border-white/5 bg-obsidian text-center">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col">
            <span className="font-heading font-black text-5xl tracking-tighter text-outline opacity-10">CARDANO MERCH</span>
            <span className="text-xs font-bold tracking-[1em] uppercase text-white/40 mt-[-10px]">EST. 2026</span>
          </div>
          <p className="text-[10px] text-white/20 tracking-[0.5em] uppercase">Built for the most badass, truly decentralized community alive.</p>
        </div>
      </footer>
    </main>
  );
}