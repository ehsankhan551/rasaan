import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "vendor") redirect("/");

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="mx-auto max-w-6xl px-4 flex gap-4 text-sm py-2.5">
          <Link href="/vendor" className="font-medium text-gray-700 hover:text-green-700">
            Overview
          </Link>
          <Link href="/vendor/shop" className="font-medium text-gray-700 hover:text-green-700">
            Shop Profile
          </Link>
          <Link href="/vendor/products" className="font-medium text-gray-700 hover:text-green-700">
            Products
          </Link>
          <Link href="/vendor/orders" className="font-medium text-gray-700 hover:text-green-700">
            Orders
          </Link>
        </nav>
      </div>
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</div>
    </div>
  );
}
