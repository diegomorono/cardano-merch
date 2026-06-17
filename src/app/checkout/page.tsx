"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense } from "react";
import { ShoppingCart, ArrowLeft, Shield, Package, Trash2, Plus, Minus } from "lucide-react";
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
        setOrderStatus({ ok: true, msg: "¡Orden enviada exitosamente!" });
      } else {
        setOrderStatus({
          ok: false,
          msg: `Error del servidor: ${JSON.stringify(data.details || data.message)}`,
        });
      }
    } catch {
      setOrderStatus({ ok: false, msg: "Error de conexión. Intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#1A1B27] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#0033AD] transition-colors duration-200";
  const labelClass = "block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider";

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-5 gap-12">
      <div className="lg:col-span-2 order-2 lg:order-1">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-[#00E5FF]" />
          Resumen del Pedido
        </h2>
        <div className="rounded-2xl border border-white/8 bg-[#151620] p-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay productos en el carrito.</p>
          ) : (
            items.map((c) => (
              <div key={c.sku} className="flex justify-between items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Talla: {c.size} · SKU: {c.sku}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(c.sku, c.quantity - 1)} className="p-1 hover:text-[#00E5FF]"><Minus size={14} /></button>
                    <span className="text-sm font-mono w-6 text-center">{c.quantity}</span>
                    <button onClick={() => updateQuantity(c.sku, c.quantity + 1)} className="p-1 hover:text-[#00E5FF]"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-sm">${(c.price * c.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(c.sku)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
          <div className="border-t border-white/10 pt-4 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-[#00E5FF]">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 order-1 lg:order-2">
        <h1 className="text-2xl font-extrabold mb-8">Información de Envío</h1>
        {orderNumber ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-400 mb-2">¡Orden Confirmada!</h2>
            <p className="text-gray-400 text-sm mb-4">Tu orden ha sido enviada para producción.</p>
            <p className="font-mono text-xs text-gray-500">Orden # {orderNumber}</p>
            <Link href="/" className="mt-6 inline-block py-3 px-6 rounded-xl bg-[#0033AD] hover:bg-blue-700 text-white font-bold text-sm transition-colors">Seguir Comprando</Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className={labelClass}>Nombre completo *</label><input required name="name" value={shipping.name} onChange={handleChange} placeholder="Satoshi Nakamoto" className={inputClass} /></div>
              <div><label className={labelClass}>Email *</label><input required type="email" name="email" value={shipping.email} onChange={handleChange} placeholder="tu@email.com" className={inputClass} /></div>
            </div>
            <div><label className={labelClass}>Dirección *</label><input required name="address" value={shipping.address} onChange={handleChange} placeholder="Calle 123, Apto 4B" className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-5">
              <div><label className={labelClass}>Ciudad *</label><input required name="city" value={shipping.city} onChange={handleChange} placeholder="Miami" className={inputClass} /></div>
              <div><label className={labelClass}>Estado / Provincia</label><input name="state" value={shipping.state} onChange={handleChange} placeholder="Florida" className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div><label className={labelClass}>Código Postal *</label><input required name="zip_code" value={shipping.zip_code} onChange={handleChange} placeholder="33101" className={inputClass} /></div>
              <div>
                <label className={labelClass}>País *</label>
                <select required name="country_code" value={shipping.country_code} onChange={handleChange} className={inputClass}>
                  <option value="US">🇺🇸 United States</option><option value="ES">🇪🇸 España</option><option value="MX">🇲🇽 México</option><option value="AR">🇦🇷 Argentina</option><option value="CO">🇨🇴 Colombia</option><option value="GB">🇬🇧 United Kingdom</option><option value="CA">🇨🇦 Canada</option><option value="AU">🇦🇺 Australia</option><option value="DE">🇩🇪 Germany</option><option value="FR">🇫🇷 France</option>
                </select>
              </div>
            </div>
            <div><label className={labelClass}>Teléfono</label><input name="phone_number" value={shipping.phone_number} onChange={handleChange} placeholder="+1 555 0192" className={inputClass} /></div>
            <AnimatePresence>
              {orderStatus && !orderStatus.ok && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
                  {orderStatus.msg}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={loading || items.length === 0} className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "linear-gradient(135deg, #0033AD, #0055FF)", boxShadow: "0 0 30px rgba(0,51,173,0.35)" }}>
              <ShoppingCart className="w-5 h-5" />
              {loading ? "Enviando a POPCustoms..." : `Confirmar Orden — $${total.toFixed(2)}`}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#0A0B10] text-white">
      <nav className="relative z-20 flex items-center gap-4 px-8 py-5 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"><ArrowLeft className="w-4 h-4" /><span>Volver</span></Link>
        <div className="flex items-center gap-3 h-10">
          <img src="/logo.jpg" alt="Logo" className="h-full rounded-full object-cover" />
          <img src="/logo-name.png" alt="Cardano Merch" className="h-full object-contain" />
        </div>
      </nav>
      <Suspense fallback={<div className="text-center py-32">Cargando...</div>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
