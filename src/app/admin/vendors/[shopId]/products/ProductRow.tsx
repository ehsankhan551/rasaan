"use client";

import { useState, useTransition } from "react";
import { toggleProduct, updateStock, deleteProduct, updateProduct } from "./actions";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_qty: number;
  active: boolean;
  image_url: string | null;
  category: string;
};

export default function ProductRow({ shopId, product }: { shopId: string; product: Product }) {
  const [stock, setStock] = useState(product.stock_qty);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(product.price);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [category, setCategory] = useState(product.category);

  function cancelEdit() {
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(product.price);
    setImageUrl(product.image_url ?? "");
    setCategory(product.category);
    setEditing(false);
  }

  function saveEdit() {
    startTransition(async () => {
      await updateProduct(shopId, product.id, {
        name,
        description,
        price,
        stock_qty: stock,
        image_url: imageUrl,
        category,
      });
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <tr className="border-t border-gray-100 bg-gray-50">
        <td className="py-3 pr-3" colSpan={6}>
          <div className="grid gap-2 sm:grid-cols-6 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price (Rs)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={saveEdit}
                className="rounded-lg bg-green-700 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
              >
                {pending ? "Saving..." : "Save"}
              </button>
              <button
                disabled={pending}
                onClick={cancelEdit}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Image URL</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-3">
        <p className="font-medium text-sm">{product.name}</p>
        <p className="text-xs text-gray-500">{product.description}</p>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-1">{product.category}</span>
      </td>
      <td className="py-2 pr-3 text-sm">Rs {product.price}</td>
      <td className="py-2 pr-3">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          onBlur={() => startTransition(() => updateStock(shopId, product.id, stock))}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-3">
        <button
          disabled={pending}
          onClick={() => startTransition(() => toggleProduct(shopId, product.id, !product.active))}
          className={`text-xs font-medium rounded-full px-2 py-1 ${
            product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {product.active ? "Active" : "Hidden"}
        </button>
      </td>
      <td className="py-2">
        <div className="flex gap-3">
          <button disabled={pending} onClick={() => setEditing(true)} className="text-xs text-blue-600">
            Edit
          </button>
          <button
            disabled={pending}
            onClick={() => startTransition(() => deleteProduct(shopId, product.id))}
            className="text-xs text-red-500"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
