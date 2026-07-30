"use client";

import { useActionState, useState } from "react";
import { createShopAsAdmin, type CreateShopState } from "./actions";
import { SHOP_TYPES } from "@/lib/categories";

type Vendor = { id: string; full_name: string; phone: string | null };

const initialState: CreateShopState = null;

export default function NewShopForm({ vendors }: { vendors: Vendor[] }) {
  const [state, formAction, pending] = useActionState(createShopAsAdmin, initialState);
  const [assignMode, setAssignMode] = useState<"none" | "existing" | "invite">("none");

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Shop name</label>
        <input
          name="name"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="e.g. Rasaan Shoes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Shop type</label>
        <select
          name="category"
          defaultValue="general"
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
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          name="address"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Street, Charsadda / Harichand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input name="phone" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-medium">Assign a vendor</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="assign_mode"
              value="none"
              checked={assignMode === "none"}
              onChange={() => setAssignMode("none")}
            />
            Leave unassigned
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="assign_mode"
              value="existing"
              checked={assignMode === "existing"}
              onChange={() => setAssignMode("existing")}
            />
            Pick existing vendor
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="assign_mode"
              value="invite"
              checked={assignMode === "invite"}
              onChange={() => setAssignMode("invite")}
            />
            Invite by email
          </label>
        </div>

        {assignMode === "existing" && (
          <select
            name="vendor_id"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Select a vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.full_name || "Vendor"} {v.phone ? `(${v.phone})` : ""}
              </option>
            ))}
          </select>
        )}

        {assignMode === "invite" && (
          <input
            type="email"
            name="vendor_email"
            placeholder="vendor@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            required
          />
        )}

        {assignMode === "none" && (
          <p className="text-xs text-gray-500">
            You can assign or invite a vendor for this shop later from the Vendors list.
          </p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create shop"}
      </button>
    </form>
  );
}
