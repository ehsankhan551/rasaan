"use client";

import { useCart } from "@/context/CartContext";

export default function AddToCartButton({
  productId,
  name,
  price,
  shopId,
  shopName,
}: {
  productId: string;
  name: string;
  price: number;
  shopId: string;
  shopName: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      onClick={() => addItem({ productId, name, price, shopId, shopName })}
      className="rounded-lg bg-green-700 text-white text-sm font-medium px-3 py-1.5 hover:bg-green-800"
    >
      Add to cart
    </button>
  );
}
