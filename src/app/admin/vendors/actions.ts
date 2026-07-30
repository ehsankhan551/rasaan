"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveShop(shopId: string) {
  const supabase = await createClient();
  await supabase.from("shops").update({ approved: true }).eq("id", shopId);
  revalidatePath("/admin/vendors");
}

export async function setShopActive(shopId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("shops").update({ active }).eq("id", shopId);
  revalidatePath("/admin/vendors");
}

export async function assignVendor(shopId: string, vendorId: string) {
  if (!vendorId) return;
  const supabase = await createClient();
  await supabase
    .from("shops")
    .update({ vendor_id: vendorId, pending_vendor_email: null })
    .eq("id", shopId);
  revalidatePath("/admin/vendors");
}

export async function inviteVendor(shopId: string, email: string) {
  if (!email) return;
  const supabase = await createClient();
  await supabase
    .from("shops")
    .update({ pending_vendor_email: email.trim().toLowerCase(), vendor_id: null })
    .eq("id", shopId);
  revalidatePath("/admin/vendors");
}

export async function unassignVendor(shopId: string) {
  const supabase = await createClient();
  await supabase
    .from("shops")
    .update({ vendor_id: null, pending_vendor_email: null })
    .eq("id", shopId);
  revalidatePath("/admin/vendors");
}
