"use client";

import { useActionState, useState } from "react";
import { saveShop, type ShopFormState } from "./actions";
import { SHOP_TYPES } from "@/lib/categories";

type Shop = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string;
  phone: string | null;
  self_delivery: boolean;
  approved: boolean;
  latitude: number | null;
  longitude: number | null;
};

const initialState: ShopFormState = null;

export default function ShopForm({ shop }: { shop: Shop | null }) {
  const [state, formAction, pending] = useActionState(saveShop, initialState);
  const [lat, setLat] = useState(shop?.latitude != null ? String(shop.latitude) : "");
  const [lng, setLng] = useState(shop?.longitude != null ? String(shop.longitude) : "");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      (err) => {
        setLocError(err.message || "Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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
          {SHOP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
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

      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-medium mb-1">Shop location</p>
        <p className="text-xs text-gray-500 mb-3">
          Used to show your shop to nearby customers on the homepage.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Latitude</label>
            <input
              name="latitude"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="e.g. 34.1453"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Longitude</label>
            <input
              name="longitude"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="e.g. 71.7444"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
        >
          {locating ? "Locating..." : "Use my current location"}
        </button>
        {locError && <p className="text-xs text-red-500 mt-2">{locError}</p>}
      </div>

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
