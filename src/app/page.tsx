"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ChevronRight, Star, Shield, Zap } from "lucide-react";
import { useState } from "react";
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

  const handleAddToCart = () => {
    addToCart({ 
        sku: selectedVariant.sku, 
        quantity, 
        size: selectedVariant.size, 
        price: selectedVariant.recommendPrice,
        title: product.title 
    });
    setOrderStatus({ ok: true, msg: `Talla ${selectedVariant.size} añadida al carrito ✓` });
    setQuantity(1);
    setTimeout(() => setOrderStatus(null), 2000);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const totalCartItems = items.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <main className="min-h-screen bg-bg text-fg overflow-x-hidden font-exo">
      {/* Animated background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [-50, 50, -50] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [50, -50, 50] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/10 glass-panel">
        <div className="flex items-center gap-4">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover border border-primary/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white font-orbitron">CARDANO</span>
            <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Merch</span>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          className="relative flex items-center gap-2 bg-white/5 hover:bg-primary/20 border border-white/20 rounded-full px-5 py-2.5 text-sm transition-all duration-300 cursor-pointer group"
        >
          <ShoppingCart className="w-4 h-4 group-hover:text-primary transition-colors" />
          <span className="font-medium">Checkout</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-xs font-black flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              {totalCartItems}
            </span>
          )}
        </button>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Hero / Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
          {/* Left — Images */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden aspect-square bg-white/5 border border-white/10 glass-panel p-4"
            >
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              />
            </motion.div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`rounded-xl overflow-hidden w-16 h-16 flex-shrink-0 border-2 transition-all duration-200 cursor-pointer ${selectedImage === i ? "border-primary shadow-[0_0_10px_rgba(245,158,11,0.3)]" : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right — Product Info */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-2 text-primary text-sm font-orbitron mb-3 tracking-widest uppercase">
                Premium Cardano Gear
              </div>
              <h1 className="text-5xl font-extrabold leading-tight mb-3 font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-primary/50 tracking-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-1.5 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="text-sm text-fg/60 ml-3 font-medium">Color: <span className="text-fg">{product.color}</span></span>
              </div>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-5xl font-black text-white font-orbitron">${selectedVariant.recommendPrice}</span>
                <span className="text-lg text-fg/40 font-orbitron tracking-tighter">USD</span>
              </div>

              {/* Size Selector */}
              <div className="mb-8 p-6 rounded-2xl border border-white/5 bg-white/5 glass-panel">
                <p className="text-sm text-fg/60 mb-4 font-medium uppercase tracking-wider">
                  Select Talla: <span className="text-white font-bold ml-1">{selectedVariant.size}</span>
                  <span className="text-fg/30 text-xs ml-4 font-mono">SKU: {selectedVariant.sku}</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                      className={`w-14 h-14 rounded-xl font-orbitron font-bold text-sm transition-all duration-300 border-2 cursor-pointer ${selectedVariant.sku === v.sku
                        ? "border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "border-white/10 hover:border-white/30 text-fg/60 hover:text-fg"
                        }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-6 mb-10">
                <p className="text-sm text-fg/60 font-medium uppercase tracking-wider">Quantity:</p>
                <div className="flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 glass-panel">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-fg/40 hover:text-primary w-6 h-6 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors">−</button>
                  <span className="w-8 text-center font-orbitron font-bold text-lg">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-fg/40 hover:text-primary w-6 h-6 flex items-center justify-center text-xl font-bold cursor-pointer transition-colors">+</button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full py-5 rounded-2xl font-orbitron font-bold text-xl flex items-center justify-center gap-4 transition-all duration-300 cursor-pointer shadow-[0_15px_35px_rgba(245,158,11,0.2)] group relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]" />
                <ShoppingCart className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-white">ADD TO CART — ${(selectedVariant.recommendPrice * quantity).toFixed(2)}</span>
              </motion.button>

              {/* Status Message */}
              <AnimatePresence>
                {orderStatus && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 text-sm font-orbitron font-bold text-center p-3 rounded-xl glass-panel ${orderStatus.ok ? "text-primary border-primary/20" : "text-red-400 border-red-400/20"}`}
                  >
                    {orderStatus.msg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Description */}
              <div className="mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4 text-primary/80 font-orbitron text-xs tracking-widest uppercase">
                  Product Details
                </div>
                <p className="text-fg/60 text-base leading-relaxed font-exo italic border-l-2 border-primary/20 pl-6">
                  {product.description}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            { icon: Shield, title: "Secure Checkout", desc: "Enterprise-grade encryption for all transactions" },
            { icon: Zap, title: "Fast Delivery", desc: "Global shipping powered by our logistics network" },
            { icon: Star, title: "Premium Quality", desc: "Sourced from the best materials for Cardano fans" }
          ].map((feat, i) => (
            <div key={i} className="glass-card p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                <feat.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-orbitron font-bold text-lg mb-3 text-white">{feat.title}</h3>
              <p className="text-fg/40 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-12 border-t border-white/10">
          <p className="text-xs text-fg/30 font-orbitron tracking-widest uppercase mb-4">
            Powered by <span className="text-primary font-black">Cardano Merch</span>
          </p>
          <div className="flex justify-center gap-6">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer opacity-50">
              <div className="w-3 h-3 bg-white/40 rounded-sm" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer opacity-50">
              <div className="w-3 h-3 bg-white/40 rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
