import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const [{ count: shopCount }, { count: pendingCount }, { count: orderCount }, { count: riderCount }] =
    await Promise.all([
      supabase.from("shops").select("id", { count: "exact", head: true }),
      supabase.from("shops").select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "rider"),
    ]);

  const { data: myShops } = await supabase
    .from("shops")
    .select("id, name, category, approved, active")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const stats = [
    { label: "Total shops", value: shopCount ?? 0 },
    { label: "Pending approval", value: pendingCount ?? 0 },
    { label: "Total orders", value: orderCount ?? 0 },
    { label: "Registered riders", value: riderCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {myShops && myShops.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">My Shops</h2>
          <div className="space-y-3">
            {myShops.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">
                    {s.category} ·{" "}
                    {s.approved ? (s.active ? "Active" : "Deactivated") : "Pending approval"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/vendors/${s.id}/products`}
                    className="rounded-lg bg-green-700 text-white text-xs font-medium px-3 py-1.5"
                  >
                    Manage Products
                  </Link>
                  <Link
                    href={`/admin/vendors/${s.id}/settings`}
                    className="rounded-lg border border-gray-300 text-xs font-medium px-3 py-1.5 text-gray-700"
                  >
                    Shop Settings
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/admin/vendors"
        className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
      >
        Manage all vendors →
      </Link>
    </div>
  );
}
