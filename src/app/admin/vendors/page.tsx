import { redirect } from "next/navigation";
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
    .select("id, name, category, address, approved, active")
    .order("approved", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vendors</h1>
      {(!shops || shops.length === 0) && <p className="text-gray-500">No shops yet.</p>}
      <div className="space-y-3">
        {shops?.map((s) => (
          <ShopRow key={s.id} shop={s} />
        ))}
      </div>
    </div>
  );
}
