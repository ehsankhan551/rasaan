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

export async function askQuestion(productId: string, question: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in to ask a question." };
  }

  const q = question.trim();
  if (!q) return { error: "Please enter a question." };
  if (q.length > 500) return { error: "Question is too long (max 500 characters)." };

  const { error } = await supabase.from("product_questions").insert({
    product_id: productId,
    customer_id: user.id,
    question: q,
  });

  if (error) {
    return { error: "Could not submit question. Please try again." };
  }

  revalidatePath(`/products/${productId}`);
  return { error: null };
}

// Answering is restricted by RLS to the product's own shop vendor or an
// admin -- this action just surfaces a friendly error if that check fails.
export async function answerQuestion(questionId: string, productId: string, answer: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please log in." };
  }

  const a = answer.trim();
  if (!a) return { error: "Please enter an answer." };

  const { error, count } = await supabase
    .from("product_questions")
    .update(
      { answer: a, answered_by: user.id, answered_at: new Date().toISOString() },
      { count: "exact" }
    )
    .eq("id", questionId);

  if (error || count === 0) {
    return { error: "Could not submit answer. Only the shop that sells this product can answer." };
  }

  revalidatePath(`/products/${productId}`);
  return { error: null };
}
