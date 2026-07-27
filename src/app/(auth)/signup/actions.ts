"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SignupState = { error?: string } | null;

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "customer");

  if (!email || !password || !fullName) {
    return { error: "Please fill in your name, email, and password." };
  }
  if (!["customer", "vendor", "rider"].includes(role)) {
    return { error: "Invalid account type." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?justSignedUp=1");
}
