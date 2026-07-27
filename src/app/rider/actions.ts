"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  await supabase
    .from("deliveries")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
    .eq("id", deliveryId);
  revalidatePath("/rider/deliveries");
}

export async function markDelivered(deliveryId: string, orderId: string) {
  const supabase = await createClient();
  await supabase
    .from("deliveries")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", deliveryId);
  await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
  revalidatePath("/rider/deliveries");
}
