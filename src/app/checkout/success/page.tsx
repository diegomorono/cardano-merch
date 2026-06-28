"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found. Cannot confirm transaction.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function confirmOrder() {
      try {
        const res = await fetch(`/api/orders/confirm?session_id=${sessionId}`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (res.ok && data.success) {
          setOrderNumber(data.order_number);
          clearCart();
        } else {
          setError(data.message || "Failed to confirm payment with Stripe.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError("Network timeout verifying payment. Please contact support.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    confirmOrder();

    return () => {
      isMounted = false;
    };
  }, [sessionId, clearCart]);

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 min-h-[70vh] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="vault-card rounded-[3rem] p-16 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-cardano-blue/10 rounded-full flex items-center justify-center mx-auto border border-cardano-blue/20 animate-spin">
              <Command className="w-8 h-8 text-cardano-blue" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black font-heading uppercase tracking-tighter italic">Verifying Payment</h2>
              <p className="text-white/40 text-sm font-light uppercase tracking-widest">Securing ledger confirmation...</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="vault-card rounded-[3rem] p-16 text-center space-y-8 border-red-500/20"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black font-heading uppercase tracking-tighter text-red-400 italic">Verification Failed</h2>
              <p className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">{error}</p>
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-heading font-black text-lg uppercase tracking-widest transition-colors cursor-pointer border border-white/10"
              >
                Retry Verification
              </button>
              <Link 
                href="/checkout" 
                className="w-full py-4 rounded-2xl bg-transparent hover:bg-white/5 text-white/50 hover:text-white font-heading font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Return to Checkout</span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="vault-card rounded-[3rem] p-16 text-center border-cardano-blue/30"
          >
            <div className="w-24 h-24 bg-cardano-blue/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-cardano-blue/40">
              <Command className="w-10 h-10 text-cardano-blue animate-pulse" />
            </div>
            <h2 className="text-4xl font-black font-heading uppercase tracking-tighter mb-4 italic">Protocol Confirmed</h2>
            <p className="text-white/50 text-lg font-light mb-10 leading-relaxed max-w-md mx-auto">
              Your payment is secured and the fulfillment order has been generated.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 inline-block">
              <span className="block text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Manifest ID</span>
              <span className="text-xl font-heading font-black text-cardano-blue tracking-[0.2em]">{orderNumber}</span>
            </div>
            <Link href="/" className="block w-full py-5 rounded-3xl bg-white text-charcoal font-heading font-black text-xl uppercase tracking-widest hover:scale-[1.02] transition-transform duration-500">
              Return to Catalog
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuccessPage() {
  const router = useRouter();
  
  return (
    <main className="min-h-screen bg-charcoal text-white font-body selection:bg-cardano-blue selection:text-white">
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10 md:py-8 border-b border-white/5 mix-blend-difference">
        <Link href="/" className="flex items-center gap-3 md:gap-4 text-white/40 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.3em] group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Success Console</span>
        </Link>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/20 group-hover:border-cardano-blue transition-colors duration-500">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
          </div>
          <div className="flex flex-col text-white">
            <span className="font-heading font-black text-xl md:text-2xl tracking-tighter leading-none">Cardano</span>
            <span className="text-[8px] md:text-[9px] font-bold tracking-[0.4em] uppercase text-white/50">Merch</span>
          </div>
        </div>
        <div className="hidden sm:block w-[100px]" />
      </nav>

      <Suspense fallback={<div className="text-center py-32 font-heading font-black uppercase tracking-[0.5em] opacity-20 animate-pulse">Initializing Success Stream...</div>}>
        <SuccessContent />
      </Suspense>

      <footer className="py-10 text-center opacity-10">
         <span className="text-[9px] font-black uppercase tracking-[0.5em]">Global Decentralized Fulfillment System</span>
      </footer>
    </main>
  );
}
