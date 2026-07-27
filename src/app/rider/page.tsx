import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvailabilityToggle from "./AvailabilityToggle";
import ClaimButton from "./ClaimButton";

export default async function RiderPoolPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rider");

  const { data: statusRow } = await supabase
    .from("rider_status")
    .select("available")
    .eq("rider_id", user.id)
    .maybeSingle();

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select("id, order_id, status, orders(id, delivery_address, delivery_phone, total, shop_id, shops(name))")
    .eq("status", "unassigned")
    .order("id", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Available Deliveries</h1>
        <AvailabilityToggle available={statusRow?.available ?? false} />
      </div>

      {(!deliveries || deliveries.length === 0) && (
        <p className="text-gray-500">No open deliveries right now — check back soon.</p>
      )}

      <div className="space-y-3">
        {deliveries?.map((d) => {
          const order = d.orders as unknown as {
            shop_id: string;
            delivery_address: string;
            delivery_phone: string;
            total: number;
            shops: { name: string } | null;
          } | null;
          return (
            <div key={d.id} className="rounded-xl border border-gray-200 p-4 flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{order?.shops?.name ?? "Shop"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Deliver to: {order?.delivery_address} · {order?.delivery_phone}
                </p>
                <p className="text-xs text-gray-400 mt-1">Order total: Rs {order?.total}</p>
              </div>
              <ClaimButton deliveryId={d.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
