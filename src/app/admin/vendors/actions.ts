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

export type CloneShopState = { error?: string; ok?: boolean } | null;

// Duplicates an existing shop (all fields + its full product catalog) as a
// brand-new shop with a new name. Used when a second vendor of the same
// category (electronics, pharmacy, etc.) wants to register — instead of
// building their catalog from scratch, admin clones a template shop and
// hands it to them under their own business name.
export async function cloneShop(
  sourceShopId: string,
  newName: string,
  assignMode: "none" | "existing" | "invite",
  vendorId: string,
  vendorEmail: string
): Promise<CloneShopState> {
  const supabase = await createClient();

  const name = newName.trim();
  if (!name) return { error: "New shop name is required." };

  const { data: source, error: sourceError } = await supabase
    .from("shops")
    .select("description, category, address, phone, self_delivery, latitude, longitude")
    .eq("id", sourceShopId)
    .maybeSingle();

  if (sourceError || !source) return { error: sourceError?.message || "Source shop not found." };

  const insert: Record<string, unknown> = {
    name,
    description: source.description,
    category: source.category,
    address: source.address,
    phone: source.phone,
    self_delivery: source.self_delivery,
    latitude: source.latitude,
    longitude: source.longitude,
    approved: true,
    active: true,
    vendor_id: null,
    pending_vendor_email: null,
  };

  if (assignMode === "existing" && vendorId) {
    insert.vendor_id = vendorId;
  } else if (assignMode === "invite" && vendorEmail.trim()) {
    insert.pending_vendor_email = vendorEmail.trim().toLowerCase();
  }

  const { data: newShop, error: insertError } = await supabase
    .from("shops")
    .insert(insert)
    .select("id")
    .single();

  if (insertError || !newShop) return { error: insertError?.message || "Failed to create shop." };

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "name, description, price, sale_price, image_url, stock_qty, category, department, generic_name, active"
    )
    .eq("shop_id", sourceShopId);

  if (productsError) {
    return { error: `Shop cloned, but couldn't read source products: ${productsError.message}` };
  }

  if (products && products.length > 0) {
    const rows = products.map((p) => ({ ...p, shop_id: newShop.id }));
    const BATCH = 300;
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error: batchError } = await supabase.from("products").insert(rows.slice(i, i + BATCH));
      if (batchError) {
        return { error: `Shop cloned, but product copy failed partway: ${batchError.message}` };
      }
    }
  }

  revalidatePath("/admin/vendors");
  return { ok: true };
}
