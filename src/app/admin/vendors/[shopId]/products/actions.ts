"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDefaultCategoryForShopType } from "@/lib/categories";

// If image_url points to an external site, download it and re-host it in our
// own Supabase Storage bucket so it has a stable, permanent URL. If it's
// already one of our own storage URLs (or the fetch fails), it's used as-is.
async function mirrorImageToStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  productName: string,
  sourceUrl: string
): Promise<string | null> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/storage/v1/object/public/products/")) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const res = await fetch(trimmed);
    if (!res.ok) return trimmed;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return trimmed;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 5 * 1024 * 1024) return trimmed;

    const extGuess = contentType.split("/")[1]?.split(";")[0] || "jpg";
    const ext = ["jpeg", "jpg", "png", "webp", "gif"].includes(extGuess) ? extGuess : "jpg";
    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
    const path = `${shopId}/${slug}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("products").upload(path, buf, {
      contentType,
      upsert: true,
    });
    if (error) return trimmed;

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return trimmed;
  }
}

export async function addProduct(shopId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: shop } = await supabase.from("shops").select("category").eq("id", shopId).maybeSingle();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stockQty = Number(formData.get("stock_qty") || 0);
  const category = String(formData.get("category") || "").trim() || getDefaultCategoryForShopType(shop?.category);
  const genericName = String(formData.get("generic_name") || "").trim();
  const imageUrlRaw = String(formData.get("image_url") || "").trim();

  if (!name || price < 0) return;

  const imageUrl = imageUrlRaw ? await mirrorImageToStorage(supabase, shopId, name, imageUrlRaw) : null;

  await supabase.from("products").insert({
    shop_id: shopId,
    name,
    description,
    price,
    stock_qty: stockQty,
    category,
    generic_name: genericName || null,
    image_url: imageUrl,
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
  const imageUrlRaw = data.image_url.trim();
  const category = data.category.trim() || "Other";
  const genericName = data.generic_name.trim();

  if (!name || !Number.isFinite(price) || price < 0) return;

  const imageUrl = imageUrlRaw ? await mirrorImageToStorage(supabase, shopId, name, imageUrlRaw) : null;

  await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      stock_qty: Number.isFinite(stockQty) ? stockQty : 0,
      image_url: imageUrl,
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
    const imageUrlRaw = row.image_url?.trim() || "";
    const imageUrl = imageUrlRaw ? await mirrorImageToStorage(supabase, shopId, name, imageUrlRaw) : null;

    const payload = {
      name,
      description: row.description?.trim() || "",
      price,
      stock_qty: Number.isFinite(stockQtyNum) ? stockQtyNum : 0,
      image_url: imageUrl,
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
