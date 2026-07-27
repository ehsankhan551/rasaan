import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import CartLink from "@/components/CartLink";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    role = profile?.role ?? null;
  }

  const dashboardHref =
    role === "vendor" ? "/vendor" : role === "rider" ? "/rider" : role === "admin" ? "/admin" : null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-lg text-green-800">
          Rasaan
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/shops" className="text-gray-600 hover:text-gray-900">
            Browse Shops
          </Link>
          <CartLink />
          {!user && (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-green-700 text-white px-3 py-1.5 font-medium hover:bg-green-800"
              >
                Sign up
              </Link>
            </>
          )}
          {user && (
            <>
              {dashboardHref && (
                <Link href={dashboardHref} className="text-gray-600 hover:text-gray-900">
                  My Dashboard
                </Link>
              )}
              <form action={logout}>
                <button className="text-gray-600 hover:text-gray-900" type="submit">
                  Log out
                </button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
