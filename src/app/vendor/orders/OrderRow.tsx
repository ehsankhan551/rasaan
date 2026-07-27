"use client";

import { useTransition } from "react";
import { advanceOrderStatus, cancelOrder } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const NEXT_LABEL: Record<string, string> = {
  pending: "Accept order",
  accepted: "Start preparing",
  preparing: "Mark ready",
  ready: "Send out for delivery",
  out_for_delivery: "Mark delivered",
};

type Order = {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_mode: string;
  total: number;
  created_at: string;
  delivery_address: string;
  delivery_phone: string;
};

export default function OrderRow({ order }: { order: Order }) {
  const [pending, startTransition] = useTransition();
  const canAdvance = NEXT_LABEL[order.status];
  const canCancel = !["delivered", "cancelled"].includes(order.status);

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {order.delivery_address} · {order.delivery_phone}
          </p>
          <p className="text-xs text-gray-500">
            {order.payment_method === "cod" ? "Cash on delivery" : "Paid online"} ·{" "}
            {order.delivery_mode === "platform" ? "Rider delivery" : "Self delivery"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold rounded-full bg-gray-100 px-2 py-1">
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
          <p className="font-semibold text-sm mt-1">Rs {order.total}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {canAdvance && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => advanceOrderStatus(order.id, order.status))}
            className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5"
          >
            {NEXT_LABEL[order.status]}
          </button>
        )}
        {canCancel && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => cancelOrder(order.id))}
            className="rounded-lg border border-red-300 text-red-600 text-xs font-medium px-3 py-1.5"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
