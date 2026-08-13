import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderRow from "./OrderRow";

export default async function VendorOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/orders");

  const { data: shop } = await supabase.from("shops").select("id").eq("vendor_id", user.id).maybeSingle();

  if (!shop) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Orders</h1>
        <p className="text-gray-500">Create your shop profile first.</p>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_status, delivery_mode, total, created_at, delivery_address, delivery_phone, courier_name, courier_tracking_number"
    )
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      {(!orders || orders.length === 0) ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
