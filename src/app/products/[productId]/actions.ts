"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitReview(productId: string, rating: number, comment: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to leave a review." };
  }

  const r = Math.round(Number(rating));
  if (!Number.isFinite(r) || r < 1 || r > 5) {
    return { error: "Invalid rating." };
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: productId,
      user_id: user.id,
      rating: r,
      comment: comment.trim() || null,
    },
    { onConflict: "product_id,user_id" }
  );

  if (error) {
    return { error: "Could not submit review. Please try again." };
  }

  revalidatePath(`/products/${productId}`);
  return { error: null };
}
