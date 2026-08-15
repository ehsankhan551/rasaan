import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ placed?: string }>;
}) {
  const { placed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/orders");

  const [{ data: orders }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, payment_method, payment_status, total, created_at, shop_id, shops(name)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("loyalty_points").eq("id", user.id).single(),
  ]);

  return (
    <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-6">
        <div>
          <p className="text-sm font-semibold text-amber-900">Rasaan Rewards</p>
          <p className="text-xs text-amber-700">Earn 1 point per Rs 100 spent on delivered orders.</p>
        </div>
        <p className="text-2xl font-bold text-amber-900">
          {profile?.loyalty_points ?? 0} <span className="text-xs font-medium text-amber-700">pts</span>
        </p>
      </div>

      {placed && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-4">
          Order placed successfully. Order ID: {placed.slice(0, 8)}
        </p>
      )}

      {(!orders || orders.length === 0) && (
        <p className="text-gray-500">You haven&apos;t placed any orders yet.</p>
      )}

      <div className="space-y-3">
        {orders?.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="block rounded-xl border border-gray-200 p-4 hover:border-green-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{(o.shops as unknown as { name: string } | null)?.name ?? "Shop"}</p>
                <p className="text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-semibold rounded-full bg-gray-100 px-2 py-1">
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-3">
              <span className="text-gray-500">
                {o.payment_method === "cod" ? "Cash on delivery" : "Paid online"} ·{" "}
                {o.payment_status}
              </span>
              <span className="font-semibold">Rs {o.total}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
