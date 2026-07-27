"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function CartLink() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <Link href="/checkout" className="relative text-gray-600 hover:text-gray-900">
      Cart
      {count > 0 && (
        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-green-700 text-white text-xs w-5 h-5">
          {count}
        </span>
      )}
    </Link>
  );
}
