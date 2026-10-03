"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string;
  productType: "course" | "book" | "exam";
  productId: string;
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  variant?: "pdf" | "hardcopy";
  duration?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  isPhysical: boolean;
};

export type CartInput = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

type CartValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (item: CartInput) => { ok: boolean; error?: string };
  remove: (key: string) => void;
  setQuantity: (key: string, qty: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "shohoz_cart";
const CartContext = createContext<CartValue | null>(null);

function makeKey(i: Pick<CartItem, "productType" | "productId" | "variant" | "duration">) {
  return [i.productType, i.productId, i.variant ?? "", i.duration ?? ""].join("::");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && i.productId && i.quantity > 0));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const add = useCallback(
    (item: CartInput): { ok: boolean; error?: string } => {
      // Hardcopy books cannot be mixed with online (PDF/exam) items in one cart.
      const hasPhysical = items.some((i) => i.isPhysical);
      const hasDigital = items.some((i) => !i.isPhysical);
      if (item.isPhysical && hasDigital) {
        return { ok: false, error: "কার্টে PDF/Exam আছে — হার্ডকপির সাথে একসাথে নেওয়া যাবে না।" };
      }
      if (!item.isPhysical && hasPhysical) {
        return { ok: false, error: "কার্টে হার্ডকপি বই আছে — PDF/Exam আপাতত নেওয়া যাবে না।" };
      }
      setItems((prev) => {
        const key = makeKey(item);
        const existing = prev.find((p) => p.key === key);
        const qty = item.quantity ?? 1;
        if (existing) {
          return prev.map((p) => (p.key === key ? { ...p, quantity: p.quantity + qty } : p));
        }
        return [...prev, { ...item, key, quantity: qty }];
      });
      return { ok: true };
    },
    [items],
  );

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);

  const setQuantity = useCallback(
    (key: string, qty: number) =>
      setItems((prev) => prev.map((p) => (p.key === key ? { ...p, quantity: Math.max(1, Math.min(99, qty)) } : p))),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { items, count, subtotal, ready, add, remove, setQuantity, clear };
  }, [items, ready, add, remove, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
