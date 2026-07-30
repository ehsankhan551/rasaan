"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to save items.", wishlisted: false };
  }

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidatePath("/wishlist");
    revalidatePath(`/products/${productId}`);
    return { error: null, wishlisted: false };
  }

  await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
  revalidatePath("/wishlist");
  revalidatePath(`/products/${productId}`);
  return { error: null, wishlisted: true };
}
