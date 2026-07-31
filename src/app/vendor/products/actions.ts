"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDefaultCategoryForShopType } from "@/lib/categories";

async function getOwnShop(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("shops").select("id, category").eq("vendor_id", userId).maybeSingle();
  return data ?? null;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

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
    const path = `${shopId}/${slugify(productName)}-${Date.now()}.${ext}`;

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

// Directly upload a file (from a vendor's <input type="file">) to Supabase
// Storage and return its public URL, or null if the file is missing/invalid.
async function uploadFileToStorage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string,
  productName: string,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return null;
  if (!file.type.startsWith("image/")) return null;

  const buf = new Uint8Array(await file.arrayBuffer());
  const extGuess = file.type.split("/")[1]?.split(";")[0] || "jpg";
  const ext = ["jpeg", "jpg", "png", "webp", "gif"].includes(extGuess) ? extGuess : "jpg";
  const path = `${shopId}/${slugify(productName)}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("products").upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (error) return null;

  const { data } = supabase.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const shop = await getOwnShop(supabase, user.id);
  if (!shop) return;

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price") || 0);
  const stockQty = Number(formData.get("stock_qty") || 0);
  const category = String(formData.get("category") || "").trim() || getDefaultCategoryForShopType(shop.category);
  const genericName = String(formData.get("generic_name") || "").trim();
  const imageUrlRaw = String(formData.get("image_url") || "").trim();
  const imageFile = formData.get("image");

  if (!name || price < 0) return;

  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    imageUrl = await uploadFileToStorage(supabase, shop.id, name, imageFile);
  } else if (imageUrlRaw) {
    imageUrl = await mirrorImageToStorage(supabase, shop.id, name, imageUrlRaw);
  }

  await supabase.from("products").insert({
    shop_id: shop.id,
    name,
    description,
    price,
    stock_qty: stockQty,
    category,
    generic_name: genericName || null,
    image_url: imageUrl,
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

// Uploads a single product image file and returns its public storage URL.
// Used by the vendor edit form (a controlled React form, not a plain
// <form action> submit) so vendors can attach a photo from their device.
export async function uploadProductImageFile(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const shop = await getOwnShop(supabase, user.id);
  if (!shop) return { error: "No shop found." };

  const file = formData.get("image");
  const name = String(formData.get("name") || "product");
  if (!(file instanceof File) || file.size === 0) return { error: "No file provided." };
  if (file.size > 5 * 1024 * 1024) return { error: "Image must be under 5MB." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };

  const url = await uploadFileToStorage(supabase, shop.id, name, file);
  if (!url) return { error: "Upload failed. Please try again." };
  return { url };
}

export async function updateProduct(
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const shop = await getOwnShop(supabase, user.id);

  const name = data.name.trim();
  const description = data.description.trim();
  const price = Number(data.price);
  const stockQty = Number(data.stock_qty);
  const imageUrlRaw = data.image_url.trim();
  const category = data.category.trim() || "Other";
  const genericName = data.generic_name.trim();

  if (!name || !Number.isFinite(price) || price < 0) return;

  const imageUrl = imageUrlRaw && shop ? await mirrorImageToStorage(supabase, shop.id, name, imageUrlRaw) : imageUrlRaw || null;

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

  revalidatePath("/vendor/products");
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

export async function bulkUpsertProducts(rows: ImportRow[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { inserted: 0, updated: 0, skipped: rows.length };

  const shop = await getOwnShop(supabase, user.id);
  if (!shop) return { inserted: 0, updated: 0, skipped: rows.length };

  const { data: existing } = await supabase
    .from("products")
    .select("id, name")
    .eq("shop_id", shop.id);

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
    const imageUrl = imageUrlRaw ? await mirrorImageToStorage(supabase, shop.id, name, imageUrlRaw) : null;

    const payload = {
      name,
      description: row.description?.trim() || "",
      price,
      stock_qty: Number.isFinite(stockQtyNum) ? stockQtyNum : 0,
      image_url: imageUrl,
      category: row.category?.trim() || getDefaultCategoryForShopType(shop.category),
      generic_name: row.generic_name?.trim() || null,
      active: row.active !== false,
    };

    const existingId = byName.get(name.toLowerCase());
    if (existingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", existingId);
      if (error) skipped++;
      else updated++;
    } else {
      const { error } = await supabase.from("products").insert({ ...payload, shop_id: shop.id });
      if (error) skipped++;
      else inserted++;
    }
  }

  revalidatePath("/vendor/products");
  return { inserted, updated, skipped };
}
