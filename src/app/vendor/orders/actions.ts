"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/vendor/orders");
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  revalidatePath("/vendor/orders");
}
