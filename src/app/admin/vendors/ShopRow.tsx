"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { approveShop, setShopActive, assignVendor, inviteVendor, unassignVendor } from "./actions";

type Shop = {
  id: string;
  name: string;
  category: string;
  address: string;
  approved: boolean;
  active: boolean;
  vendor_id: string | null;
  pending_vendor_email: string | null;
};

type Vendor = { id: string; full_name: string; phone: string | null };

export default function ShopRow({
  shop,
  vendors,
  vendorName,
}: {
  shop: Shop;
  vendors: Vendor[];
  vendorName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [showAssign, setShowAssign] = useState(false);
  const [mode, setMode] = useState<"existing" | "invite">("existing");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [email, setEmail] = useState("");

  function submitAssign() {
    if (mode === "existing" && selectedVendor) {
      startTransition(() => assignVendor(shop.id, selectedVendor));
      setShowAssign(false);
    } else if (mode === "invite" && email) {
      startTransition(() => inviteVendor(shop.id, email));
      setShowAssign(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <p className="font-medium text-sm">{shop.name}</p>
          <p className="text-xs text-gray-500">
            {shop.category} · {shop.address}
          </p>
          <p className="text-xs mt-1">
            {shop.vendor_id ? (
              <span className="text-gray-600">
                Vendor: <span className="font-medium">{vendorName || "Vendor"}</span>
              </span>
            ) : shop.pending_vendor_email ? (
              <span className="text-amber-600">
                Invited: {shop.pending_vendor_email} (pending signup)
              </span>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link
            href={`/admin/vendors/${shop.id}/products`}
            className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
          >
            Manage Products
          </Link>
          <Link
            href={`/admin/vendors/${shop.id}/settings`}
            className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
          >
            Settings
          </Link>
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
          >
            {shop.vendor_id ? "Reassign Vendor" : "Assign Vendor"}
          </button>
          {(shop.vendor_id || shop.pending_vendor_email) && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => unassignVendor(shop.id))}
              className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
            >
              Unassign
            </button>
          )}
          {!shop.approved && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => approveShop(shop.id))}
              className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5"
            >
              Approve
            </button>
          )}
          {shop.approved && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => setShopActive(shop.id, !shop.active))}
              className={`rounded-lg text-xs font-medium px-3 py-1.5 ${
                shop.active ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {shop.active ? "Deactivate" : "Reactivate"}
            </button>
          )}
        </div>
      </div>

      {showAssign && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 flex flex-wrap gap-2 items-center">
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} />
              Existing vendor
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === "invite"} onChange={() => setMode("invite")} />
              Invite by email
            </label>
          </div>
          {mode === "existing" ? (
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.full_name || "Vendor"} {v.phone ? `(${v.phone})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            />
          )}
          <button
            disabled={pending}
            onClick={submitAssign}
            className="rounded-lg bg-gray-800 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            {mode === "existing" ? "Assign" : "Invite"}
          </button>
        </div>
      )}
    </div>
  );
}
