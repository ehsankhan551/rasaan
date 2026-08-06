import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AssignForm from "./AssignForm";

const STATUS_LABEL: Record<string, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  picked_up: "Picked up",
  delivered: "Delivered",
};

const STATUS_BADGE: Record<string, string> = {
  unassigned: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  picked_up: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
};

type OrderInfo = {
  delivery_address: string;
  delivery_phone: string;
  total: number;
  shops: { name: string } | null;
};

function isToday(iso: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default async function AdminRidersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/riders");

  const [
    { data: riderProfiles },
    { data: statuses },
    { data: allRiderDeliveries },
    { data: unassigned },
    { data: active },
    { data: recentDelivered },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").eq("role", "rider"),
    supabase.from("rider_status").select("rider_id, available"),
    supabase.from("deliveries").select("rider_id, status").not("rider_id", "is", null),
    supabase
      .from("deliveries")
      .select("id, orders(delivery_address, delivery_phone, total, shops(name))")
      .eq("status", "unassigned"),
    supabase
      .from("deliveries")
      .select("id, rider_id, status, assigned_at, orders(delivery_address, delivery_phone, total, shops(name))")
      .in("status", ["assigned", "picked_up"])
      .order("assigned_at", { ascending: false }),
    supabase
      .from("deliveries")
      .select("id, rider_id, delivered_at, orders(delivery_address, total, shops(name))")
      .eq("status", "delivered")
      .order("delivered_at", { ascending: false })
      .limit(20),
  ]);

  const availabilityMap = new Map((statuses ?? []).map((s) => [s.rider_id, s.available]));

  const activeCountMap = new Map<string, number>();
  const completedCountMap = new Map<string, number>();
  for (const d of allRiderDeliveries ?? []) {
    if (!d.rider_id) continue;
    if (d.status === "assigned" || d.status === "picked_up") {
      activeCountMap.set(d.rider_id, (activeCountMap.get(d.rider_id) ?? 0) + 1);
    } else if (d.status === "delivered") {
      completedCountMap.set(d.rider_id, (completedCountMap.get(d.rider_id) ?? 0) + 1);
    }
  }

  const riders = (riderProfiles ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name,
    phone: r.phone,
    available: availabilityMap.get(r.id) ?? false,
    activeCount: activeCountMap.get(r.id) ?? 0,
    completedCount: completedCountMap.get(r.id) ?? 0,
  }));

  const riderNameMap = new Map(riders.map((r) => [r.id, r.full_name || "Rider"]));

  const onlineCount = riders.filter((r) => r.available).length;
  const unassignedCount = unassigned?.length ?? 0;
  const activeCount = active?.length ?? 0;
  const deliveredTodayCount = (recentDelivered ?? []).filter((d) => isToday(d.delivered_at)).length;

  const stats = [
    { label: "Total Riders", value: riders.length },
    { label: "Online Now", value: onlineCount },
    { label: "Unassigned", value: unassignedCount },
    { label: "In Progress", value: activeCount },
    { label: "Delivered Today", value: deliveredTodayCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rider Control Panel</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-3">Registered riders</h2>
      <div className="space-y-2 mb-8">
        {riders.length === 0 && <p className="text-gray-500 text-sm">No riders have signed up yet.</p>}
        {riders.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm shadow-sm"
          >
            <span>
              {r.full_name || "Rider"} <span className="text-gray-400">{r.phone}</span>
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">{r.activeCount} active</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">{r.completedCount} completed</span>
              <span
                className={`rounded-full px-2 py-1 font-semibold ${
                  r.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {r.available ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-semibold mb-3">Unassigned deliveries</h2>
      {(!unassigned || unassigned.length === 0) && (
        <p className="text-gray-500 text-sm mb-8">No deliveries waiting for a rider right now.</p>
      )}
      {unassigned && unassigned.length > 0 && (
        <div className="space-y-2 mb-8">
          {unassigned.map((d) => {
            const order = d.orders as unknown as OrderInfo | null;
            return (
              <div
                key={d.id}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm"
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
      )}

      <h2 className="font-semibold mb-3">Active deliveries</h2>
      {(!active || active.length === 0) && (
        <p className="text-gray-500 text-sm mb-8">No deliveries in progress right now.</p>
      )}
      {active && active.length > 0 && (
        <div className="space-y-2 mb-8">
          {active.map((d) => {
            const order = d.orders as unknown as OrderInfo | null;
            return (
              <div
                key={d.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-wrap justify-between items-center gap-2 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium">{order?.shops?.name ?? "Shop"}</p>
                  <p className="text-xs text-gray-500">{order?.delivery_address} · Rs {order?.total}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Rider: {d.rider_id ? riderNameMap.get(d.rider_id) ?? "Rider" : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2 py-1 font-semibold ${STATUS_BADGE[d.status]}`}>
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                  <AssignForm
                    deliveryId={d.id}
                    riders={riders}
                    currentRiderId={d.rider_id}
                    label="Reassign to..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-semibold mb-3">Recently delivered</h2>
      {(!recentDelivered || recentDelivered.length === 0) && (
        <p className="text-gray-500 text-sm">No completed deliveries yet.</p>
      )}
      {recentDelivered && recentDelivered.length > 0 && (
        <div className="space-y-2">
          {recentDelivered.map((d) => {
            const order = d.orders as unknown as { delivery_address: string; total: number; shops: { name: string } | null } | null;
            return (
              <div
                key={d.id}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 flex flex-wrap justify-between items-center gap-2 text-xs"
              >
                <div>
                  <span className="font-medium">{order?.shops?.name ?? "Shop"}</span>{" "}
                  <span className="text-gray-500">· {order?.delivery_address} · Rs {order?.total}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{d.rider_id ? riderNameMap.get(d.rider_id) ?? "Rider" : "—"}</span>
                  <span>·</span>
                  <span>{d.delivered_at ? new Date(d.delivered_at).toLocaleString() : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
