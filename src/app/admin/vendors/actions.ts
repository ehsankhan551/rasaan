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
