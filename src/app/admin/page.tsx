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

  const stats = [
    { label: "Total shops", value: shopCount ?? 0 },
    { label: "Pending approval", value: pendingCount ?? 0 },
    { label: "Total orders", value: orderCount ?? 0 },
    { label: "Registered riders", value: riderCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
