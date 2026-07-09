"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Trash2, Plus, Minus, Command, CreditCard, Lock, X, Check, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import countriesData from "@/lib/countries-data.json";

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

// Premium Custom Country Selector Component with search filter
interface CountrySelectProps {
  value: string;
  onChange: (code: string) => void;
}

function CountrySelect({ value, onChange }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countriesData.find((c) => c.code === value) || { code: value, name: value };

  const filteredCountries = countriesData.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="merch-input flex justify-between items-center w-full bg-obsidian cursor-pointer text-left py-4 px-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all font-heading font-black text-sm uppercase tracking-wider text-white"
      >
        <span>{selectedCountry.name}</span>
        <ChevronDown size={16} className={`text-white/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-30 mt-3 w-full bg-obsidian border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[350px] flex flex-col backdrop-blur-md"
          >
            {/* Search Input */}
            <div className="relative border-b border-white/5 p-4">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH REGION..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-black font-heading tracking-widest text-white placeholder-white/20 focus:outline-none focus:border-cardano-blue transition-colors uppercase"
              />
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 py-2">
              {filteredCountries.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                  No Matching Regions
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === value;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelect(c.code)}
                      className={`w-full text-left py-3.5 px-6 font-heading font-black text-xs uppercase tracking-widest transition-colors flex justify-between items-center ${
                        isSelected
                          ? "bg-cardano-blue text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{c.name}</span>
                      {isSelected && <Check size={12} className="text-white" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckoutContent() {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const [shipping, setShipping] = useState<ShippingForm>(INITIAL_SHIPPING);
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  
  // Shipping State Variables
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<"Standard" | "Express">("Standard");
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [loadingShipping, setLoadingShipping] = useState<boolean>(false);

  // E2E Test State
  const [showStripeOverlay, setShowStripeOverlay] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Success States
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Fetch shipping options whenever country code or cart items change
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (items.length === 0) {
        setShippingOptions([]);
        setShippingCost(0);
        return;
      }
      setLoadingShipping(true);
      try {
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: items.map(({ sku, quantity }) => ({ sku, quantity })),
            country_code: shipping.country_code,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const options = data.options || [];
          setShippingOptions(options);

          // Preserve user intent if the selected method is still available in the new options list.
          // Otherwise, fallback to Standard if available, or Express.
          const hasPrev = options.some((o: any) => o.id === selectedMethod);
          const nextMethod = hasPrev ? selectedMethod : (options.some((o: any) => o.id === "Standard") ? "Standard" : "Express");

          setSelectedMethod(nextMethod);
          const matched = options.find((o: any) => o.id === nextMethod);
          setShippingCost(matched ? matched.cost : 0);
        }
      } catch (err) {
        console.error("Failed to fetch shipping options", err);
      } finally {
        setLoadingShipping(false);
      }
    };

    fetchShippingOptions();
  }, [shipping.country_code, items]);

  const handleMethodChange = (method: "Standard" | "Express") => {
    setSelectedMethod(method);
    const matched = shippingOptions.find((o: any) => o.id === method);
    setShippingCost(matched ? matched.cost : 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // STEP 1: Triggered when user submits the shipping manifest.
  // Fetches a payment intent client secret from /api/checkout.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setOrderStatus(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map(({ sku, quantity }) => ({ sku, quantity })),
          shipping,
          shippingMethod: selectedMethod,
        }),
      });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        // Show payment modal overlay
        setShowStripeOverlay(true);
      } else {
        setOrderStatus({ ok: false, msg: `GATEWAY ERROR: ${data.message || 'Unknown'}` });
      }
    } catch {
      setOrderStatus({ ok: false, msg: "CONNECTION TIMEOUT: RETRY" });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Triggered inside the Stripe Payment Overlay modal.
  // Verifies the card input (simulated Stripe client verification) and places the order via /api/orders.
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentLoading(true);

    // Simulate Stripe client-side validation
    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (cleanCard.length < 16) {
      setPaymentError("Invalid card number structure.");
      setPaymentLoading(false);
      return;
    }
    if (cardExpiry.length < 4) {
      setPaymentError("Invalid card expiration date.");
      setPaymentLoading(false);
      return;
    }
    if (cardCvc.length < 3) {
      setPaymentError("Invalid CVC safety code.");
      setPaymentLoading(false);
      return;
    }

    try {
      // Post transaction details to backend order API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: items.map(({ sku, quantity }) => ({ sku, quantity })),
          shipping,
          shippingMethod: selectedMethod,
          clientSecret,
        }),
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        // Clear order cart from localStorage via React context
        clearCart();
        
        // Save confirmation parameters
        setOrderNumber(data.order_number);
        setTrackingNumber(data.tracking_number || null);
        
        // Close Stripe overlay modal
        setShowStripeOverlay(false);
      } else {
        setPaymentError(data.message || "Failed to process fulfillment.");
      }
    } catch {
      setPaymentError("Transaction timeout connection error.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 ml-1";

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
      
      {/* Left: Summary Vault */}
      <div className="lg:col-span-5 space-y-10 order-1 lg:order-1">
        <div className="space-y-2">
          <h2 className="text-4xl font-black font-heading tracking-tighter uppercase">Order Vault</h2>
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
                      <p className="font-heading font-black text-lg uppercase tracking-tighter leading-tight">{c.title}</p>
                      <div className="flex gap-3 text-[10px] font-bold text-cardano-blue uppercase tracking-widest bg-cardano-blue/10 px-3 py-1 rounded-full w-fit">
                        <span>Size: {c.size}</span>
                        <span className="opacity-30">|</span>
                        <span>SKU: {c.sku.split('-').pop()}</span>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-2 py-1">
                          <button onClick={() => updateQuantity(c.sku, c.quantity - 1)} className="p-1 hover:text-white text-white/30 border-none bg-transparent cursor-pointer"><Minus size={12} /></button>
                          <span className="text-xs font-black font-heading w-6 text-center">{c.quantity}</span>
                          <button onClick={() => updateQuantity(c.sku, c.quantity + 1)} className="p-1 hover:text-white text-white/30 border-none bg-transparent cursor-pointer"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeFromCart(c.sku)} className="text-white/20 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1">
                          <Trash2 size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Eject</span>
                        </button>
                      </div>
                    </div>
                    <p className="font-heading font-black text-xl text-white/90">${(c.price * c.quantity).toFixed(2)}</p>
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
              <span>Shipping ({selectedMethod})</span>
              <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="border-t border-white/10 pt-6 flex justify-between items-baseline">
              <span className="font-heading font-black text-2xl uppercase tracking-tighter italic">Total Amount</span>
              <div className="text-right">
                <span className="block text-4xl font-heading font-black text-cardano-blue italic tracking-tighter">${(total + shippingCost).toFixed(2)}</span>
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
      <div className="lg:col-span-7 order-2 lg:order-2 space-y-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black font-heading tracking-tighter uppercase leading-none italic">Shipping Manifest</h1>
          <p className="text-white/40 text-sm font-light uppercase tracking-widest">Initialize delivery coordinates</p>
        </div>

        {orderNumber ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="vault-card rounded-[3rem] p-16 text-center border-cardano-blue/30 space-y-10"
          >
            <div className="w-24 h-24 bg-cardano-blue/20 rounded-full flex items-center justify-center mx-auto border border-cardano-blue/40">
              <Command className="w-10 h-10 text-cardano-blue animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black font-heading uppercase tracking-tighter italic">Protocol Confirmed</h2>
              <p className="text-white/50 text-base font-light leading-relaxed max-w-md mx-auto">
                Your payment was authenticated and the order has been submitted into the production pipeline.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Manifest ID</span>
                <span className="text-lg font-heading font-black text-cardano-blue tracking-[0.2em]">{orderNumber}</span>
              </div>
              {trackingNumber && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                  <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Tracking Code</span>
                  <span className="text-lg font-heading font-black text-cardano-blue tracking-[0.2em]">{trackingNumber}</span>
                </div>
              )}
            </div>
            <Link href="/" className="block w-full py-5 rounded-3xl bg-white text-charcoal font-heading font-black text-xl uppercase tracking-widest hover:scale-[1.02] transition-transform duration-500">
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
                <input required name="address" value={shipping.address} onChange={handleChange} placeholder="BLOCKCHAIN AVE 256, FLOOR 64" className="merch-input" />
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
                <CountrySelect
                  value={shipping.country_code}
                  onChange={(code) => setShipping((prev) => ({ ...prev, country_code: code }))}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Contact Signal (Phone)</label>
              <input name="phone_number" value={shipping.phone_number} onChange={handleChange} placeholder="+00 123 456 789" className="merch-input" />
            </div>

            {/* Dynamic Shipping Selection Strategy Section */}
            <div className="space-y-4">
              <label className={labelClass}>Delivery Strategy</label>
              {loadingShipping ? (
                <div className="text-white/30 text-xs font-heading font-black uppercase tracking-widest py-6 border border-white/5 bg-white/5 rounded-2xl text-center animate-pulse">
                  Recalculating Transit Options...
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="text-white/20 text-xs font-heading font-black uppercase tracking-widest py-6 border border-white/5 bg-white/5 rounded-2xl text-center">
                  Awaiting Coordinates
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shippingOptions.map((option) => {
                    const isSelected = selectedMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleMethodChange(option.id)}
                        className={`flex flex-col justify-between p-6 rounded-2xl border text-left cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? "border-cardano-blue bg-cardano-blue/10 shadow-[0_0_30px_rgba(0,51,173,0.15)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full mb-3">
                          <span className="font-heading font-black uppercase tracking-tighter text-sm">
                            {option.name}
                          </span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-cardano-blue flex items-center justify-center border border-cardano-blue">
                              <Check size={12} className="text-white" />
                            </span>
                          ) : (
                            <span className="w-5 h-5 rounded-full border border-white/20" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-cardano-blue">
                            {option.cost === 0 ? "FREE" : `$${option.cost.toFixed(2)}`}
                          </span>
                          <span className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">
                            {option.estimated}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
                disabled={loading || items.length === 0 || loadingShipping} 
                className="w-full h-24 rounded-[2rem] font-heading font-black text-2xl flex items-center justify-center gap-6 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed border-none bg-cardano-blue text-white shadow-[0_20px_60px_rgba(0,51,173,0.3)] relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-[-20deg]" />
                <CreditCard className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span>{loading ? "INITIALIZING ROUTE..." : `INITIALIZE PAYMENT — $${(total + shippingCost).toFixed(2)}`}</span>
              </motion.button>
            </div>
          </form>
        )}
      </div>

      {/* STRIPE TEST MODE PAYMENT OVERLAY MODAL */}
      <AnimatePresence>
        {showStripeOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-charcoal/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="vault-card rounded-[2.5rem] p-10 max-w-md w-full border border-white/10 relative space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
              <button 
                onClick={() => setShowStripeOverlay(false)} 
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cardano-blue/20 flex items-center justify-center border border-cardano-blue/30 text-cardano-blue">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-black uppercase tracking-tighter italic">Stripe Secure Gateway</h3>
                  <span className="text-[9px] font-bold text-cardano-blue uppercase tracking-widest bg-cardano-blue/10 px-2 py-0.5 rounded">TEST MODE ACTIVE</span>
                </div>
              </div>

              {/* Mock Credit Card graphic */}
              <div className="w-full aspect-[1.586/1] bg-gradient-to-br from-cardano-blue to-obsidian border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-inner relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Secured Node</span>
                    <span className="font-heading font-black text-sm uppercase tracking-wider">Cardano Ledger</span>
                  </div>
                  <Command className="w-8 h-8 text-white/50" />
                </div>
                <div className="space-y-4">
                  <span className="block font-heading font-bold text-lg sm:text-xl tracking-[0.2em] text-white/95">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </span>
                  <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest">
                    <div>
                      <span className="block text-[7px] text-white/20 mb-0.5">Cardholder</span>
                      <span>{cardName || "SATOSHI NAKAMOTO"}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="block text-[7px] text-white/20 mb-0.5">Expires</span>
                        <span>{cardExpiry || "MM/YY"}</span>
                      </div>
                      <div>
                        <span className="block text-[7px] text-white/20 mb-0.5">CVC</span>
                        <span>{cardCvc || "•••"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Cardholder Name</label>
                    <input 
                      required 
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value.toUpperCase())} 
                      placeholder="SATOSHI NAKAMOTO" 
                      className="merch-input py-4 rounded-xl text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Card Number</label>
                    <input 
                      required 
                      maxLength={19} 
                      value={cardNumber} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                        setCardNumber(formatted);
                      }} 
                      placeholder="4242 4242 4242 4242" 
                      className="merch-input py-4 rounded-xl text-sm" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Expiration</label>
                      <input 
                        required 
                        maxLength={5} 
                        value={cardExpiry} 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.length > 2) {
                            val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                          }
                          setCardExpiry(val);
                        }} 
                        placeholder="MM/YY" 
                        className="merch-input py-4 rounded-xl text-sm text-center" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">CVC Security</label>
                      <input 
                        required 
                        type="password" 
                        maxLength={4} 
                        value={cardCvc} 
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))} 
                        placeholder="•••" 
                        className="merch-input py-4 rounded-xl text-sm text-center" 
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-[10px] font-light text-white/50 leading-relaxed uppercase tracking-wider">
                  ⚠️ <strong className="text-white/80">Test Overlay Rules:</strong> Input <code className="text-cardano-blue font-bold">4242 4242...</code> as card credentials. No real transaction cost will be incurred.
                </div>

                {paymentError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                    {paymentError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={paymentLoading} 
                  className="w-full py-5 rounded-2xl bg-cardano-blue text-white font-heading font-black text-lg uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <>
                      <Command className="w-5 h-5 animate-spin" />
                      <span>AUTHORIZING FUNDS...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>PAY NOW — ${(total + shippingCost).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  
  return (
    <main className="min-h-screen bg-charcoal text-white font-body selection:bg-cardano-blue selection:text-white">
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 border-b border-white/5 mix-blend-difference">
        <button onClick={() => router.back()} className="flex items-center gap-3 md:gap-4 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.3em] group border-none bg-transparent cursor-pointer">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Vault</span>
        </button>
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
        <div className="hidden sm:block w-[100px]" />
      </nav>

      <Suspense fallback={<div className="text-center py-32 font-heading font-black uppercase tracking-[0.5em] opacity-20 animate-pulse">Initializing Data Stream...</div>}>
        <CheckoutContent />
      </Suspense>

      <footer className="py-10 text-center opacity-10">
         <span className="text-[9px] font-black uppercase tracking-[0.5em]">Global Decentralized Fulfillment System</span>
      </footer>
    </main>
  );
}
