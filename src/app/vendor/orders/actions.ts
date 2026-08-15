"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { awardLoyaltyPoints } from "@/lib/loyalty";

const NEXT_STATUS: Record<string, string> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};

export async function advanceOrderStatus(orderId: string, currentStatus: string) {
  const next = NEXT_STATUS[currentStatus];
  if (!next) return;
  const supabase = await createClient();
  await supabase.from("orders").update({ status: next }).eq("id", orderId);
  if (next === "delivered") {
    await awardLoyaltyPoints(supabase, orderId);
  }
  revalidatePath("/vendor/orders");
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  revalidatePath("/vendor/orders");
}

// Hand an order off to a real third-party courier company (TCS, Leopards,
// PostEx, etc.) instead of self-delivering it. Records the courier name +
// tracking number the vendor got from that courier's own portal, and moves
// the order to "out for delivery" so the customer's timeline reflects it.
export async function setCourierInfo(orderId: string, currentStatus: string, courierName: string, trackingNumber: string) {
  if (!courierName.trim()) return;
  const supabase = await createClient();
  const update: Record<string, string> = {
    courier_name: courierName.trim(),
    courier_tracking_number: trackingNumber.trim(),
  };
  // Only push the status forward, never backward past where it already is.
  if (!["out_for_delivery", "delivered", "cancelled"].includes(currentStatus)) {
    update.status = "out_for_delivery";
  }
  await supabase.from("orders").update(update).eq("id", orderId);
  revalidatePath("/vendor/orders");
}
