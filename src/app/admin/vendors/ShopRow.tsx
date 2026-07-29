"use client";

import Link from "next/link";
import { useTransition } from "react";
import { approveShop, setShopActive } from "./actions";

type Shop = {
  id: string;
  name: string;
  category: string;
  address: string;
  approved: boolean;
  active: boolean;
};

export default function ShopRow({ shop }: { shop: Shop }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex justify-between items-center">
      <div>
        <p className="font-medium text-sm">{shop.name}</p>
        <p className="text-xs text-gray-500">{shop.category} · {shop.address}</p>
      </div>
      <div className="flex gap-2 items-center">
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
  );
}
