"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "./actions";

export default function CheckoutPage() {
  const { items, shopId, total, setQty, removeItem, clear } = useCart();
  const [deliveryMode, setDeliveryMode] = useState<"vendor" | "platform">("platform");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Your cart is empty</h1>
        <Link href="/shops" className="text-green-700 font-medium">
          Browse shops
        </Link>
      </main>
    );
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(
        shopId!,
        items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        deliveryMode,
        paymentMethod,
        address,
        phone,
        notes
      );
      if (result?.error) {
        setError(result.error);
      } else {
        clear();
      }
    });
  }

  const deliveryFee = deliveryMode === "platform" ? 100 : 0;

  return (
    <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Checkout</h1>
      <p className="text-sm text-gray-500 mb-6">Ordering from {items[0].shopName}</p>

      <div className="rounded-xl border border-gray-200 divide-y">
        {items.map((i) => (
          <div key={i.productId} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{i.name}</p>
              <p className="text-xs text-gray-500">Rs {i.price} each</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={i.qty}
                onChange={(e) => setQty(i.productId, Number(e.target.value))}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                onClick={() => removeItem(i.productId)}
                className="text-xs text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rs {total}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery fee</span>
          <span>Rs {deliveryFee}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
          <span>Total</span>
          <span>Rs {total + deliveryFee}</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Delivery method</label>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={deliveryMode === "platform"}
                onChange={() => setDeliveryMode("platform")}
              />
              Rider delivery (Rs 100)
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={deliveryMode === "vendor"}
                onChange={() => setDeliveryMode("vendor")}
              />
              Shop delivers itself (free)
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment method</label>
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on delivery
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
              />
              Pay online
            </label>
          </div>
          {paymentMethod === "online" && (
            <p className="text-xs text-amber-600 mt-1">
              Online payment is running in TEST mode until a real gateway account is connected.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Delivery address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="03XXXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={pending}
          className="w-full rounded-lg bg-green-700 text-white py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Placing order..." : `Place order — Rs ${total + deliveryFee}`}
        </button>
      </div>
    </main>
  );
}
