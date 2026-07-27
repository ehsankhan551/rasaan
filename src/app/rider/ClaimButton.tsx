"use client";

import { useTransition } from "react";
import { claimDelivery } from "./actions";

export default function ClaimButton({ deliveryId }: { deliveryId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => claimDelivery(deliveryId))}
      className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
    >
      {pending ? "Claiming..." : "Accept delivery"}
    </button>
  );
}
