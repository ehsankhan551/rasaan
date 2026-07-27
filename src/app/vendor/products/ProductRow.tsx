"use client";

import { useState, useTransition } from "react";
import { toggleProduct, updateStock, deleteProduct } from "./actions";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_qty: number;
  active: boolean;
};

export default function ProductRow({ product }: { product: Product }) {
  const [stock, setStock] = useState(product.stock_qty);
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-3">
        <p className="font-medium text-sm">{product.name}</p>
        <p className="text-xs text-gray-500">{product.description}</p>
      </td>
      <td className="py-2 pr-3 text-sm">Rs {product.price}</td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          onBlur={() => startTransition(() => updateStock(product.id, stock))}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-3">
        <button
          disabled={pending}
          onClick={() => startTransition(() => toggleProduct(product.id, !product.active))}
          className={`text-xs font-medium rounded-full px-2 py-1 ${
            product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {product.active ? "Active" : "Hidden"}
        </button>
      </td>
      <td className="py-2">
        <button
          disabled={pending}
          onClick={() => startTransition(() => deleteProduct(product.id))}
          className="text-xs text-red-500"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
