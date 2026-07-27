"use client";

import { useActionState } from "react";
import { saveShop, type ShopFormState } from "./actions";

type Shop = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string;
  phone: string | null;
  self_delivery: boolean;
  approved: boolean;
};

const initialState: ShopFormState = null;

export default function ShopForm({ shop }: { shop: Shop | null }) {
  const [state, formAction, pending] = useActionState(saveShop, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      {shop && <input type="hidden" name="shop_id" value={shop.id} />}

      <div>
        <label className="block text-sm font-medium mb-1">Shop name</label>
        <input
          name="name"
          defaultValue={shop?.name}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          name="category"
          defaultValue={shop?.category ?? "general"}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="general">General store</option>
          <option value="grocery">Grocery</option>
          <option value="food">Food / Restaurant</option>
          <option value="bakery">Bakery</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={shop?.description ?? ""}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          name="address"
          defaultValue={shop?.address}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Street, Charsadda / Harichand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          name="phone"
          defaultValue={shop?.phone ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="self_delivery" defaultChecked={shop?.self_delivery} />
        My shop can deliver its own orders (in addition to platform riders)
      </label>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Saved. {!shop?.approved && "An admin will review and approve your shop shortly."}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Saving..." : shop ? "Save changes" : "Create shop"}
      </button>
    </form>
  );
}
