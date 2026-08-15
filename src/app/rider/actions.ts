"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { awardLoyaltyPoints } from "@/lib/loyalty";

export async function setAvailability(available: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("rider_status")
    .upsert({ rider_id: user.id, available, updated_at: new Date().toISOString() });

  revalidatePath("/rider");
}

export async function claimDelivery(deliveryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("deliveries")
    .update({ rider_id: user.id, status: "assigned", assigned_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .eq("status", "unassigned");

  revalidatePath("/rider");
  revalidatePath("/rider/deliveries");
}

export async function markPickedUp(deliveryId: string) {
  const supabase = await createClient();
  const { data: delivery } = await supabase
    .from("deliveries")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .select("order_id")
    .single();

  // Keep the customer-facing order timeline in sync: the moment a rider
  // physically picks up the order, it's "on the way" from the customer's
  // point of view too.
  if (delivery?.order_id) {
    await supabase.from("orders").update({ status: "out_for_delivery" }).eq("id", delivery.order_id);
  }

  revalidatePath("/rider/deliveries");
}

export async function markDelivered(deliveryId: string, orderId: string) {
  const supabase = await createClient();
  await supabase
    .from("deliveries")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", deliveryId);
  await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
  await awardLoyaltyPoints(supabase, orderId);
  revalidatePath("/rider/deliveries");
}
