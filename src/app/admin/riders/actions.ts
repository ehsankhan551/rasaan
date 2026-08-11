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

export type InviteRiderState = { error?: string; success?: string } | null;

export async function inviteRider(
  _prev: InviteRiderState,
  formData: FormData
): Promise<InviteRiderState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("pending_rider_invites")
    .upsert({ email }, { onConflict: "email" });

  if (error) return { error: error.message };

  revalidatePath("/admin/riders");
  return { success: `Invited ${email} — they'll become a rider automatically when they sign up.` };
}

export async function cancelRiderInvite(email: string) {
  const supabase = await createClient();
  await supabase.from("pending_rider_invites").delete().eq("email", email);
  revalidatePath("/admin/riders");
}
