"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { approveShop, setShopActive, assignVendor, inviteVendor, createVendorLogin, unassignVendor, cloneShop } from "./actions";

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
  const [mode, setMode] = useState<"existing" | "invite" | "create">("existing");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [email, setEmail] = useState("");

  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setCreatePassword(out);
  }

  const [showClone, setShowClone] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneMode, setCloneMode] = useState<"none" | "existing" | "invite">("none");
  const [cloneVendor, setCloneVendor] = useState("");
  const [cloneEmail, setCloneEmail] = useState("");
  const [cloning, setCloning] = useState(false);

  function submitAssign() {
    if (mode === "existing" && selectedVendor) {
      startTransition(() => assignVendor(shop.id, selectedVendor));
      setShowAssign(false);
    } else if (mode === "invite" && email) {
      startTransition(() => inviteVendor(shop.id, email));
      setShowAssign(false);
    } else if (mode === "create") {
      if (!createEmail.trim() || !createPassword.trim()) {
        setCreateError("Enter an email and password.");
        return;
      }
      setCreateError("");
      setCreatingLogin(true);
      startTransition(async () => {
        const res = await createVendorLogin(shop.id, createEmail, createName, createPassword);
        setCreatingLogin(false);
        if (res?.error) {
          setCreateError(res.error);
          return;
        }
        setCreatedInfo({ email: createEmail.trim().toLowerCase(), password: createPassword });
        setCreateEmail("");
        setCreateName("");
        setCreatePassword("");
      });
    }
  }

  function submitClone() {
    if (!cloneName.trim()) {
      alert("Enter a name for the new shop.");
      return;
    }
    setCloning(true);
    startTransition(async () => {
      const result = await cloneShop(shop.id, cloneName, cloneMode, cloneVendor, cloneEmail);
      setCloning(false);
      if (result?.error) {
        alert(result.error);
        return;
      }
      setShowClone(false);
      setCloneName("");
      setCloneMode("none");
      setCloneVendor("");
      setCloneEmail("");
    });
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
          <button
            onClick={() => setShowClone((v) => !v)}
            className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
          >
            Clone Store
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
            <label className="flex items-center gap-1">
              <input type="radio" checked={mode === "create"} onChange={() => setMode("create")} />
              Create login
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
          ) : mode === "invite" ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            />
          ) : (
            <div className="w-full space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Full name"
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Password"
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  className="rounded-lg bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1"
                >
                  Generate
                </button>
              </div>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              {createdInfo && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                  Login created: <span className="font-medium">{createdInfo.email}</span> / password{" "}
                  <span className="font-medium">{createdInfo.password}</span> — copy this now and send it to the
                  vendor, it won't be shown again.
                </p>
              )}
            </div>
          )}
          {mode !== "create" && (
            <button
              disabled={pending}
              onClick={submitAssign}
              className="rounded-lg bg-gray-800 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
            >
              {mode === "existing" ? "Assign" : "Invite"}
            </button>
          )}
          {mode === "create" && (
            <button
              disabled={pending || creatingLogin}
              onClick={submitAssign}
              className="rounded-lg bg-gray-800 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
            >
              {creatingLogin ? "Creating..." : "Create login"}
            </button>
          )}
        </div>
      )}

      {showClone && (
        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
          <p className="text-xs text-gray-600">
            Duplicates <span className="font-medium">{shop.name}</span> ({shop.category}) — same category, address
            and full product catalog — as a brand-new shop under a new name. Use this when another vendor in the
            same category wants to register.
          </p>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            placeholder={`e.g. ${shop.name} (New Branch)`}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          />
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={cloneMode === "none"} onChange={() => setCloneMode("none")} />
              Leave unassigned
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={cloneMode === "existing"} onChange={() => setCloneMode("existing")} />
              Existing vendor
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={cloneMode === "invite"} onChange={() => setCloneMode("invite")} />
              Invite by email
            </label>
          </div>
          {cloneMode === "existing" && (
            <select
              value={cloneVendor}
              onChange={(e) => setCloneVendor(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="">Select a vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.full_name || "Vendor"} {v.phone ? `(${v.phone})` : ""}
                </option>
              ))}
            </select>
          )}
          {cloneMode === "invite" && (
            <input
              type="email"
              value={cloneEmail}
              onChange={(e) => setCloneEmail(e.target.value)}
              placeholder="newvendor@example.com"
              className="w-full rounded-lg border border-gray-300 px-2 py-1 text-xs"
            />
          )}
          <button
            disabled={cloning}
            onClick={submitClone}
            className="rounded-lg bg-blue-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            {cloning ? "Cloning..." : "Clone Store"}
          </button>
        </div>
      )}
    </div>
  );
}
