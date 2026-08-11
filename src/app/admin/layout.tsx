import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="mx-auto max-w-6xl px-4 flex gap-4 text-sm py-2.5">
          <Link href="/admin" className="font-medium text-gray-700 hover:text-green-700">
            Overview
          </Link>
          <Link href="/admin/vendors" className="font-medium text-gray-700 hover:text-green-700">
            Vendors
          </Link>
          <Link href="/admin/orders" className="font-medium text-gray-700 hover:text-green-700">
            Orders
          </Link>
          <Link href="/admin/riders" className="font-medium text-gray-700 hover:text-green-700">
            Riders
          </Link>
        </nav>
      </div>
      <div className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</div>
    </div>
  );
}
