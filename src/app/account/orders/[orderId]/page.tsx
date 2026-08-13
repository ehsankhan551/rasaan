import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OrderTimeline from "@/components/OrderTimeline";
import OrderChat from "@/components/OrderChat";
import { COURIER_TRACKING_URLS } from "@/lib/couriers";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${orderId}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_status, delivery_mode, delivery_address, delivery_phone, subtotal, delivery_fee, total, notes, created_at, shop_id, shops(name), courier_name, courier_tracking_number"
    )
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("id, product_name, quantity, unit_price")
    .eq("order_id", orderId);

  let delivery: { status: string; rider_id: string | null } | null = null;
  let riderName: string | null = null;
  if (order.delivery_mode === "platform") {
    const { data: d } = await supabase
      .from("deliveries")
      .select("status, rider_id")
      .eq("order_id", orderId)
      .maybeSingle();
    delivery = d ?? null;
    if (d?.rider_id) {
      const { data: rider } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", d.rider_id)
        .maybeSingle();
      riderName = rider?.full_name ?? null;
    }
  }

  const shopName = (order.shops as unknown as { name: string } | null)?.name ?? "Shop";
  const canChat =
    order.delivery_mode === "platform" &&
    !!delivery?.rider_id &&
    order.status !== "delivered" &&
    order.status !== "cancelled";
  const trackingUrl = order.courier_name ? COURIER_TRACKING_URLS[order.courier_name] : null;

  return (
    <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10">
      <Link href="/account/orders" className="text-sm text-green-700 font-medium">
        ← My Orders
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{shopName}</h1>
      <p className="text-xs text-gray-400 mb-6">
        Order #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()}
      </p>

      <div className="rounded-xl border border-gray-200 p-4 mb-6">
        <OrderTimeline
          orderStatus={order.status}
          deliveryMode={order.delivery_mode as "vendor" | "platform"}
          deliveryStatus={delivery?.status}
        />
      </div>

      {order.courier_name && (
        <div className="rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium mb-1">Shipped via {order.courier_name}</p>
          {order.courier_tracking_number && (
            <p className="text-xs text-gray-600 mb-2">
              Tracking number: <span className="font-mono">{order.courier_tracking_number}</span>
            </p>
          )}
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 font-medium underline"
            >
              Track on {order.courier_name}&apos;s website →
            </a>
          )}
        </div>
      )}

      {order.delivery_mode === "platform" && delivery?.rider_id && (
        <div className="rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium mb-1">Your rider: {riderName ?? "Assigned"}</p>
          <p className="text-xs text-gray-500 mb-2">
            For your privacy, contact your rider through in-app chat instead of sharing personal numbers.
          </p>
          {canChat && <OrderChat orderId={order.id} viewerRole="customer" />}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-4 mb-6">
        <p className="text-sm font-semibold mb-2">Items</p>
        <div className="space-y-1">
          {items?.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>
                {it.quantity} × {it.product_name}
              </span>
              <span>Rs {(it.quantity * Number(it.unit_price)).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-2 pt-2 text-sm space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>Rs {order.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery fee</span>
            <span>Rs {order.delivery_fee}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>Rs {order.total}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
        <p>
          <span className="font-medium">Delivering to:</span> {order.delivery_address}
        </p>
        <p className="mt-1">
          <span className="font-medium">Phone:</span> {order.delivery_phone}
        </p>
        <p className="mt-1">
          <span className="font-medium">Payment:</span>{" "}
          {order.payment_method === "cod" ? "Cash on delivery" : "Paid online"} · {order.payment_status}
        </p>
      </div>
    </main>
  );
}
