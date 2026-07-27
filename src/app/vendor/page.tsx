import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function VendorOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, approved, active")
    .eq("vendor_id", user.id)
    .maybeSingle();

  let orderCount = 0;
  let productCount = 0;
  if (shop) {
    const { count: oc } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id);
    const { count: pc } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", shop.id);
    orderCount = oc ?? 0;
    productCount = pc ?? 0;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vendor Overview</h1>

      {!shop && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-6">
          <p className="text-sm text-amber-800">
            You haven&apos;t set up your shop yet.{" "}
            <Link href="/vendor/shop" className="font-semibold underline">
              Create your shop profile
            </Link>{" "}
            to start listing products.
          </p>
        </div>
      )}

      {shop && !shop.approved && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-6">
          <p className="text-sm text-amber-800">
            <strong>{shop.name}</strong> is pending admin approval. It won&apos;t appear publicly
            until approved.
          </p>
        </div>
      )}

      {shop && shop.approved && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Products listed</p>
            <p className="text-3xl font-bold">{productCount}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total orders</p>
            <p className="text-3xl font-bold">{orderCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
