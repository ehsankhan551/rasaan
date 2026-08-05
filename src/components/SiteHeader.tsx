import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import CartLink from "@/components/CartLink";

const DEPARTMENT_LINKS: { label: string; department: string }[] = [
  { label: "Men", department: "Men" },
  { label: "Women", department: "Women" },
  { label: "Kids", department: "Kids" },
  { label: "Baby", department: "Baby" },
];

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
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-bold text-lg text-green-800 shrink-0">
          Rasaan
        </Link>
        <form action="/products" method="get" className="hidden sm:flex flex-1 max-w-md">
          <input
            type="text"
            name="q"
            placeholder="Search products..."
            className="w-full rounded-l-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 hover:bg-gray-100"
          >
            Search
          </button>
        </form>
        <nav className="flex items-center gap-4 text-sm shrink-0">
          <Link href="/products" className="text-gray-600 hover:text-gray-900">
            Browse Products
          </Link>
          <Link href="/shops" className="text-gray-600 hover:text-gray-900">
            Browse Shops
          </Link>
          <Link href="/deals" className="text-red-600 font-semibold hover:text-red-700">
            🔥 Deals
          </Link>
          <Link href="/wishlist" className="text-gray-600 hover:text-gray-900">
            Wishlist
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
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl flex items-center gap-5 px-4 py-2 text-sm overflow-x-auto">
          {DEPARTMENT_LINKS.map((d) => (
            <Link
              key={d.department}
              href={`/products?department=${encodeURIComponent(d.department)}`}
              className="font-medium text-gray-600 hover:text-green-700 whitespace-nowrap"
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
