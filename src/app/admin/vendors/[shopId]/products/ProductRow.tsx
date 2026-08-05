"use client";

import { useRef, useState, useTransition } from "react";
import { toggleProduct, updateStock, deleteProduct, updateProduct, uploadProductImageFile } from "./actions";
import { DEPARTMENTS } from "@/lib/categories";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_qty: number;
  active: boolean;
  image_url: string | null;
  category: string;
  department?: string | null;
  generic_name: string | null;
};

export default function ProductRow({
  shopId,
  product,
  categories,
}: {
  shopId: string;
  product: Product;
  categories: readonly string[];
}) {
  const [stock, setStock] = useState(product.stock_qty);
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState(product.price);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [category, setCategory] = useState(product.category);
  const [department, setDepartment] = useState(product.department ?? "Unisex");
  const [genericName, setGenericName] = useState(product.generic_name ?? "");

  function cancelEdit() {
    setName(product.name);
    setDescription(product.description ?? "");
    setPrice(product.price);
    setImageUrl(product.image_url ?? "");
    setCategory(product.category);
    setDepartment(product.department ?? "Unisex");
    setGenericName(product.generic_name ?? "");
    setEditing(false);
  }

  function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("image", file);
    fd.set("name", name || product.name);
    startTransition(async () => {
      const result = await uploadProductImageFile(shopId, fd);
      if ("url" in result) {
        setImageUrl(result.url);
      } else {
        alert(result.error);
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function removeImage() {
    setImageUrl("");
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
        department,
        generic_name: genericName,
      });
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <tr className="border-t border-gray-100 bg-gray-50">
        <td className="py-3 pr-3" colSpan={8}>
          <div className="grid gap-2 sm:grid-cols-8 items-end">
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Generic Name</label>
              <input
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
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
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium mb-1">Photo</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex items-center gap-2 rounded-lg border-2 border-dashed p-1.5 transition-colors ${
                  dragOver ? "border-green-500 bg-green-50" : "border-transparent"
                }`}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="h-10 w-10 rounded object-cover border border-gray-200" />
                ) : (
                  <div className="h-10 w-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
                    None
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={uploading}
                  className="flex-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-green-700 file:text-white file:px-2 file:py-1 file:text-xs"
                />
                {imageUrl && (
                  <button type="button" onClick={removeImage} className="text-xs text-red-500 whitespace-nowrap">
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{uploading ? "Uploading..." : "Drag & drop an image here"}</p>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-10 w-10 rounded object-cover border border-gray-200"
          />
        ) : (
          <div className="h-10 w-10 rounded border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
            None
          </div>
        )}
      </td>
      <td className="py-2 pr-3">
        <p className="font-medium text-sm">{product.name}</p>
        <p className="text-xs text-gray-500">{product.description}</p>
        {product.generic_name && (
          <p className="text-xs text-gray-400">Generic: {product.generic_name}</p>
        )}
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-1">{product.category}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs text-gray-500">{product.department ?? "Unisex"}</span>
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
