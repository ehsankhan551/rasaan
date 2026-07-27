"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ShopFormState = { error?: string; success?: boolean } | null;

export async function saveShop(_prev: ShopFormState, formData: FormData): Promise<ShopFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "general").trim();
  const address = String(formData.get("address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const selfDelivery = formData.get("self_delivery") === "on";
  const shopId = String(formData.get("shop_id") || "");

  if (!name || !address) {
    return { error: "Shop name and address are required." };
  }

  if (shopId) {
    const { error } = await supabase
      .from("shops")
      .update({ name, description, category, address, phone, self_delivery: selfDelivery })
      .eq("id", shopId)
      .eq("vendor_id", user.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("shops").insert({
      vendor_id: user.id,
      name,
      description,
      category,
      address,
      phone,
      self_delivery: selfDelivery,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/vendor/shop");
  revalidatePath("/vendor");
  return { success: true };
}
