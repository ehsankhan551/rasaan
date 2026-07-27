"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOwnShopId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("shops").select("id").eq("vendor_id", userId).maybeSingle();
  return data?.id ?? null;
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const shopId = await getOwnShopId(supabase, user.id);
  if (!shopId) return;

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stockQty = Number(formData.get("stock_qty") || 0);

  if (!name || price < 0) return;

  await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description,
    price,
    stock_qty: stockQty,
  });

  revalidatePath("/vendor/products");
}

export async function toggleProduct(productId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ active }).eq("id", productId);
  revalidatePath("/vendor/products");
}

export async function updateStock(productId: string, stockQty: number) {
  const supabase = await createClient();
  await supabase.from("products").update({ stock_qty: stockQty }).eq("id", productId);
  revalidatePath("/vendor/products");
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/vendor/products");
}
