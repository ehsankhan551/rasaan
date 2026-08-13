"use client";

import { useTransition } from "react";
import { markPickedUp, markDelivered } from "../actions";
import OrderChat from "@/components/OrderChat";

export default function DeliveryActions({
  deliveryId,
  orderId,
  status,
}: {
  deliveryId: string;
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  if (status === "delivered") {
    return <span className="text-xs text-gray-400">Completed</span>;
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        {status === "assigned" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => markPickedUp(deliveryId))}
            className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            Mark picked up
          </button>
        )}
        {status === "picked_up" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => markDelivered(deliveryId, orderId))}
            className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-60"
          >
            Mark delivered
          </button>
        )}
      </div>
      <OrderChat orderId={orderId} viewerRole="rider" />
    </div>
  );
}
