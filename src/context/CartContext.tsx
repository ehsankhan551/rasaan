"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  shopId: string;
  shopName: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  shopId: string | null;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rasaan-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  // A cart can only hold products from one shop at a time (single-vendor
  // checkout keeps delivery/COD logic simple for v1).
  function addItem(item: Omit<CartItem, "qty">, qty: number = 1) {
    setItems((prev) => {
      if (prev.length > 0 && prev[0].shopId !== item.shopId) {
        // switching shops clears the cart
        return [{ ...item, qty }];
      }
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function setQty(productId: string, qty: number) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shopId = items[0]?.shopId ?? null;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clear, shopId, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
