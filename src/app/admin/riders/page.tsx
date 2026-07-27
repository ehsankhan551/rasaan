import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AssignForm from "./AssignForm";

export default async function AdminRidersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/riders");

  const { data: riderProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "rider");

  const { data: statuses } = await supabase.from("rider_status").select("rider_id, available");
  const availabilityMap = new Map((statuses ?? []).map((s) => [s.rider_id, s.available]));

  const riders = (riderProfiles ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
    phone: r.phone,
    available: availabilityMap.get(r.id) ?? false,
  }));

  const { data: unassigned } = await supabase
    .from("deliveries")
    .select("id, orders(delivery_address, total, shops(name))")
    .eq("status", "unassigned");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Riders</h1>

      <h2 className="font-semibold mb-3">Registered riders</h2>
      <div className="space-y-2 mb-8">
        {riders.length === 0 && <p className="text-gray-500 text-sm">No riders have signed up yet.</p>}
        {riders.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-200 px-4 py-2 flex justify-between items-center text-sm"
          >
            <span>
              {r.full_name || "Rider"} <span className="text-gray-400">{r.phone}</span>
            </span>
            <span
              className={`text-xs rounded-full px-2 py-1 font-semibold ${
                r.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {r.available ? "Online" : "Offline"}
            </span>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-3">Unassigned deliveries</h2>
      {(!unassigned || unassigned.length === 0) && (
        <p className="text-gray-500 text-sm">No deliveries waiting for a rider right now.</p>
      )}
      <div className="space-y-2">
        {unassigned?.map((d) => {
          const order = d.orders as unknown as {
            delivery_address: string;
            total: number;
            shops: { name: string } | null;
          } | null;
          return (
            <div
              key={d.id}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex justify-between items-center text-sm"
            >
              <div>
                <p className="font-medium">{order?.shops?.name ?? "Shop"}</p>
                <p className="text-xs text-gray-500">{order?.delivery_address} · Rs {order?.total}</p>
              </div>
              <AssignForm deliveryId={d.id} riders={riders} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
