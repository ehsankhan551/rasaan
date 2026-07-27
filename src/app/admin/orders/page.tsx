import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, payment_method, payment_status, delivery_mode, total, created_at, shops(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Orders</h1>
      {(!orders || orders.length === 0) && <p className="text-gray-500">No orders yet.</p>}
      <div className="space-y-2">
        {orders?.map((o) => {
          const shop = o.shops as unknown as { name: string } | null;
          return (
            <div
              key={o.id}
              className="rounded-lg border border-gray-200 px-4 py-3 flex justify-between items-center text-sm"
            >
              <div>
                <span className="font-medium">#{o.id.slice(0, 8)}</span>{" "}
                <span className="text-gray-500">{shop?.name ?? "Shop"}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{o.payment_method === "cod" ? "COD" : "Online"}</span>
                <span>{o.delivery_mode === "platform" ? "Rider" : "Self"}</span>
                <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
                <span className="font-semibold text-gray-800">Rs {o.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
