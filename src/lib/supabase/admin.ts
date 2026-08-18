import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged server-side operations (creating auth
// users directly, bypassing RLS). Only ever import this into server actions
// or route handlers -- never into client components. SUPABASE_SERVICE_ROLE_KEY
// must stay server-only (no NEXT_PUBLIC_ prefix) since it grants full admin
// access to the database and every user's auth record.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
