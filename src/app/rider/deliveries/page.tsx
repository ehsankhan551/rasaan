import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeliveryActions from "./DeliveryActions";

const STATUS_LABEL: Record<string, string> = {
  assigned: "Assigned — head to the shop",
  picked_up: "Picked up — on the way",
  delivered: "Delivered",
};

export default async function RiderDeliveriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rider/deliveries");

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      "id, order_id, status, assigned_at, orders(delivery_address, delivery_phone, total, shops(name))"
    )
    .eq("rider_id", user.id)
    .order("assigned_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Deliveries</h1>
      {(!deliveries || deliveries.length === 0) && (
        <p className="text-gray-500">You haven&apos;t accepted any deliveries yet.</p>
      )}
      <div className="space-y-3">
        {deliveries?.map((d) => {
          const order = d.orders as unknown as {
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
                <p className="text-xs font-medium text-green-700 mt-1">
                  {STATUS_LABEL[d.status] ?? d.status}
                </p>
              </div>
              <DeliveryActions deliveryId={d.id} orderId={d.order_id} status={d.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
