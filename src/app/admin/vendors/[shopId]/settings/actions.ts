"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShopFormState = { error?: string; success?: boolean } | null;

export async function saveShopSettings(
  shopId: string,
  _prev: ShopFormState,
  formData: FormData
): Promise<ShopFormState> {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "general").trim();
  const address = String(formData.get("address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const selfDelivery = formData.get("self_delivery") === "on";
  const latRaw = String(formData.get("latitude") || "").trim();
  const lngRaw = String(formData.get("longitude") || "").trim();
  const latitude = latRaw ? Number(latRaw) : null;
  const longitude = lngRaw ? Number(lngRaw) : null;

  if (!name || !address) {
    return { error: "Shop name and address are required." };
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name,
      description,
      category,
      address,
      phone,
      self_delivery: selfDelivery,
      latitude,
      longitude,
    })
    .eq("id", shopId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/vendors/${shopId}/settings`);
  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
  return { success: true };
}
