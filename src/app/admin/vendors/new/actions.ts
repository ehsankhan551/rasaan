"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type CreateShopState = { error?: string } | null;

export async function createShopAsAdmin(
  _prev: CreateShopState,
  formData: FormData
): Promise<CreateShopState> {
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
  const assignMode = String(formData.get("assign_mode") || "none");
  const vendorId = String(formData.get("vendor_id") || "").trim();
  const vendorEmail = String(formData.get("vendor_email") || "").trim();

  if (!name || !address) {
    return { error: "Shop name and address are required." };
  }

  const insert: {
    name: string;
    description: string;
    category: string;
    address: string;
    phone: string;
    approved: boolean;
    vendor_id: string | null;
    pending_vendor_email: string | null;
  } = {
    name,
    description,
    category,
    address,
    phone,
    approved: true,
    vendor_id: null,
    pending_vendor_email: null,
  };

  if (assignMode === "existing" && vendorId) {
    insert.vendor_id = vendorId;
  } else if (assignMode === "invite" && vendorEmail) {
    insert.pending_vendor_email = vendorEmail.toLowerCase();
  }

  const { error } = await supabase.from("shops").insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
