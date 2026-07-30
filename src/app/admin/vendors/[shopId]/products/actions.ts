"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDefaultCategoryForShopType } from "@/lib/categories";

export async function addProduct(shopId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: shop } = await supabase.from("shops").select("category").eq("id", shopId).maybeSingle();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stockQty = Number(formData.get("stock_qty") || 0);
  const category = String(formData.get("category") || "").trim() || getDefaultCategoryForShopType(shop?.category);
  const genericName = String(formData.get("generic_name") || "").trim();

  if (!name || price < 0) return;

  await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description,
    price,
    stock_qty: stockQty,
    category,
    generic_name: genericName || null,
  });

  revalidatePath(`/admin/vendors/${shopId}/products`);
}

export async function toggleProduct(shopId: string, productId: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ active }).eq("id", productId);
  revalidatePath(`/admin/vendors/${shopId}/products`);
}

export async function updateStock(shopId: string, productId: string, stockQty: number) {
  const supabase = await createClient();
  await supabase.from("products").update({ stock_qty: stockQty }).eq("id", productId);
  revalidatePath(`/admin/vendors/${shopId}/products`);
}

export async function deleteProduct(shopId: string, productId: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath(`/admin/vendors/${shopId}/products`);
}

export async function updateProduct(
  shopId: string,
  productId: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock_qty: number;
    image_url: string;
    category: string;
    generic_name: string;
  }
) {
  const supabase = await createClient();

  const name = data.name.trim();
  const description = data.description.trim();
  const price = Number(data.price);
  const stockQty = Number(data.stock_qty);
  const imageUrl = data.image_url.trim();
  const category = data.category.trim() || "Other";
  const genericName = data.generic_name.trim();

  if (!name || !Number.isFinite(price) || price < 0) return;

  await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      stock_qty: Number.isFinite(stockQty) ? stockQty : 0,
      image_url: imageUrl || null,
      category,
      generic_name: genericName || null,
    })
    .eq("id", productId);

  revalidatePath(`/admin/vendors/${shopId}/products`);
}

type ImportRow = {
  name: string;
  description: string;
  price: number;
  stock_qty: number;
  image_url: string;
  category: string;
  generic_name: string;
  active: boolean;
};

export async function bulkUpsertProducts(shopId: string, rows: ImportRow[]) {
  const supabase = await createClient();

  const { data: shop } = await supabase.from("shops").select("category").eq("id", shopId).maybeSingle();

  const { data: existing } = await supabase
    .from("products")
    .select("id, name")
    .eq("shop_id", shopId);

  const byName = new Map((existing ?? []).map((p) => [p.name.trim().toLowerCase(), p.id as string]));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row.name?.trim();
    const price = Number(row.price);
    if (!name || !Number.isFinite(price) || price < 0) {
      skipped++;
      continue;
    }

    const stockQtyNum = Number(row.stock_qty);
    const payload = {
      name,
      description: row.description?.trim() || "",
      price,
      stock_qty: Number.isFinite(stockQtyNum) ? stockQtyNum : 0,
      image_url: row.image_url?.trim() || null,
      category: row.category?.trim() || getDefaultCategoryForShopType(shop?.category),
      generic_name: row.generic_name?.trim() || null,
      active: row.active !== false,
    };

    const existingId = byName.get(name.toLowerCase());
    if (existingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", existingId);
      if (error) skipped++;
      else updated++;
    } else {
      const { error } = await supabase.from("products").insert({ ...payload, shop_id: shopId });
      if (error) skipped++;
      else inserted++;
    }
  }

  revalidatePath(`/admin/vendors/${shopId}/products`);
  return { inserted, updated, skipped };
}
