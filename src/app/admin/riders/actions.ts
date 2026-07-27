"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignRiderManually(deliveryId: string, riderId: string) {
  if (!riderId) return;
  const supabase = await createClient();
  await supabase
    .from("deliveries")
    .update({ rider_id: riderId, status: "assigned", assigned_at: new Date().toISOString() })
    .eq("id", deliveryId);
  revalidatePath("/admin/riders");
}
