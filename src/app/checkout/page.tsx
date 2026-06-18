"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense } from "react";
import { ShoppingCart, ArrowLeft, Shield, Package, Trash2, Plus, Minus, Command, Globe, CreditCard } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface ShippingForm {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  phone_number: string;
}

const INITIAL_SHIPPING: ShippingForm = {
  name: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country_code: "US",
  zip_code: "",
  phone_number: "",
};

function CheckoutContent() {
  const { items, updateQuantity, removeFromCart, total } = useCart();
  const [shipping, setShipping] = useState<ShippingForm>(INITIAL_SHIPPING);
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setOrderStatus(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map(({ sku, quantity }) => ({ sku, quantity })),
          shipping,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderNumber(data.order_number);
        setOrderStatus({ ok: true, msg: "TRANSACTION SECURED" });
      } else {
        setOrderStatus({ ok: false, msg: `PROTOCOL ERROR: ${data.message || 'Unknown'}` });
      }
    } catch {
      setOrderStatus({ ok: false, msg: "CONNECTION TIMEOUT: RETRY" });
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-1";

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-10 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
      
      {/* Left: Summary Vault */}
      <div className="lg:col-span-5 space-y-10 order-2 lg:order-1">
        <div className="space-y-2">
          <h2 className="text-4xl font-black font-syne tracking-tighter uppercase">Order Vault</h2>
          <p className="text-white/40 text-sm font-light uppercase tracking-widest">Verify your selection</p>
        </div>

        <div className="vault-card rounded-[2.5rem] p-10 space-y-8">
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/20 text-center py-10 uppercase tracking-[0.3em] font-black italic">Vault Empty</motion.p>
              ) : (
                items.map((c) => (
                  <motion.div 
                    layout
                    key={c.sku} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex justify-between items-start gap-6 pb-6 border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1 space-y-2">
                      <p className="font-syne font-black text-lg uppercase tracking-tighter leading-tight">{c.title}</p>
                      <div className="flex gap-3 text-[10px] font-bold text-cardano-blue uppercase tracking-widest bg-cardano-blue/10 px-3 py-1 rounded-full w-fit">
                        <span>Size: {c.size}</span>
                        <span className="opacity-30">|</span>
                        <span>SKU: {c.sku.split('-').pop()}</span>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-2 py-1">
                          <button onClick={() => updateQuantity(c.sku, c.quantity - 1)} className="p-1 hover:text-white text-white/30 border-none bg-transparent cursor-pointer"><Minus size={12} /></button>
                          <span className="text-xs font-black font-syne w-6 text-center">{c.quantity}</span>
                          <button onClick={() => updateQuantity(c.sku, c.quantity + 1)} className="p-1 hover:text-white text-white/30 border-none bg-transparent cursor-pointer"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeFromCart(c.sku)} className="text-white/20 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1">
                          <Trash2 size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Eject</span>
                        </button>
                      </div>
                    </div>
                    <p className="font-syne font-black text-xl text-white/90">${(c.price * c.quantity).toFixed(2)}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="pt-6 space-y-4">
            <div className="flex justify-between text-white/40 text-xs uppercase tracking-[0.2em]">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white/40 text-xs uppercase tracking-[0.2em]">
              <span>Shipping</span>
              <span>Calculated at Entry</span>
            </div>
            <div className="border-t border-white/10 pt-6 flex justify-between items-baseline">
              <span className="font-syne font-black text-2xl uppercase tracking-tighter italic">Total Amount</span>
              <div className="text-right">
                <span className="block text-4xl font-syne font-black text-cardano-blue italic tracking-tighter">${total.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">USD Only</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-white/20 px-4">
           <Shield className="w-4 h-4" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Encrypted Protocol Secure</span>
        </div>
      </div>

      {/* Right: Data Entry Manifest */}
      <div className="lg:col-span-7 order-1 lg:order-2 space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-syne tracking-tighter uppercase leading-none italic">Shipping Manifest</h1>
          <p className="text-white/40 text-sm font-light uppercase tracking-widest">Initialize delivery coordinates</p>
        </div>

        {orderNumber ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="vault-card rounded-[3rem] p-16 text-center border-cardano-blue/30"
          >
            <div className="w-24 h-24 bg-cardano-blue/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-cardano-blue/40">
              <Command className="w-10 h-10 text-cardano-blue animate-pulse" />
            </div>
            <h2 className="text-4xl font-black font-syne uppercase tracking-tighter mb-4 italic">Protocol Confirmed</h2>
            <p className="text-white/50 text-lg font-light mb-10 leading-relaxed max-w-md mx-auto">
              Your order has been authenticated and entered into the production queue.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 inline-block">
              <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Manifest ID</span>
              <span className="text-xl font-syne font-black text-cardano-blue tracking-[0.2em]">{orderNumber}</span>
            </div>
            <Link href="/" className="block w-full py-5 rounded-3xl bg-white text-charcoal font-syne font-black text-xl uppercase tracking-widest hover:scale-[1.02] transition-transform duration-500">
              Return to Catalog
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Subject Name</label>
                <input required name="name" value={shipping.name} onChange={handleChange} placeholder="SATOSHI NAKAMOTO" className="merch-input" />
              </div>
              <div>
                <label className={labelClass}>Secure Email</label>
                <input required type="email" name="email" value={shipping.email} onChange={handleChange} placeholder="SATOSHI@BITCOIN.COM" className="merch-input" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Delivery Address</label>
              <div className="relative group">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-cardano-blue transition-colors" />
                <input required name="address" value={shipping.address} onChange={handleChange} placeholder="BLOCKCHAIN AVE 256, FLOOR 64" className="merch-input pl-16" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>City Hub</label>
                <input required name="city" value={shipping.city} onChange={handleChange} placeholder="CYBER VALLEY" className="merch-input" />
              </div>
              <div>
                <label className={labelClass}>State / Sector</label>
                <input name="state" value={shipping.state} onChange={handleChange} placeholder="NEO TOKYO" className="merch-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>Zip Cipher</label>
                <input required name="zip_code" value={shipping.zip_code} onChange={handleChange} placeholder="000-111" className="merch-input" />
              </div>
              <div>
                <label className={labelClass}>Region Code</label>
                <select required name="country_code" value={shipping.country_code} onChange={handleChange} className="merch-input appearance-none bg-obsidian cursor-pointer">
                  <option value="US">UNITED STATES</option>
                  <option value="ES">SPAIN</option>
                  <option value="MX">MEXICO</option>
                  <option value="AR">ARGENTINA</option>
                  <option value="CO">COLOMBIA</option>
                  <option value="CA">CANADA</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Contact Signal (Phone)</label>
              <input name="phone_number" value={shipping.phone_number} onChange={handleChange} placeholder="+00 123 456 789" className="merch-input" />
            </div>

            <div className="pt-6 space-y-6">
              <AnimatePresence>
                {orderStatus && !orderStatus.ok && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    {orderStatus.msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button 
                type="submit" 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                disabled={loading || items.length === 0} 
                className="w-full h-24 rounded-[2rem] font-syne font-black text-2xl flex items-center justify-center gap-6 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed border-none bg-cardano-blue text-white shadow-[0_20px_60px_rgba(0,51,173,0.3)] relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]" />
                <CreditCard className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span>{loading ? "AUTHENTICATING..." : `INITIALIZE PAYMENT — $${total.toFixed(2)}`}</span>
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  
  return (
    <main className="min-h-screen bg-charcoal text-white font-inter selection:bg-cardano-blue selection:text-white">
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      
      <nav className="relative z-20 flex items-center justify-between px-10 py-8 border-b border-white/5 mix-blend-difference">
        <button onClick={() => router.back()} className="flex items-center gap-4 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.3em] group border-none bg-transparent cursor-pointer">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Vault</span>
        </button>
        <div className="flex items-center gap-6 h-12">
          <img src="/logo.jpg" alt="Logo" className="h-full rounded-full object-cover border border-white/10" />
          <div className="flex flex-col text-white">
            <span className="font-syne font-black text-xl tracking-tighter leading-none uppercase">Cardano</span>
            <span className="text-[8px] font-bold tracking-[0.4em] uppercase text-white/50">Merch</span>
          </div>
        </div>
        <div className="w-[100px]" /> {/* Spacer for balance */}
      </nav>

      <Suspense fallback={<div className="text-center py-32 font-syne font-black uppercase tracking-[0.5em] opacity-20 animate-pulse">Initializing Data Stream...</div>}>
        <CheckoutContent />
      </Suspense>

      <footer className="py-10 text-center opacity-10">
         <span className="text-[9px] font-black uppercase tracking-[0.5em]">Global Decentralized Fulfillment System</span>
      </footer>
    </main>
  );
}
