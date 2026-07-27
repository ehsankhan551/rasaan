"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error?: string } | null;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Incorrect email or password." };
  }

  // Route by role if no explicit "next" was requested.
  if (!next) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const dest =
      profile?.role === "vendor"
        ? "/vendor"
        : profile?.role === "rider"
        ? "/rider"
        : profile?.role === "admin"
        ? "/admin"
        : "/";
    redirect(dest);
  }

  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
