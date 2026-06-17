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
    setTimeout(() => setOrderStatus(null), 2000);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const totalCartItems = items.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <main className="min-h-screen bg-[#0A0B10] text-white overflow-x-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [-50, 50, -50] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,51,173,0.25) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [50, -50, 50] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)" }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <img src="/logo-name.png" alt="Cardano Merch" className="h-6" />
        </div>
        <button
          onClick={handleCheckout}
          className="relative flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm transition-all duration-200"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Checkout</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#00E5FF] text-[#0A0B10] text-xs font-black flex items-center justify-center">
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
              className="rounded-2xl overflow-hidden aspect-square bg-[#151620] border border-white/5"
            >
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`rounded-lg overflow-hidden w-16 h-16 flex-shrink-0 border-2 transition-all duration-200 ${selectedImage === i ? "border-[#00E5FF]" : "border-transparent opacity-50 hover:opacity-80"
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
              <div className="flex items-center gap-2 text-[#00E5FF] text-sm font-mono mb-3">
              </div>
              <h1 className="text-4xl font-extrabold leading-tight mb-2">{product.title}</h1>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#00E5FF] text-[#00E5FF]" />
                ))}
                <span className="text-sm text-gray-400 ml-2">Color: {product.color}</span>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-white">${selectedVariant.recommendPrice}</span>
                <span className="text-sm text-gray-500">USD (precio sugerido)</span>
              </div>

              {/* Size Selector */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3 font-medium">
                  Talla: <span className="text-white font-bold">{selectedVariant.size}</span>
                  <span className="text-gray-500 text-xs ml-2">SKU: {selectedVariant.sku}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-12 h-12 rounded-xl font-bold text-sm transition-all duration-200 border-2 ${selectedVariant.sku === v.sku
                        ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]"
                        : "border-white/10 hover:border-white/30 text-gray-300"
                        }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-8">
                <p className="text-sm text-gray-400">Cantidad:</p>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center text-lg font-bold">−</button>
                  <span className="w-6 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center text-lg font-bold">+</button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300"
                style={{ background: "linear-gradient(135deg, #0033AD, #0055FF)", boxShadow: "0 0 30px rgba(0,51,173,0.4)" }}
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Añadir al Carrito — ${(selectedVariant.recommendPrice * quantity).toFixed(2)}</span>
              </motion.button>

              {/* Cart Items display */}
              {items.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-2">Carrito</p>
                  {items.map((c) => (
                    <div key={c.sku} className="flex justify-between text-sm">
                      <span className="text-gray-300">Talla {c.size} × {c.quantity}</span>
                      <span className="text-gray-400 font-mono text-xs">{c.sku}</span>
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    onClick={handleCheckout}
                    className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all duration-200"
                  >
                    Ir al Checkout →
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}

              {/* Status Message */}
              <AnimatePresence>
                {orderStatus && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-3 text-sm font-mono text-center ${orderStatus.ok ? "text-green-400" : "text-red-400"}`}
                  >
                    {orderStatus.msg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Description */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-gray-400 text-sm leading-relaxed">{product.description}</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t border-white/5 pt-8">
          <p>Powered by <span className="text-[#0033AD]">Cardano Merch</span></p>
        </div>
      </div>
    </main>
  );
}
