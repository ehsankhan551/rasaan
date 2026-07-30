import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShopRow from "./ShopRow";

export default async function AdminVendorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/vendors");

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, category, address, approved, active, vendor_id, pending_vendor_email")
    .order("approved", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: vendors } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "vendor")
    .order("full_name", { ascending: true });

  const vendorMap = new Map((vendors ?? []).map((v) => [v.id, v]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Link
          href="/admin/vendors/new"
          className="rounded-lg bg-green-700 text-white text-sm font-semibold px-4 py-2"
        >
          + New Shop
        </Link>
      </div>
      {(!shops || shops.length === 0) && <p className="text-gray-500">No shops yet.</p>}
      <div className="space-y-3">
        {shops?.map((s) => (
          <ShopRow
            key={s.id}
            shop={s}
            vendors={vendors ?? []}
            vendorName={s.vendor_id ? vendorMap.get(s.vendor_id)?.full_name ?? null : null}
          />
        ))}
      </div>
    </div>
  );
}
